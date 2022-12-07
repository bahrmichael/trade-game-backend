import { handlerPath } from '@libs/handler-resolver';
import { API_KEY_IAM } from "@libs/iam";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    CLIENT_ID: '${self:custom.discordClientId}',
    AUTH_STATE_TABLE: { Ref: 'AuthStateTable' },
    JWT_SECRET: {'Fn::GetAtt': ['JwtSecretResource', 'JwtSecret' ]},
    REDIRECT_URL: "${self:custom.discordRedirectUrl}",
    VERSION: '${self:provider.stage}',
    API_ID: {Ref: 'ApiGatewayRestApi'},
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
      Resource: ['arn:aws:secretsmanager:${aws:region}:${aws:accountId}:secret:discord_client_secret-0NJgyw'],
    },
    ...API_KEY_IAM,
  ],
  tags: {
    function: 'create-api-key-finish'
  },
};
