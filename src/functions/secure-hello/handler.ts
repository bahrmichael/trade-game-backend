import type {ValidatedEventAPIGatewayProxyEvent} from '@libs/api-gateway';
import {formatJSONResponse} from '@libs/api-gateway';
import {middyfy} from '@libs/lambda';

import schema from '../hello/schema';

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
    // The header arrives lower case in this code, instead of the X-API-KEY I was expecting
    const apiKey = event.headers['x-api-key']
    if (!apiKey) {
        return {
            statusCode: 401,
            body: JSON.stringify({error: 'unauthenticated'})
        }
    }
    if (apiKey !== 'VerySecure') {
        return {
            statusCode: 403,
            body: JSON.stringify({error: 'unauthorized'})
        }
    }
    return formatJSONResponse({
        message: `Hello ${event.body.name}, welcome to the SECURE Serverless world!`,
    });
};

export const main = middyfy(hello);
