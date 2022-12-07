import { handlerPath } from '@libs/handler-resolver';
import {API_KEY_IAM} from "@libs/iam";

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    TEST_KEY_TABLE: { Ref: 'TestKeyTable' },
    JWT_SECRET: {'Fn::GetAtt': ['JwtSecretResource', 'JwtSecret' ]},
    VERSION: '${self:provider.stage}',
    API_ID: {Ref: 'ApiGatewayRestApi'},
  },
  events: [
    {
      schedule: 'rate(1 hour)'
    },
  ],
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:PutItem', 'dynamodb:Query'],
      Resource: { 'Fn::GetAtt': ['TestKeyTable', 'Arn' ] },
    },
    ...API_KEY_IAM,
  ],
  tags: {
    function: 'rotate-test-key'
  }
};
