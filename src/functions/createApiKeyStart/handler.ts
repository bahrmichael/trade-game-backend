import {ulid} from 'ulid'
import {ddb} from "@libs/ddb-client";
import {PutCommand} from "@aws-sdk/lib-dynamodb";

const {CLIENT_ID, REDIRECT_URL, TABLE} = process.env;

const ONE_MINUTE = 60;

export const main = async () => {

  const state = ulid()
  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      state,
      timeToLive: Math.ceil(new Date().getTime() / 1_000) + 10 * ONE_MINUTE,
    }
  }));

  const discordAuthLink = `https://discord.com/oauth2/authorize?response_type=code&client_id=${CLIENT_ID}&scope=identify&state=${state}&redirect_uri=${REDIRECT_URL}&prompt=consent`

  const body = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>Trade Game - Authentication</title>
        </head>
        <body>
            <div>
                <a href="${discordAuthLink}"></a>
            </div>
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
