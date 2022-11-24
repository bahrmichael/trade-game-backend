import type {ValidatedEventAPIGatewayProxyEvent} from '@libs/api-gateway';
import {formatJSONResponse} from '@libs/api-gateway';
import {middyfy} from '@libs/lambda';

import schema from '../hello/schema';

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {

    const {discordId} = event.requestContext.authorizer;

    return formatJSONResponse({
        message: `Hello ${event.body.name}, your Discord ID is ${discordId}`,
    });
};

export const main = middyfy(hello);
