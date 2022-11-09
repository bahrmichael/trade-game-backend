import schema from '../hello/schema';
import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'secure-hello',
        request: {
          schemas: {
            'application/json': schema,
          },
        },
        documentation: {
          summary: 'Post your name and get a hello!',
          requestModels: {
            'application/json': 'PostHelloRequest',
          },
          security: [
            'X-API-KEY'
          ],
          methodResponses: [{
            statusCode: 200,
            responseModels: {
              'application/json': 'PostHelloResponse'
            },
          }, {
            statusCode: 401,
            description: 'The request misses the right information for authentication.',
            responseModels: {
              'application/json': 'UnauthenticatedResponse'
            },
          }, {
            statusCode: 403,
            description: 'The request has the wrong authentication to access this API.',
            responseModels: {
              'application/json': 'UnauthorizedResponse'
            },
          }]
        }
      },
    },
  ],
};
