import {InvocationType, InvokeCommand, LambdaClient} from "@aws-sdk/client-lambda";
import client from "../../../libs/__tests__/axios";
import {fromUtf8, toUtf8} from "@aws-sdk/util-utf8-node";

const lambda = new LambdaClient({});

const {VERSION} = process.env;

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

describe('secure-hello', () => {

    let token;

    beforeAll(async() => {

        const tokenRecords = await lambda.send(new InvokeCommand({
            FunctionName: `trade-game-backend-${VERSION}-generateTestKey`,
            InvocationType: InvocationType.RequestResponse,
            Payload: fromUtf8(JSON.stringify({test: '123'}))
        }))

        const payload = toUtf8(tokenRecords.Payload);
        const data = JSON.parse(payload);

        token = data?.token
        if (!token) {
            throw Error(`Could not find a token in the table.`);
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
        const result = await client.post(`/secure-hello`, { name: 'Michael' }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
        expect(result.data.message).toBe('Hello Michael, your Discord ID is testUser')
    })
})
