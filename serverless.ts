import type {AWS} from '@serverless/typescript';

import * as functions from "@functions/index";
import * as postHelloSchema from "@functions/hello/schema"

const serverlessConfiguration: AWS = {
  service: 'trade-game-backend',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-plugin-log-retention', 'serverless-iam-roles-per-function', '@motymichaely/serverless-openapi-documentation'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    stage: '${opt:stage, "dev"}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      apiKeySourceType: 'AUTHORIZER'
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
    },
    stackTags: {
      projectGroup: 'trade-game',
      project: '${self:service}',
      stage: '${self:provider.stage}',
    },
    iam: {
      deploymentRole: 'arn:aws:iam::${aws:accountId}:role/${self:service}-CloudFormationExecutionRole'
    },
    // logs: {
    //   restApi: true,
    // }
  },
  functions,
  package: { individually: true },
  custom: {
    // later replace with a shared URL like https://api.tradegame.dev
    domain: 'https://yejczj7iuc.execute-api.us-east-1.amazonaws.com',
    discordClientId: '1043200977156714607',
    region: '${opt:region, self:provider.region}',
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    logRetentionInDays: 7,
    documentation: {
      title: 'Trade Game API',
      version: '${self:provider.stage}',
      servers: [{
        url: "${self:custom.domain}/${self:provider.stage}/",
      }],
      security: [{
        name: 'BearerAuthentication',
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }],
      models: [{
        name: 'UnauthenticatedResponse',
        contentType: 'application/json',
        schema: {
          // only the $schema field is the minimum required schema to render a response if you don't want to specify a response
          '$schema': "http://json-schema.org/draft-04/schema#",
          properties: {
            error: {
              type: 'string',
            }
          }
        },
      }, {
        name: 'UnauthorizedResponse',
        contentType: 'application/json',
        schema: {
          // only the $schema field is the minimum required schema to render a response if you don't want to specify a response
          '$schema': "http://json-schema.org/draft-04/schema#",
          properties: {
            error: {
              type: 'string',
            }
          }
        },
      }, {
        name: 'PostHelloRequest',
        contentType: 'application/json',
        schema: {
          '$schema': "http://json-schema.org/draft-04/schema#",
          properties: postHelloSchema.default.properties,
        },
      }, {
        name: 'PostHelloResponse',
        contentType: 'application/json',
        schema: {
          '$schema': "http://json-schema.org/draft-04/schema#",
          properties: {
            message: {
              type: 'string',
            },
          }
        },
      }]
    }
  },
  resources: {
    extensions: {
      // https://forum.serverless.com/t/authorizers-cache/1127/6
      AuthorizerApiGatewayAuthorizer: {
        Properties: {
          AuthorizerResultTtlInSeconds: 0
        }
      },
    },
    Resources: {
      AuthStateTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'state',
            KeyType: 'HASH'
          }],
          AttributeDefinitions: [{
            AttributeName: 'state',
            AttributeType: 'S'
          }],
          TimeToLiveSpecification: {
            AttributeName: 'timeToLive',
            Enabled: true,
          },
        }
      },
      ApiGatewayRestApi: {
        Type: 'AWS::ApiGateway::RestApi',
        Properties: {
          Name: '${self:service}-${self:provider.stage}'
        }
      },
      GatewayResponseResourceNotFound: {
        Type: 'AWS::ApiGateway::GatewayResponse',
        Properties: {
          RestApiId: {
            Ref: 'ApiGatewayRestApi'
          },
          ResponseType: 'BAD_REQUEST_BODY',
          StatusCode: '422',
          ResponseTemplates: {
            'application/json': "{\"message\": \"$context.error.message\", \"error\": \"$context.error.validationErrorString\"}"
          }
        }
      },
      JwtSecretResource: {
        Type : "AWS::CloudFormation::CustomResource",
        Properties : {
          ServiceToken : { 'Fn::GetAtt': ['GenerateJwtSecretLambdaFunction', 'Arn' ] },
        },
      },
    }
  }
};

module.exports = serverlessConfiguration;
