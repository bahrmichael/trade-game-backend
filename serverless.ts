import type { AWS } from '@serverless/typescript';

import * as functions from "@functions/index";
import * as postHelloSchema from "@functions/hello/schema";

const serverlessConfiguration: AWS = {
  service: 'trade-game-backend',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-plugin-log-retention', 'serverless-iam-roles-per-function', 'serverless-openapi-documenter'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    stage: '${opt:stage, "dev"}',
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
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
    }
  },
  // import the function via paths
  functions,
  package: { individually: true },
  custom: {
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
      version: '1',
      models: [{
        name: 'PostHelloRequest',
        description: 'This is a request',
        contentType: 'application/json',
        schema: postHelloSchema,
        /*
        {
          '$schema': "http://json-schema.org/draft-04/schema#",
          properties: {
            SomeObject: {
              type: 'object',
              properties: {
                SomeAttribute: {
                  type: 'string'
                }
              }
            }
          }
        }
         */
      }]
    }
  },
  resources: {
    Resources: {
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
      }
    }
  }
};

module.exports = serverlessConfiguration;
