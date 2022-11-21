import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    CLIENT_ID: '${self:custom.discordClientId}',
    AUTH_STATE_TABLE: { Ref: 'AuthStateTable' },
    JWT_SECRET: {'Fn::GetAtt': ['JwtSecretResource', 'JwtSecret' ]},
    REDIRECT_URL: "${self:custom.domain}/${self:provider.stage}/api-key/finish",
    VERSION: '${self:provider.stage}'
  },
  events: [
    {
      http: {
        method: 'get',
        path: 'api-key/finish',
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
      Resource: ['arn:aws:secretsmanager:us-east-1:400662342367:secret:discord_client_secret-0NJgyw'],
    }
  ],
  tags: {
    function: 'create-api-key-finish'
  }
};
