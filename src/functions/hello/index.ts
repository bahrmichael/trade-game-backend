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
          methodResponses: [{
            statusCode: 200,
            responseBody: {
              description: 'a response body'
            },
            requestModels: {
              'application/json': 'PostHelloRequest'
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
