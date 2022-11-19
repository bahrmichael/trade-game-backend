import {APIGatewayProxyEvent} from "aws-lambda";
import {ddb} from "@libs/ddb-client";
import {GetCommand} from "@aws-sdk/lib-dynamodb";
import axios from "axios";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
const ssm = new SecretsManagerClient({});

const discord = axios.create({
  baseURL: 'https://discord.com/api',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})

const {AUTH_STATE_TABLE, CLIENT_ID, REDIRECT_URL} = process.env;


export const main = async (event: APIGatewayProxyEvent) => {

  const {code, state} = event.queryStringParameters;
  const existingState = await ddb.send(new GetCommand({
    TableName: AUTH_STATE_TABLE,
    Key: {state}
  }))

  if (!existingState.Item) {
    // todo: return 401
  }

  const secretResponse = await ssm.send(new GetSecretValueCommand({SecretId: 'discord_client_secret'}))

  console.log(secretResponse.SecretString)

  const tokenResponse = await discord.post('/oauth2/token', {
    'client_id': CLIENT_ID,
    'client_secret': secretResponse.SecretString,
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': REDIRECT_URL
  })

  console.log(tokenResponse.data)

  const guildsResponse = await discord.get(`/users/@me/guild`, {
    headers: {
      Authorization: `Bearer ${tokenResponse.data.access_token}`
    }
  })

  console.log(guildsResponse.data)

  const body = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Trade Game - Authentication</title>
        </head>
        <body>
            <div>Success! ${JSON.stringify(tokenResponse.data)}</div>
            <div>${JSON.stringify(guildsResponse.data, null, 2)}</div>
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
