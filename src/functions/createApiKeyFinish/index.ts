import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    CLIENT_ID: '${self:custom.discordClientId}',
    AUTH_STATE_TABLE: { Ref: 'AuthStateTable' },
    REDIRECT_URL: "${self:custom.domain}/${self:provider.stage}/api-key/finish",
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
      Action: ['secretsmanager:GetSecretValue'],
      Resource: 'arn:aws:secretsmanager:${aws:region}:${aws:accountId}:secret:discord_client_secret',
    }
  ],
  tags: {
    function: 'create-api-key-finish'
  }
};
