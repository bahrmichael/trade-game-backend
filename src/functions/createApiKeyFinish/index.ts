import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environmentVariables: {
    DISCORD_SECRET: '${ssm:/aws/reference/secretsmanager/discord_secret}',
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
