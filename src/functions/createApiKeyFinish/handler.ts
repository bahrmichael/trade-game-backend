import {APIGatewayProxyEvent} from "aws-lambda";
import {ddb} from "@libs/ddb-client";
import {GetCommand} from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import {GetSecretValueCommand, SecretsManagerClient} from "@aws-sdk/client-secrets-manager";
import {createToken} from "@libs/api-key";

const ssm = new SecretsManagerClient({});

const discord = axios.create({
    baseURL: 'https://discord.com/api',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
})

const {AUTH_STATE_TABLE, CLIENT_ID, REDIRECT_URL} = process.env;

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

    const {id: discordId} = userInfoResponse.data.user;

    const token = await createToken(discordId);

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
