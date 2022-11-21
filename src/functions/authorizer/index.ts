import {handlerPath} from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    JWT_SECRET: {'Fn::ImportValue': 'JwtSecret'},
  },
  iamRoleStatements: [
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
