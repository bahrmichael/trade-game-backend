import {ddb} from "@libs/ddb-client";
import {PutCommand, QueryCommand} from "@aws-sdk/lib-dynamodb";
import {createToken} from "@libs/api-key";

const {TEST_KEY_TABLE} = process.env;

const ONE_MINUTE = 60;

export const main = async (event: any) => {

    console.log(event);

    const tokenRecords = await ddb.send(new QueryCommand({
        TableName: TEST_KEY_TABLE,
        KeyConditionExpression: 'pk = :k and visibleFrom < :v',
        ExpressionAttributeValues: {
            ':k': 'key',
            ':v': new Date().getTime(),
        },
        ScanIndexForward: false,
        Limit: 1,
    }))
    const existingToken = tokenRecords.Items[0]?.token
    if (existingToken) {
        return {token: existingToken};
    }

    const timeToLive = Math.ceil(new Date().getTime() / 1_000) + 120 * ONE_MINUTE;
    const token = await createToken('testUser', timeToLive);
    const visibleFrom = new Date().getTime();

    await ddb.send(new PutCommand({
        TableName: TEST_KEY_TABLE,
        Item: {
            pk: 'key',
            visibleFrom,
            token: token,
            timeToLive,
        }
    }));

    return {token};
};
