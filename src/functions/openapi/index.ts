import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  package: {
    patterns: ['openapi.json']
  },
  events: [
    {
      http: {
        method: 'get',
        path: 'openapi',
      },
    },
    {
      http: {
        method: 'get',
        path: 'openapi.json',
        documentation: {
          summary: 'Get OpenAPI',
          methodResponses: [{
            statusCode: 200,
            responseBody: {
              description: 'a response body'
            },
            responseModels: {
              'application/json': 'GetOpenAPIResponse'
            },
          }]
        }
      },
    },
  ],
};
