import {APIGatewayProxyEvent} from "aws-lambda";
import {ddb} from "@libs/ddb-client";
import {GetCommand} from "@aws-sdk/lib-dynamodb";
import {
    APIGatewayClient,
    CreateApiKeyCommand,
    CreateUsagePlanCommand,
    CreateUsagePlanKeyCommand,
    GetUsagePlansCommand,
    UpdateUsagePlanCommand
} from "@aws-sdk/client-api-gateway";
import axios from "axios";
import jwt from "jsonwebtoken";
import {GetSecretValueCommand, SecretsManagerClient} from "@aws-sdk/client-secrets-manager";

const ssm = new SecretsManagerClient({});
const apigw = new APIGatewayClient({});

const discord = axios.create({
    baseURL: 'https://discord.com/api',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
})

const {AUTH_STATE_TABLE, CLIENT_ID, REDIRECT_URL, VERSION, API_ID, JWT_SECRET} = process.env;

async function createUsagePlan(id: string): Promise<string> {
    const usagePlans = await apigw.send(new GetUsagePlansCommand({
        // todo: once we have more than 500 usage plans (or users) we need to find a better way
        limit: 500,
    }))
    const existingPlan = usagePlans.items.find((usagePlan) => usagePlan.name === id);
    if (existingPlan) {
        return existingPlan.id;
    }

    const usagePlan = await apigw.send(new CreateUsagePlanCommand({
        name: id,
        throttle: {
            rateLimit: 10,
            burstLimit: 50,
        },
        quota: {
            limit: 1_000,
            period: "DAY",
        }
    }))

    await apigw.send(new UpdateUsagePlanCommand({
        usagePlanId: usagePlan.id,
        patchOperations: [{
            op: 'add',
            path: '/apiStages',
            value: `${API_ID}:${VERSION}`
        }]
    }))
    return usagePlan.id;
}

async function createApiKey(id: string, usagePlanId: string): Promise<string> {
    const apiKey = await apigw.send(new CreateApiKeyCommand({
        enabled: true,
        name: id,
    }))

    try {
        await apigw.send(new CreateUsagePlanKeyCommand({
            usagePlanId,
            keyType: "API_KEY",
            keyId: apiKey.id,
        }))
    } catch (e) {
        console.log('Failed to associate usage plan', e);
        throw e;
    }
    return apiKey.value;
}

async function getDiscordUserInfo(code: string) {

    const discordClientSecretResponse = await ssm.send(new GetSecretValueCommand({SecretId: 'discord_client_secret'}))

    const tokenResponse = await discord.post('/oauth2/token', {
        'client_id': CLIENT_ID,
        'client_secret': discordClientSecretResponse.SecretString,
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': REDIRECT_URL
    })

    return await discord.get(`/oauth2/@me`, {
        headers: {
            Authorization: `Bearer ${tokenResponse.data.access_token}`
        }
    });
}

export const main = async (event: APIGatewayProxyEvent) => {

    const {code, state} = event.queryStringParameters;
    const existingState = await ddb.send(new GetCommand({
        TableName: AUTH_STATE_TABLE,
        Key: {state}
    }))

    if (!existingState.Item) {
        return {
            statusCode: 400,
            body: JSON.stringify({error: 'State not found.'})
        }
    }

    const userInfoResponse = await getDiscordUserInfo(code);

    console.log(userInfoResponse.data)
    const {id} = userInfoResponse.data.user;

    const usagePlanId = await createUsagePlan(id);
    const apiKey = await createApiKey(id, usagePlanId);

    const token = jwt.sign({sub: id, aud: 'player', iss: VERSION, internalApiKey: apiKey}, JWT_SECRET, {});

    const body = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Trade Game - Authentication</title>
        </head>
        <body>
            <p>Success!</p>
            <p>${JSON.stringify({apiKey: token})}</p>
        </body>
        </html>`;

    return {
        statusCode: 200,
        headers: {
            ['Content-Type']: 'text/html',
        },
        body
    };
};
