import {APIGatewayProxyEvent} from "aws-lambda";
import {ddb} from "@libs/ddb-client";
import {GetCommand} from "@aws-sdk/lib-dynamodb";
import axios from "axios";

const discord = axios.create({
  baseURL: 'https://discord.com',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})

const {AUTH_STATE_TABLE, DISCORD_SECRET, REDIRECT_URL} = process.env;


export const main = async (event: APIGatewayProxyEvent) => {

  console.log(DISCORD_SECRET)

  const {clientId: CLIENT_ID, clientSecret: CLIENT_SECRET} = JSON.parse(DISCORD_SECRET);

  const {code, state} = event.queryStringParameters;
  const existingState = await ddb.send(new GetCommand({
    TableName: AUTH_STATE_TABLE,
    Key: {state}
  }))

  if (!existingState.Item) {
    // todo: return 401
  }

  const res = await discord.post('/oauth2/token', {
    'client_id': CLIENT_ID,
    'client_secret': CLIENT_SECRET,
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': REDIRECT_URL
  })

  console.log(res.data)

  const body = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Trade Game - Authentication</title>
        </head>
        <body>
            <div>Success! ${res.data?.scope}</div>
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