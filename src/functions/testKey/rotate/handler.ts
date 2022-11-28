import {ddb} from "@libs/ddb-client";
import {PutCommand} from "@aws-sdk/lib-dynamodb";
import {createToken} from "@libs/api-key";

const {TABLE, JWT_SECRET} = process.env;

const ONE_MINUTE = 60;

export const main = async () => {

  console.log({JWT_SECRET})

  const timeToLive = Math.ceil(new Date().getTime() / 1_000) + 120 * ONE_MINUTE;
  const token = await createToken('testUser', timeToLive);
  // Delay by 5 minutes, because APIGW needs a minute or two to fully initialize a key
  const visibleFrom = new Date(new Date().getTime() + 1_000 * ONE_MINUTE * 5).getTime();

  await ddb.send(new PutCommand({
    TableName: TABLE,
    Item: {
      pk: 'key',
      visibleFrom,
      token: token,
      timeToLive,
    }
  }));
};
