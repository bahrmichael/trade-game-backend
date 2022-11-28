export default {
    TestKeyTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
            BillingMode: 'PAY_PER_REQUEST',
            KeySchema: [{
                AttributeName: 'pk',
                KeyType: 'HASH'
            }, {
                AttributeName: 'visibleFrom',
                KeyType: 'RANGE'
            }],
            AttributeDefinitions: [{
                AttributeName: 'pk',
                AttributeType: 'S'
            }, {
                AttributeName: 'visibleFrom',
                AttributeType: 'N'
            }],
            TimeToLiveSpecification: {
                AttributeName: 'timeToLive',
                Enabled: true,
            },
        },
    },
    TestKeyResource: {
        Type: "AWS::CloudFormation::CustomResource",
        DependsOn: ['JwtSecretResource', 'ApiGatewayRestApi', 'TestKeyTable'],
        Properties: {
            ServiceToken: {'Fn::GetAtt': ['InitTestKeyLambdaFunction', 'Arn']},
        },
    },
    TestUserRole: {
        Type: 'AWS::IAM::Role',
        Properties: {
            RoleName: '${self:service}-${self:provider.stage}-TestUserRole',
            AssumeRolePolicyDocument: {
                Statement: [{
                    Effect: 'Allow',
                    Action: 'sts:AssumeRoleWithWebIdentity',
                    Principal: {
                        Federated: 'arn:aws:iam::${aws:accountId}:oidc-provider/token.actions.githubusercontent.com'
                    },
                    Condition: {
                        StringLike: {
                            'token.actions.githubusercontent.com:sub': 'repo:bahrmichael/trade-game-backend:*'
                        },
                        'ForAllValues:StringEquals': {
                            'token.actions.githubusercontent.com:iss': 'https://token.actions.githubusercontent.com',
                            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
                            'token.actions.githubusercontent.com:actor': ['bahrmichael', 'renovate[bot]', 'dependabot[bot]', 'mergify[bot]']
                        }
                    }
                }]
            },
            Policies: [{
                PolicyName: 'TestUserPolicy',
                PolicyDocument: {
                    Version: '2012-10-17',
                    Statement: [{
                        Effect: 'Allow',
                        Action: ['dynamodb:Query'],
                        Resource: [{'Fn::GetAtt': ['TestKeyTable', 'Arn']}]
                    }, {
                        Effect: 'Allow',
                        Action: ['cloudformation:ListExports'],
                        Resource: ['*']
                    }, {
                        Effect: 'Allow',
                        Action: ['cloudformation:ListStackResources', 'cloudformation:DescribeStacks'],
                        Resource: ['arn:aws:cloudformation:${aws:region}:${aws:accountId}:stack/trade-game-backend-${self:provider.stage}/*']
                    }]
                }
            }]
        }
    }
}