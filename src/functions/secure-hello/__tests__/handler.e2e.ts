import {ddb} from "../../../libs/ddb-client";
import {QueryCommand} from "@aws-sdk/lib-dynamodb";
import client from "../../../libs/__tests__/axios";

const {TEST_KEY_TABLE} = process.env;

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

describe('secure-hello', () => {

    let token;

    beforeAll(async() => {

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
        console.log(tokenRecords)
        token = tokenRecords.Items[0]?.token
        if (!token) {
            throw Error(`Could not find a token in the table: ${JSON.stringify(tokenRecords)}`);
        }

        // try for up to two minutes
        const tryUntil = new Date(new Date().getTime() + 1_000 * 120).getTime()

        let success = false;
        while (tryUntil > new Date().getTime()) {
            try {
                // When first created, the token will need about 1 minute to become valid
                // We're not waiting that time though, because this test might run when a token is already valid
                await client.post(`/secure-hello`, {name: 'Michael'}, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })
                success = true;
                break;
            } catch (e) {
                console.warn(e);
                console.log('Sleeping 20 seconds ...')
                await delay(20_000);
            }
        }

        if (!success) {
            throw Error('Token did not initialize in time.')
        }

    }, 120_000)


    it('should receive a hello message', async() => {
        const result = await client.post(`/hello`, { name: 'Michael' }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        expect(result.data.message).toBe('Hello Michael, welcome to the exciting Serverless world!')
    })
})
