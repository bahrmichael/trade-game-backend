import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    CLIENT_ID: '${self:custom.discordClientId}',
    REDIRECT_URL: "${self:custom.domain}/${self:provider.stage}/api-key/finish",
    TABLE: { Ref: 'AuthStateTable' }
  },
  events: [
    {
      http: {
        method: 'get',
        path: 'api-key/start',
      },
    },
  ],
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:PutItem'],
      Resource: { 'Fn::GetAtt': ['AuthStateTable', 'Arn' ] },
    },
  ],
  tags: {
    function: 'create-api-key-start'
  }
};
