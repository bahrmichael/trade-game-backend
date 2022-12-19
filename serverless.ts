import type {AWS} from '@serverless/typescript';

import * as functions from "@functions/index";
import * as postHelloSchema from "@functions/hello/schema"

import {definition as exchangeDefinition} from "./src/state-machines/exchange"

const serverlessConfiguration: AWS & {stepFunctions: any} = {
  service: 'trade-game-backend',
  frameworkVersion: '3',
  plugins: [
    'serverless-esbuild',
    'serverless-plugin-log-retention',
    'serverless-iam-roles-per-function',
    '@motymichaely/serverless-openapi-documentation',
    'serverless-domain-manager',
    'serverless-step-functions',
  ],
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
  },
  stepFunctions: {
    validate: true,
    stateMachines: {
      exchangeStateMachine: {
        name: "${self:provider.stage}-Exchange",
        definition: exchangeDefinition,
      }
    }
  },
  functions,
  package: { individually: true },
  custom: {
    domain: 'https://${self:provider.stage}.api.apiempires.com',
    discordClientId: '1043200977156714607',
    discordRedirectUrl: '${self:custom.domain}/api-key/finish',
    customDomain: {
      domainName: '${self:provider.stage}.api.apiempires.com',
      certificateName: '*.api.apiempires.com',
      stage: '${self:provider.stage}',
      createRoute53Record: true,
      autoDomain: true,
    },
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
        url: "${self:custom.domain}/",
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
    Outputs: {
      ExchangeStateMachine: {
        Description: 'The ARN of the Exchange State Machine',
        Value: { Ref: "${self:provider.stage}-Exchange" }
      }
    },
    Resources: {
      ExchangeLockTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'lockId',
            KeyType: 'HASH'
          }],
          AttributeDefinitions: [{
            AttributeName: 'lockId',
            AttributeType: 'S'
          }],
        }
      },
      StorageUnitsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'storageUnitId',
            KeyType: 'HASH'
          }],
          AttributeDefinitions: [{
            AttributeName: 'storageUnitId',
            AttributeType: 'S'
          }],
        }
      },
      PlayersTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'playerId',
            KeyType: 'HASH'
          }],
          AttributeDefinitions: [{
            AttributeName: 'playerId',
            AttributeType: 'S'
          }],
        }
      },
      TransactionsTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'ownerId',
            KeyType: 'HASH'
          }, {
            AttributeName: 'transactionId',
            KeyType: 'RANGE'
          }],
          AttributeDefinitions: [{
            AttributeName: 'ownerId',
            AttributeType: 'S'
          }, {
            AttributeName: 'transactionId',
            AttributeType: 'S'
          }],
        }
      },
      OrdersTable: {
        Type: 'AWS::DynamoDB::Table',
        Properties: {
          BillingMode: 'PAY_PER_REQUEST',
          KeySchema: [{
            AttributeName: 'ownerId',
            KeyType: 'HASH'
          }, {
            AttributeName: 'orderId',
            KeyType: 'RANGE'
          }],
          GlobalSecondaryIndexes: [{
            IndexName: 'GSI1',
            KeySchema: [{
              AttributeName: 'gsi1pk',
              KeyType: 'HASH'
            }, {
              AttributeName: 'orderId',
              KeyType: 'RANGE'
            }],
            Projection: {
              ProjectionType: 'ALL'
            }
          }, {
            IndexName: 'GSI2',
            KeySchema: [{
              AttributeName: 'lockTransport',
              KeyType: 'HASH'
            }, {
              AttributeName: 'orderId',
              KeyType: 'RANGE'
            }],
            Projection: {
              ProjectionType: 'ALL'
            }
          }],
          AttributeDefinitions: [{
            AttributeName: 'orderId',
            AttributeType: 'S'
          }, {
            AttributeName: 'ownerId',
            AttributeType: 'S'
          }, {
            AttributeName: 'lockTransport',
            AttributeType: 'S'
          }, {
            AttributeName: 'gsi1pk',
            AttributeType: 'S'
          }],
          StreamSpecification: {
            StreamViewType: 'NEW_AND_OLD_IMAGE'
          },
        }
      },
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
