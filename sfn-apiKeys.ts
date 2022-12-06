export const definition = {
    "Comment": "A description of my state machine",
    "StartAt": "ListExistingUsagePlans",
    "States": {
        "ListExistingUsagePlans": {
            "Type": "Task",
            "Parameters": {
                "Limit": 500
            },
            "Resource": "arn:aws:states:::aws-sdk:apigateway:getUsagePlans",
            "Next": "Find matching usage plan",
            "ResultPath": "$.usagePlans"
        },
        "Find matching usage plan": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "Parameters": {
                "Payload.$": "$",
                "FunctionName": {'Fn::GetAtt': ['FindMatchingUsagePlanLambdaFunction', 'Arn' ]}
            },
            "Retry": [
                {
                    "ErrorEquals": [
                        "Lambda.ServiceException",
                        "Lambda.AWSLambdaException",
                        "Lambda.SdkClientException",
                        "Lambda.TooManyRequestsException"
                    ],
                    "IntervalSeconds": 2,
                    "MaxAttempts": 6,
                    "BackoffRate": 2
                }
            ],
            "Next": "Extract usagePlan payload",
            "ResultPath": "$.usagePlan"
        },
        "Extract usagePlan payload": {
            "Type": "Pass",
            "Next": "If usage plan exists",
            "Parameters": {
                "apiStageValue.$": "$.apiStageValue",
                "targetId.$": "$.targetId",
                "apiId.$": "$.apiId",
                "usagePlan.$": "$.usagePlan.Payload.usagePlan"
            }
        },
        "If usage plan exists": {
            "Type": "Choice",
            "Choices": [
                {
                    "Not": {
                        "Variable": "$.usagePlan",
                        "IsNull": true
                    },
                    "Next": "Find matching api stage attachment"
                }
            ],
            "Default": "CreateUsagePlan"
        },
        "CreateUsagePlan": {
            "Type": "Task",
            "Parameters": {
                "Name.$": "$.targetId",
                "Throttle": {
                    "RateLimit": 10,
                    "BurstLimit": 50
                },
                "Quota": {
                    "Limit": 1000,
                    "Period": "DAY"
                }
            },
            "Resource": "arn:aws:states:::aws-sdk:apigateway:createUsagePlan",
            "Next": "Find matching api stage attachment",
            "ResultPath": "$.usagePlan"
        },
        "Find matching api stage attachment": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "Parameters": {
                "Payload.$": "$",
                "FunctionName": {'Fn::GetAtt': ['FindMatchingApiStageAttachmentLambdaFunction', 'Arn' ]}
            },
            "Retry": [
                {
                    "ErrorEquals": [
                        "Lambda.ServiceException",
                        "Lambda.AWSLambdaException",
                        "Lambda.SdkClientException",
                        "Lambda.TooManyRequestsException"
                    ],
                    "IntervalSeconds": 2,
                    "MaxAttempts": 6,
                    "BackoffRate": 2
                }
            ],
            "Next": "Extract apiStageAttachment payload",
            "ResultPath": "$.apiStageAttachment"
        },
        "Extract apiStageAttachment payload": {
            "Type": "Pass",
            "Next": "If api stage attachment exists",
            "Parameters": {
                "apiStageValue.$": "$.apiStageValue",
                "targetId.$": "$.targetId",
                "apiId.$": "$.apiId",
                "usagePlan.$": "$.usagePlan",
                "apiStageAttachment.$": "$.apiStageAttachment.Payload.apiStageAttachment"
            }
        },
        "If api stage attachment exists": {
            "Type": "Choice",
            "Choices": [
                {
                    "Not": {
                        "Variable": "$.apiStageAttachment",
                        "IsNull": true
                    },
                    "Next": "GetApiKeys"
                }
            ],
            "Default": "UpdateUsagePlan"
        },
        "UpdateUsagePlan": {
            "Type": "Task",
            "Parameters": {
                "UsagePlanId.$": "$.usagePlan.Id",
                "PatchOperations": [
                    {
                        "Op": "add",
                        "Path": "/apiStages",
                        "Value.$": "$.apiStageValue"
                    }
                ]
            },
            "Resource": "arn:aws:states:::aws-sdk:apigateway:updateUsagePlan",
            "Next": "GetApiKeys",
            "ResultPath": "$.updateUsagePlanResult"
        },
        "GetApiKeys": {
            "Type": "Task",
            "Parameters": {
                "NameQuery.$": "$.targetId"
            },
            "Resource": "arn:aws:states:::aws-sdk:apigateway:getApiKeys",
            "Next": "For each api key",
            "ResultPath": "$.apiKeys"
        },
        "For each api key": {
            "Type": "Map",
            "Iterator": {
                "StartAt": "GetUsagePlanKeys",
                "States": {
                    "GetUsagePlanKeys": {
                        "Type": "Task",
                        "Parameters": {
                            "UsagePlanId.$": "$.usagePlanId"
                        },
                        "Resource": "arn:aws:states:::aws-sdk:apigateway:getUsagePlanKeys",
                        "Next": "For each usage plan key",
                        "ResultPath": "$.usagePlanKeys"
                    },
                    "For each usage plan key": {
                        "Type": "Map",
                        "Iterator": {
                            "StartAt": "DeleteUsagePlanKey",
                            "States": {
                                "DeleteUsagePlanKey": {
                                    "Type": "Task",
                                    "Parameters": {
                                        "KeyId.$": "$.apiKeyId",
                                        "UsagePlanId.$": "$.usagePlanId"
                                    },
                                    "Resource": "arn:aws:states:::aws-sdk:apigateway:deleteUsagePlanKey",
                                    "End": true
                                }
                            }
                        },
                        "ItemsPath": "$.usagePlanKeys.Items",
                        "ItemSelector": {
                            "apiKeyId.$": "$.id",
                            "usagePlanKey.$": "$$.Map.Item.Value",
                            "usagePlanId.$": "$.usagePlanId"
                        },
                        "Next": "DeleteApiKey",
                        "ResultPath": "$.forEachUsagePlanKey"
                    },
                    "DeleteApiKey": {
                        "Type": "Task",
                        "Parameters": {
                            "ApiKey.$": "$.id"
                        },
                        "Resource": "arn:aws:states:::aws-sdk:apigateway:deleteApiKey",
                        "End": true
                    }
                }
            },
            "Next": "CreateApiKey",
            "ItemsPath": "$.apiKeys.Items",
            "ResultPath": "$.mapApiKeys",
            "ItemSelector": {
                "id.$": "$$.Map.Item.Value.Id",
                "targetId.$": "$.targetId",
                "usagePlanId.$": "$.usagePlan.Id"
            }
        },
        "CreateApiKey": {
            "Type": "Task",
            "Parameters": {
                "Enabled": true,
                "Name.$": "$.targetId"
            },
            "Resource": "arn:aws:states:::aws-sdk:apigateway:createApiKey",
            "Next": "CreateUsagePlanKey",
            "ResultPath": "$.createdApiKey"
        },
        "CreateUsagePlanKey": {
            "Type": "Task",
            "Parameters": {
                "KeyId.$": "$.createdApiKey.Id",
                "KeyType": "API_KEY",
                "UsagePlanId.$": "$.usagePlan.Id"
            },
            "Resource": "arn:aws:states:::aws-sdk:apigateway:createUsagePlanKey",
            "Next": "Wait"
        },
        "Wait": {
            "Type": "Wait",
            "Seconds": 60,
            "End": true
        }
    }
}