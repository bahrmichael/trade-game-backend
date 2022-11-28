import {handlerPath} from '@libs/handler-resolver';
import {API_KEY_IAM} from "@libs/iam";

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    environment: {
        TABLE: { Ref: 'TestKeyTable' },
        JWT_SECRET: {'Fn::GetAtt': ['JwtSecretResource', 'JwtSecret' ]},
        VERSION: '${self:provider.stage}',
        API_ID: {Ref: 'ApiGatewayRestApi'},
    },
    iamRoleStatements: [
        {
            Effect: 'Allow',
            Action: ['dynamodb:PutItem'],
            Resource: { 'Fn::GetAtt': ['TestKeyTable', 'Arn' ] },
        },
        ...API_KEY_IAM,
    ],
    tags: {
        function: 'init-test-key'
    },
};
