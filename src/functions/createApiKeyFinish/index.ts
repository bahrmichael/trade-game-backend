import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environmentVariables: {
    CLIENT_ID: "${env:DISCORD_CLIENT_ID}",
    CLIENT_SECRET: "${env:DISCORD_CLIENT_SECRET}",
    AUTH_STATE_TABLE: { Ref: 'AuthStateTable' },
    REDIRECT_URL: "${self:custom.domain}/${self:provider.stage}/",
  },
  events: [
    {
      http: {
        method: 'get',
        path: 'api-key/finish',
        documentation: {
          summary: 'Visit the page to finish a Discord authentication.',
          methodResponses: [{
            statusCode: 200,
            responseModels: {
              'text/html': 'CreateApiKeyFinishUi'
            },
          }]
        }
      },
    },
  ],
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:GetItem'],
      Resource: { 'Fn::GetAtt': ['AuthStateTable', 'Arn' ] },
    },
  ],
  tags: {
    function: 'create-api-key-finish'
  }
};
