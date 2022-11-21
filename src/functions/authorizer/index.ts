import {handlerPath} from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    JWT_SECRET: {'Fn::GetAtt': ['JwtSecretResource', 'JwtSecret' ]},
  },
  tags: {
    function: 'authorizer'
  }
};
