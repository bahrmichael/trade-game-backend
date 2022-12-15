import {DynamoDBStreamEvent} from "aws-lambda";
import {unmarshall} from "@aws-sdk/util-dynamodb";
import {AttributeValue} from "@aws-sdk/client-dynamodb";
import {Transaction} from "@libs/model";
import {UpdateCommand} from "@aws-sdk/lib-dynamodb";

const {PLAYERS_TABLE} = process.env;

export const main = async (event: DynamoDBStreamEvent) => {
    const newTransactions: Transaction[] = []
    for (const record of event.Records.map(({dynamodb}) => dynamodb).filter((r) => r.NewImage)) {
        console.log({record})
        newTransactions.push(unmarshall(record.NewImage as Record<string, AttributeValue>) as Transaction)
    }

    console.log({newTransactions})

    const deltaPerPlayer: Map<string, number> = new Map<string, number>();
    for (const t of newTransactions) {
        if (!deltaPerPlayer.has(t.ownerId)) {
            deltaPerPlayer.set(t.ownerId, 0);
        }
        deltaPerPlayer.set(t.ownerId, deltaPerPlayer.get(t.ownerId) + t.amount);
    }

    const commands = [];
    for (const [walletId, amount] of deltaPerPlayer.entries()) {
        commands.push(new UpdateCommand({
            TableName: PLAYERS_TABLE,
            Key: {walletId},
            UpdateExpression: 'set balance = balance + :a',
            ExpressionAttributeValues: {
                ':a': amount,
            }
        }))
    }
    await Promise.all(commands);
};

