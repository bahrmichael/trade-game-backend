import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  environment: {
    VERSION: '${self:provider.stage}',
    GUILD_ID: '1043586935232417923',
    PARENT_ID: '1043997956363272254'
  },
  iamRoleStatements: [
    {
      Effect: 'Allow',
      Action: ['secretsmanager:GetSecretValue'],
      Resource: ['arn:aws:secretsmanager:us-east-1:400662342367:secret:discord_bot_secret-Hxi6XB'],
    }
  ],
  tags: {
    function: 'discord-create-channel'
  }
};
