import {handlerPath} from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    JWT_SECRET_TABLE: { Ref: 'JwtSecretTable' },
  },
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['dynamodb:GetItem'],
      Resource: { 'Fn::GetAtt': ['JwtSecretTable', 'Arn' ] },
    },
    {
      Effect: 'Allow',
      Action: ['secretsmanager:GetSecretValue'],
      Resource: ['arn:aws:secretsmanager:us-east-1:400662342367:secret:TODO'],
    }
  ],
  tags: {
    function: 'authorizer'
  }
};
