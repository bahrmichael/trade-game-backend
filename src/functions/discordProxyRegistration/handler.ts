import {CloudFormationCustomResourceEvent} from "aws-lambda";
import axios from 'axios';
import {generateApiKey} from "generate-api-key";
import {GetSecretValueCommand, SecretsManagerClient} from "@aws-sdk/client-secrets-manager";
const ssm = new SecretsManagerClient({});

const {VERSION, DISCORD_PROXY_ENDPOINT} = process.env;

function generateSecret(): string | string[] {
    return generateApiKey({method: 'uuidv4'})
}

async function getDiscordProxySecret() {
    return (await ssm.send(new GetSecretValueCommand({SecretId: 'discord-proxy/endpoint-registration'}))).SecretString;
}

async function registerWithProxy() {
    const discordProxySecret = await getDiscordProxySecret();
    const secret = generateSecret();
    await axios.put(`${DISCORD_PROXY_ENDPOINT}/endpoints/${VERSION}`, {
        url: `https://${VERSION}.api.apiempires.com`,
        commands: ['apikey'],
        secret,
    }, {
        headers: {
            Authorization: `DiscordProxy ${discordProxySecret}`
        }
    })
    return secret;
}

async function deregisterFromProxy() {
    const discordProxySecret = await getDiscordProxySecret();
    await axios.delete(`${DISCORD_PROXY_ENDPOINT}/endpoints/${VERSION}`, {
        headers: {
            Authorization: `DiscordProxy ${discordProxySecret}`
        }
    })
}

export const main = async (event: CloudFormationCustomResourceEvent, context: any) => {

    const requestType = event.RequestType;

    try {
        let secret;
        switch (requestType) {
            case "Create":
                secret = await registerWithProxy()
                break;
            case "Update":
                break;
            case "Delete":
                await deregisterFromProxy()
                break;
        }
        const responseData = {}
        if (secret) {
            responseData['SecretForDiscordProxy'] = secret;
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