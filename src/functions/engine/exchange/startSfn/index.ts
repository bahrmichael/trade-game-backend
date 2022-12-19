import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    EXCHANGE_STATE_MACHINE_ARN: '${self:resources.Outputs.ExchangeStateMachine.Value}'
  },
  events: [
    {
      stream: {
        type: 'dynamodb',
        arn: {'Fn::GetAtt': ['OrdersTable', 'StreamArn']},
        filterPatterns: [{
          eventName: ['INSERT'],
        }]
      }
    },
  ],
  tags: {
    function: 'exchange-start-sfn'
  },
};
