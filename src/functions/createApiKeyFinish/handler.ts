import {APIGatewayProxyEvent} from "aws-lambda";
import {ddb} from "@libs/ddb-client";
import {GetCommand} from "@aws-sdk/lib-dynamodb";
import {
    APIGatewayClient,
    CreateApiKeyCommand,
    CreateUsagePlanCommand,
    CreateUsagePlanKeyCommand,
    DeleteApiKeyCommand,
    DeleteUsagePlanKeyCommand,
    GetApiKeysCommand, GetUsagePlanKeysCommand,
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
    let usagePlan = usagePlans.items.find((usagePlan) => usagePlan.name === id);
    if (!usagePlan) {
        usagePlan = await apigw.send(new CreateUsagePlanCommand({
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
    }

    const existingApiStageAttachment = usagePlan.apiStages?.find((apiStage) => apiStage.apiId === API_ID)
    if (!existingApiStageAttachment) {
        await apigw.send(new UpdateUsagePlanCommand({
            usagePlanId: usagePlan.id,
            patchOperations: [{
                op: 'add',
                path: '/apiStages',
                value: `${API_ID}:${VERSION}`
            }]
        }))
    }
    return usagePlan.id;
}

async function createApiKey(id: string, usagePlanId: string): Promise<string> {
    const existingApiKeys = await apigw.send(new GetApiKeysCommand({
        nameQuery: id,
    }))

    for (const existingApiKey of existingApiKeys.items) {
        console.log('Loading usage plan keys', {usagePlanId})
        const usagePlanKeys = await apigw.send(new GetUsagePlanKeysCommand({
            usagePlanId,
        }));
        for (const usagePlanKey of usagePlanKeys.items) {
            console.log('Deleting usage plan key', {apiKeyId: existingApiKey.id, usagePlanId: usagePlanKey.id})
            try {
                await apigw.send(new DeleteUsagePlanKeyCommand({
                    usagePlanId: usagePlanKey.id,
                    keyId: existingApiKey.id,
                }));
            } catch (e) {
                if (e.name === 'NotFoundException') {
                    console.log(e)
                    // Not sure why, but even after the list call above we seem to receive usagePlanKeys that don't exist
                } else {
                    throw e;
                }
            }
        }
        console.log('Deleting api key', {apiKeyId: existingApiKey.id})
        await apigw.send(new DeleteApiKeyCommand({
            apiKey: existingApiKey.id,
        }))
    }

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

    const {id} = userInfoResponse.data.user;

    const usagePlanId = await createUsagePlan(`${VERSION}-${id}`);
    const apiKey = await createApiKey(`${VERSION}-${id}`, usagePlanId);

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
