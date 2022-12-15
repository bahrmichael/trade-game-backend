import {DynamoDBStreamEvent} from "aws-lambda";
import {unmarshall} from "@aws-sdk/util-dynamodb";
import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {Order, OrderGsi1pk, OrderType} from "@libs/model";
import {SFNClient, StartExecutionCommand} from "@aws-sdk/client-sfn";

const {EXCHANGE_STATE_MACHINE_ARN} = process.env;

const sfn = new SFNClient({});

export const main = async (event: DynamoDBStreamEvent) => {
    const newOrders: Order[] = []
    for (const record of event.Records.map(({dynamodb}) => dynamodb).filter((r) => r.NewImage)) {
        console.log({record})
        newOrders.push(unmarshall(record.NewImage as Record<string, AttributeValue>) as Order)
    }

    const lockCounts: Map<string, number> = new Map<string, number>();
    for (const newOrder of newOrders) {
        // Locking for both buy and sell orders, because the newOrder should not be resolved by another opposing order jumping in
        const lockId = `${newOrder.atBuildingId}#${newOrder.good}`;
        // Count the locks processed in this function to add an offset
        const lockCount = lockCounts.get(lockId) ?? 0;
        lockCounts.set(lockId, lockCount + 1);
        const initialOffsetSeconds = lockCount;

        const listMatchableOrdersFilter = `pricePerUnit ${newOrder.orderType === 'buy' ? '<=' : '>=' } :p`;
        const invertedOrderType: OrderType = newOrder.orderType === 'buy' ? 'sell' : 'buy'
        const listMatchableOrdersKey: OrderGsi1pk = `${newOrder.atBuildingId}#${newOrder.good}#${invertedOrderType}`;

        await sfn.send(new StartExecutionCommand({
            stateMachineArn: EXCHANGE_STATE_MACHINE_ARN,
            input: JSON.stringify({
                newOrder,
                lockId,
                initialOffsetSeconds,
                listMatchableOrdersFilter,
                listMatchableOrdersKey,
            })
        }))
    }
};

