import {handlerPath} from '@libs/handler-resolver';

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    environment: {
        VERSION: '${self:provider.stage}',
        DISCORD_PROXY_ENDPOINT: 'https://discord.apiempires.com'
    },
    iamRoleStatements: [{
        Effect: 'Allow',
        Action: ['secretsmanager:GetSecretValue'],
        Resource: ['arn:aws:secretsmanager:${aws:region}:${aws:accountId}:secret:discord-proxy/endpoint-registration-*'],
    }],
    tags: {
        function: 'discord-proxy-registration'
    }
};
