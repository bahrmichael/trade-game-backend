import {CloudFormationCustomResourceEvent} from "aws-lambda";
import axios from "axios";
import {GetSecretValueCommand, SecretsManagerClient} from "@aws-sdk/client-secrets-manager";

const ssm = new SecretsManagerClient({});

const {VERSION, GUILD_ID} = process.env;

async function getSecret() {
  const secretResponse = await ssm.send(new GetSecretValueCommand({SecretId: 'discord_bot_secret'}))
  console.log(secretResponse)
  return secretResponse.SecretString
}

async function createChannel(): Promise<string> {
  const discord = await getClient()
  const channel = await getChannel(discord)
  if (!channel) {
    const channelRes = await discord.post(`/guilds/${GUILD_ID}/channels`, {
      name: VERSION,
      // https://discord.com/developers/docs/resources/channel#channel-object-channel-types
      type: 0,
      topic: `Dev channel for pull request ${VERSION}`
    })

    const {id} = channelRes.data;
    return id;
  } else {
    return channel.id;
  }
}

async function deleteChannel() {
  const discord = await getClient()
  const channel = await getChannel(discord)
  if (channel) {
    await discord.delete(`/channels/${channel.id}`);
  }
}

async function getChannel(discord: any) {
  const channels: { id: string, name: string }[] = (await discord.get(`/guilds/${GUILD_ID}/channels`)).data
  return channels.find((channel) => channel.name === VERSION)
}

async function getClient() {
  return axios.create({
    baseURL: 'https://discord.com/api/v10',
    headers: {
      Authorization: `Bot ${await getSecret()}`
    }
  })
}

export const main = async (event: CloudFormationCustomResourceEvent, context: any) => {

  const requestType = event.RequestType;

  try {
    let channelId;
    switch (requestType) {
      case "Create":
        channelId = await createChannel();
        break;
      case "Update":
        break;
      case "Delete":
        await deleteChannel();
    }
    const responseData = {}
    if (channelId) {
      responseData[channelId] = channelId;
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
  })
}

