import schema from './schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'hello',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
        documentation: {
          summary: 'Post hello',
          requestBody: {
            description: 'An info object',
          },
          requestModels: {
            'application/json': 'PostHelloRequest',
          },
          methodResponses: [{
            statusCode: 200,
            responseBody: {
              description: 'a response body'
            },
            responseModels: {
              'application/json': 'PostHelloResponse'
            },
          }]
        }
      },
    },
  ],
};
