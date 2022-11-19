import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environmentVariables: {
    CLIENT_ID: '${self:custom.discordClientId}',
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
    {
      Effect: 'Allow',
      Action: ['ssm:GetParameter'],
      Resource: 'arn:aws:ssm:${aws:region}:***:parameter/aws/reference/secretsmanager/discord_client_secret',
    }
  ],
  tags: {
    function: 'create-api-key-finish'
  }
};
