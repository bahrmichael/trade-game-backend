import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    EXCHANGE_STATE_MACHINE_ARN: '${self:resources.Outputs.ExchangeStateMachine.Value}'
  },
  events: [
    {
      stream: {
        type: 'dynamodb', // todo: filter to Insert events
        arn: {'Fn::GetAtt': ['OrdersTable', 'StreamArn']}
      }
    },
  ],
  tags: {
    function: 'exchange-start-sfn'
  },
};
