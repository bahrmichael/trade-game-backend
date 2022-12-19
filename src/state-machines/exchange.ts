export const definition = {
    "Comment": "A description of my state machine",
    "StartAt": "Wait Initial Offset",
    "States": {
        "Wait Initial Offset": {
            "Type": "Wait",
            "Next": "Get Concurrency Lock",
            "SecondsPath": "$.initialOffsetSeconds"
        },
        "Get Concurrency Lock": {
            "Type": "Task",
            "Resource": "arn:aws:states:::dynamodb:getItem",
            "Parameters": {
                "TableName": {Ref: "ExchangeLockTable"},
                "Key": {
                    "lockId": {
                        "S.$": "$.lockId"
                    }
                }
            },
            "Next": "Choice",
            "ResultPath": "$.lock"
        },
        "Choice": {
            "Type": "Choice",
            "Choices": [
                {
                    "Variable": "$.lock.Item",
                    "IsPresent": true,
                    "Next": "Wait"
                }
            ],
            "Default": "Put Concurrency Lock"
        },
        "Wait": {
            "Type": "Wait",
            "Seconds": 1,
            "Next": "Get Concurrency Lock"
        },
        "Put Concurrency Lock": {
            "Type": "Task",
            "Resource": "arn:aws:states:::dynamodb:putItem",
            "Parameters": {
                "TableName": {Ref: "ExchangeLockTable"},
                "Item": {
                    "lockId": {
                        "S.$": "$.lockId"
                    }
                }
            },
            "Next": "List Matchable Orders",
            "ResultPath": null
        },
        "List Matchable Orders": {
            "Type": "Task",
            "Parameters": {
                "TableName": {Ref: "OrdersTable"},
                "IndexName": "GSI1",
                "KeyConditionExpression": "gsi1 = :k",
                "FilterExpression": "$.listMatchableOrdersFilter",
                "ExpressionAttributeValues": {
                    ":k": {
                        "S.$": "$.listMatchableOrdersKey"
                    },
                    ":p": {
                        "N.$": "$.newOrder.pricePerUnit"
                    }
                }
            },
            "Resource": "arn:aws:states:::aws-sdk:dynamodb:query",
            "Next": "Is Empty?",
            "ResultPath": "$.matchableOrders"
        },
        "Is Empty?": {
            "Type": "Choice",
            "Choices": [
                {
                    "Not": {
                        "Variable": "$.matchableOrders.Items",
                        "IsPresent": true
                    },
                    "Next": "Release Concurrency Lock"
                }
            ],
            "Default": "Match Orders"
        },
        "Match Orders": {
            "Type": "Task",
            "Resource": "arn:aws:states:::lambda:invoke",
            "OutputPath": "$.Payload",
            "Parameters": {
                "Payload.$": "$",
                "FunctionName": {'Fn::GetAtt': ['EngineExchangeMatchOrdersLambdaFunction', 'Arn' ]}
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
            "Next": "For each Update",
            "ResultPath": "$.updates"
        },
        "For each Update": {
            "Type": "Map",
            "Iterator": {
                "StartAt": "DynamoDB GetItem",
                "States": {
                    "DynamoDB GetItem": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::dynamodb:getItem",
                        "Parameters": {
                            "TableName": {Ref: "OrdersTable"},
                            "Key": {
                                "orderId": {
                                    "S.$": "$.orderId"
                                }
                            }
                        },
                        "Next": "Is Delete?",
                        "ResultPath": "$.order"
                    },
                    "Is Delete?": {
                        "Type": "Choice",
                        "Choices": [
                            {
                                "Variable": "$.action",
                                "StringEquals": "delete",
                                "Next": "Delete Order"
                            }
                        ],
                        "Default": "Update Order"
                    },
                    "Delete Order": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::dynamodb:deleteItem",
                        "Parameters": {
                            "TableName": {Ref: "OrdersTable"},
                            "Key": {
                                "orderId": {
                                    "S.$": "$.orderId"
                                }
                            }
                        },
                        "Next": "Is Buy Order?",
                        "ResultPath": null
                    },
                    "Is Buy Order?": {
                        "Type": "Choice",
                        "Choices": [
                            {
                                "Variable": "$.orderType",
                                "StringEquals": "buy",
                                "Next": "Add Goods"
                            }
                        ],
                        "Default": "Calculate Transaction Amount"
                    },
                    "Calculate Transaction Amount": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::lambda:invoke",
                        "OutputPath": "$.Payload",
                        "Parameters": {
                            "Payload.$": "$",
                            "FunctionName": {'Fn::GetAtt': ['EngineExchangeCalculateTransactionAmountLambdaFunction', 'Arn' ]}
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
                        "Next": "Create Transaction",
                        "ResultPath": "$.transaction"
                    },
                    "Add Goods": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::dynamodb:putItem",
                        "Parameters": {
                            "TableName": {Ref: "StorageUnitsTable"},
                            "Item": {
                                "ownerId": {
                                    "S.$": "$.Item.ownerId"
                                },
                                "storageUnitId": {
                                    "S.$": "States.UUID()"
                                },
                                "locationId": {
                                    "S.$": "$.Item.atBuildingId"
                                },
                                "good": {
                                    "S.$": "$.Item.good"
                                },
                                "quantity": {
                                    "N.$": "$.delta"
                                }
                            }
                        },
                        "End": true
                    },
                    "Create Transaction": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::dynamodb:putItem",
                        "Parameters": {
                            "TableName": {Ref:"TransactionsTable"},
                            "Item": {
                                "ownerId": {
                                    "S.$": "$.Item.ownerId"
                                },
                                "transactionId": {
                                    "S.$": "States.UUID()"
                                },
                                "amount": {
                                    "N.$": "$.transaction.transactionAmount"
                                },
                                "created": {
                                    "S.$": "$$.Execution.StartTime"
                                }
                            }
                        },
                        "End": true
                    },
                    "Update Order": {
                        "Type": "Task",
                        "Resource": "arn:aws:states:::dynamodb:updateItem",
                        "Parameters": {
                            "TableName": {Ref:"OrdersTable"},
                            "Key": {
                                "orderId": {
                                    "S.$": "$.orderId"
                                }
                            },
                            "UpdateExpression": "SET amount = amount + :d",
                            "ExpressionAttributeValues": {
                                ":d": {
                                    "N.$": "$.delta"
                                }
                            }
                        },
                        "Next": "Is Buy Order?",
                        "ResultPath": null
                    }
                }
            },
            "Next": "Release Concurrency Lock",
            "ItemsPath": "$.updates",
            "ResultPath": null
        },
        "Release Concurrency Lock": {
            "Type": "Task",
            "Resource": "arn:aws:states:::dynamodb:deleteItem",
            "Parameters": {
                "TableName": {Ref: "ExchangeLockTable"},
                "Key": {
                    "lockId": {
                        "S.$": "$.lockId"
                    }
                }
            },
            "End": true
        }
    }
}