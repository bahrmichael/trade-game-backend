import {CloudFormationCustomResourceEvent} from "aws-lambda";
import axios from 'axios';
import {generateApiKey} from "generate-api-key";

function generateSecret() {
    return generateApiKey({method: 'uuidv5'})
}

export const main = async (event: CloudFormationCustomResourceEvent, context: any) => {

    const requestType = event.RequestType;

    try {
        let jwtSecret;
        switch (requestType) {
            case "Create":
                jwtSecret = generateSecret();
                break;
            case "Update":
            case "Delete":
                break;
        }
        const responseData = {}
        if (jwtSecret) {
            responseData['JwtSecret'] = jwtSecret;
        }
        await sendResponse(event, context, "SUCCESS", responseData);
    } catch (e) {
        console.error(e)
        await sendResponse(event, context, "FAILED", {}, e);
    }
};

// https://aws.plainenglish.io/simple-example-of-lambda-backed-custom-resource-in-aws-cloudformation-6cf2f9f1a101
// https://www.alexdebrie.com/posts/cloudformation-custom-resources/
async function sendResponse(event, context, responseStatus: 'FAILED' | 'SUCCESS', responseData, e?) {
    console.log("SENDING RESPONSE...\n");
    const reason = "See the details in CloudWatch Log Stream: " + context.logStreamName
    await axios.put(event.ResponseURL, {
        Status: responseStatus,
        Reason: (e ? e.message + " " : '') + reason,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData,
    });
}