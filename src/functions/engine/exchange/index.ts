import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  // run no more than 1 exchange matcher function so that we don't accidentally match one order multiple times in different parallel workers
  reservedConcurrency: 1,
  environment: {
    ORDERS_TABLE: {Ref: 'OrdersTable'}
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
      Action: ['dynamodb:UpdateItem', 'dynamodb:DeleteItem'],
      Resource: { 'Fn::GetAtt': ['OrdersTable', 'Arn' ] },
    },
    {
      Effect: 'Allow',
      Action: ['dynamodb:Query'],
      Resource: {'Fn::Join': [ '/', [{ 'Fn::GetAtt': ['OrdersTable', 'Arn' ] }, 'index', 'GSI1' ]]}
    },
  ],
  tags: {
    function: 'exchange'
  },
};
