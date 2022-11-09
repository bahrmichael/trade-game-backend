import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/api-gateway';
import { formatJSONResponse } from '@libs/api-gateway';
import { middyfy } from '@libs/lambda';

import schema from '../hello/schema';

const hello: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (event) => {
  console.log(event)
  console.log(event.headers)
  const apiKey = event.headers['X-API-KEY']
  if (apiKey !== 'VerySecure') {
    return {
      statusCode: 401,
      body: JSON.stringify({})
    }
  }
  return formatJSONResponse({
    message: `Hello ${event.body.name}, welcome to the SECURE Serverless world!`,
  });
};

export const main = middyfy(hello);
