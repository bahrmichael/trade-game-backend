import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    PLAYERS_TABLE: {Ref: 'PlayersTable'}
  },
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: {'Fn::GetAtt': ['OrdersTable', 'StreamArn']}
      }
    },
  ],
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:UpdateItem'],
      Resource: { 'Fn::GetAtt': ['PlayersTable', 'Arn' ] },
    },
  ],
  tags: {
    function: 'balance'
  },
};
