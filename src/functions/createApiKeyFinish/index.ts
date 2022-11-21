import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    CLIENT_ID: '${self:custom.discordClientId}',
    AUTH_STATE_TABLE: { Ref: 'AuthStateTable' },
    JWT_SECRET: {'Fn::GetAtt': ['JwtSecretResource', 'JwtSecret' ]},
    REDIRECT_URL: "${self:custom.domain}/${self:provider.stage}/api-key/finish",
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
      Resource: ['arn:aws:secretsmanager:${self:provider.region}:${aws:accountId}:secret:discord_client_secret-0NJgyw'],
    },
    {
      Effect: 'Allow',
      Action: ['apigateway:POST'],
      Resource: ['arn:aws:apigateway:${self:provider.region}::/usageplans', 'arn:aws:apigateway:${self:provider.region}::/apikeys', 'arn:aws:apigateway:${self:provider.region}::/usageplans/*/keys']
    },
    {
      Effect: 'Allow',
      Action: ['apigateway:PATCH'],
      Resource: ['arn:aws:apigateway:${self:provider.region}::/usageplans/*']
    },
  ],
  tags: {
    function: 'create-api-key-finish'
  },
  timeout: 15,
};
