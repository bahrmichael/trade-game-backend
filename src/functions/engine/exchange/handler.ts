import {DynamoDBStreamEvent} from "aws-lambda";
import {unmarshall} from "@aws-sdk/util-dynamodb";
import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {Order, OrderGsi1pk, OrderType} from "@libs/model";
import {ddb} from "@libs/ddb-client";
import {DeleteCommand, QueryCommand, UpdateCommand} from "@aws-sdk/lib-dynamodb";
import {matchOrders} from "@functions/engine/exchange/logic";

const {ORDERS_TABLE} = process.env;

export const main = async (event: DynamoDBStreamEvent) => {
    const newOrders: Order[] = []
    for (const record of event.Records.map(({dynamodb}) => dynamodb).filter((r) => r.NewImage)) {
        console.log({record})
        newOrders.push(unmarshall(record.NewImage as Record<string, AttributeValue>) as Order)
    }

    console.log({newOrders})

    for (const newOrder of newOrders) {
        const invertedOrderType: OrderType = newOrder.orderType === 'buy' ? 'sell' : 'buy'
        const key: OrderGsi1pk = `${newOrder.atBuildingId}#${newOrder.good}#${invertedOrderType}`;
        const availableOrders: Order[] = (await ddb.send(new QueryCommand({
            TableName: ORDERS_TABLE,
            IndexName: 'GSI1',
            KeyConditionExpression: 'gsi1 = :k',
            ExpressionAttributeValues: {
                ':k': key,
            }
        }))).Items as Order[];

        const updates = matchOrders(newOrder, availableOrders);
        const orderCommands = updates
            .map((u) => {
                if (u.action === 'delete') {
                    return new DeleteCommand({
                        TableName: ORDERS_TABLE,
                        Key: { orderId: u.orderId }
                    });
                } else {
                    return new UpdateCommand({
                        TableName: ORDERS_TABLE,
                        Key: { orderId: u.orderId },
                        UpdateExpression: 'amount'
                    })
                }
            });
        await Promise.all(orderCommands.map((c) => ddb.send(c)));

        // We don't need to release cargo or vehicles here
        // When a request to move a vehicle arrives, we can check the orders table if there are any orders that lock this vehicle
    }
};

