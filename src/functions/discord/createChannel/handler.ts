import {CloudFormationCustomResourceEvent} from "aws-lambda";
import axios from "axios";
import {GetSecretValueCommand, SecretsManagerClient} from "@aws-sdk/client-secrets-manager";

const ssm = new SecretsManagerClient({});

const {VERSION, GUILD_ID} = process.env;

async function getSecret() {
  const secretResponse = await ssm.send(new GetSecretValueCommand({SecretId: 'discord_bot_secret'}))
  return secretResponse.SecretString
}

async function createChannel() {
  const discord = await getClient()
  await discord.post(`/guilds/${GUILD_ID}/channels`, {
    name: VERSION,
    // https://discord.com/developers/docs/resources/channel#channel-object-channel-types
    type: 0,
    topic: `Dev channel for pull request ${VERSION}`
  })
}

async function deleteChannel() {
  const discord = await getClient()
  const channels: { id: string, name: string }[] = await discord.get(`/guilds/${GUILD_ID}/channels`)
  const channel = channels.find((channel) => channel.name === VERSION);
  if (channel) {
    await discord.delete(`/channels/${channel.id}`);
  }
}

async function getClient() {
  return axios.create({
    baseURL: 'https://discord.com/api/v10',
    headers: {
      Authorization: `Bearer ${await getSecret()}`
    }
  })
}

export const main = async (event: CloudFormationCustomResourceEvent, context: any) => {

  const requestType = event.RequestType;

  try {
    switch (requestType) {
      case "Create":
        await createChannel();
        break;
      case "Update":
        break;
      case "Delete":
        await deleteChannel();
    }
    await sendResponse(event, context, "SUCCESS", {});
  } catch (e) {
    await sendResponse(event, context, "FAILED", {});
  }
};

// https://aws.plainenglish.io/simple-example-of-lambda-backed-custom-resource-in-aws-cloudformation-6cf2f9f1a101
// https://www.alexdebrie.com/posts/cloudformation-custom-resources/
async function sendResponse(event, context, responseStatus: 'FAILED' | 'SUCCESS', responseData) {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason:
        "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  });

  console.log("RESPONSE BODY:\n", responseBody);

  console.log("SENDING RESPONSE...\n");

  await axios.put(event.ResponseURL, {
    Status: responseStatus,
    Reason:
        "See the details in CloudWatch Log Stream: " + context.logStreamName,
    PhysicalResourceId: context.logStreamName,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  })
}

