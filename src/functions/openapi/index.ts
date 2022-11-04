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
        documentation: {
          summary: 'Get the OpenAPI UI for this API',
          tags: ['openapi'],
          methodResponses: [{
            statusCode: 200,
            responseModels: {
              'text/html': 'GetOpenApiUi'
            },
          }]
        }
      },
    },
    {
      http: {
        method: 'get',
        path: 'openapi.json',
        documentation: {
          summary: 'Get the OpenAPI Spec for this API',
          tags: ['openapi'],
          methodResponses: [{
            statusCode: 200,
            responseModels: {
              'application/json': 'GetOpenApiResponse'
            },
          }]
        }
      },
    },
  ],
};
