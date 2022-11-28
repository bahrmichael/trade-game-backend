import {CloudFormationCustomResourceEvent} from "aws-lambda";
import axios from 'axios';
import {createToken} from "@libs/api-key";
import {ddb} from "@libs/ddb-client";
import {PutCommand} from "@aws-sdk/lib-dynamodb";

const ONE_HOUR = 60 * 60;

const {TABLE} = process.env;

async function initToken() {
    const timeToLive = Math.ceil(new Date().getTime() / 1_000) + 2 * ONE_HOUR;
    const token = await createToken('testUser', timeToLive);
    // Don't delay on init, so that tests can finish as soon as possible
    const visibleFrom = new Date().getTime();

    await ddb.send(new PutCommand({
        TableName: TABLE,
        Item: {
            pk: 'key',
            visibleFrom,
            token: token,
            timeToLive,
        }
    }));
}

export const main = async (event: CloudFormationCustomResourceEvent, context: any) => {

    const requestType = event.RequestType;

    try {
        switch (requestType) {
            case "Create":
                await initToken();
                break;
            case "Update":
            case "Delete":
                break;
        }
        await sendResponse(event, context, "SUCCESS", {});
    } catch (e) {
        console.error(e)
        await sendResponse(event, context, "FAILED", {}, e);
    }
};

// https://aws.plainenglish.io/simple-example-of-lambda-backed-custom-resource-in-aws-cloudformation-6cf2f9f1a101
// https://www.alexdebrie.com/posts/cloudformation-custom-resources/
async function sendResponse(event, context, responseStatus: 'FAILED' | 'SUCCESS', responseData, e?) {
    console.log("SENDING RESPONSE...\n", responseData);
    const reason = "See the details in CloudWatch Log Stream: " + context.logStreamName
    await axios.put(event.ResponseURL, {
        Status: responseStatus,
        Reason: (e ? e.message + " " + JSON.stringify(responseData) + " " : '') + reason,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData,
    });
}