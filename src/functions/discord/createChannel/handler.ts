import {CloudFormationCustomResourceEvent} from "aws-lambda";
import {formatJSONResponse} from "@libs/api-gateway";
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
    baseURL: 'https://discord.com/api',
    headers: {
      Authorization: `Bearer ${await getSecret()}`
    }
  })
}

export const main = async (event: CloudFormationCustomResourceEvent) => {

  const requestType = event.RequestType;
  switch (requestType) {
    case "Create":
      await createChannel();
      break;
    case "Update":
      break;
    case "Delete":
      await deleteChannel();
  }

  return formatJSONResponse({

  })
};
