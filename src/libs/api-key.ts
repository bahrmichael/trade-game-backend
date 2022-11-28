import {
    APIGatewayClient,
    CreateApiKeyCommand,
    CreateUsagePlanCommand,
    CreateUsagePlanKeyCommand,
    DeleteApiKeyCommand,
    DeleteUsagePlanKeyCommand,
    GetApiKeysCommand,
    GetUsagePlanKeysCommand,
    GetUsagePlansCommand,
    UpdateUsagePlanCommand
} from "@aws-sdk/client-api-gateway";
import jwt from "jsonwebtoken";

const apigw = new APIGatewayClient({});

const {API_ID, VERSION, JWT_SECRET} = process.env;

export async function createToken(sub: string, expiresIn?: number) {
    const usagePlanId = await createUsagePlan(`${VERSION}-${sub}`, API_ID, VERSION);
    const apiKey = await createApiKey(`${VERSION}-${sub}`, usagePlanId);

    const options: any = {};
    if (expiresIn >= 0) {
        options.expiresIn = expiresIn;
    }
    return jwt.sign({sub, aud: 'player', iss: VERSION, internalApiKey: apiKey}, JWT_SECRET, options);
}

async function createUsagePlan(usagePlanName: string, apiId: string, version: string): Promise<string> {
    const usagePlans = await apigw.send(new GetUsagePlansCommand({
        // todo: once we have more than 500 usage plans (or users) we need to find a better way
        limit: 500,
    }))
    let usagePlan = usagePlans.items.find((usagePlan) => usagePlan.name === usagePlanName);
    if (!usagePlan) {
        usagePlan = await apigw.send(new CreateUsagePlanCommand({
            name: usagePlanName,
            throttle: {
                rateLimit: 10,
                burstLimit: 50,
            },
            quota: {
                limit: 1_000,
                period: "DAY",
            }
        }))
    }

    const existingApiStageAttachment = usagePlan.apiStages?.find((apiStage) => apiStage.apiId === apiId)
    if (!existingApiStageAttachment) {
        await apigw.send(new UpdateUsagePlanCommand({
            usagePlanId: usagePlan.id,
            patchOperations: [{
                op: 'add',
                path: '/apiStages',
                value: `${apiId}:${version}`
            }]
        }))
    }
    return usagePlan.id;
}

async function createApiKey(apiKeyName: string, usagePlanId: string): Promise<string> {
    const existingApiKeys = await apigw.send(new GetApiKeysCommand({
        nameQuery: apiKeyName,
    }))

    for (const existingApiKey of existingApiKeys.items) {
        console.log('Loading usage plan keys', {usagePlanId})
        const usagePlanKeys = await apigw.send(new GetUsagePlanKeysCommand({
            usagePlanId,
        }));
        for (const usagePlanKey of usagePlanKeys.items) {
            console.log('Deleting usage plan key', {apiKeyId: existingApiKey.id, usagePlanId: usagePlanKey.id})
            try {
                await apigw.send(new DeleteUsagePlanKeyCommand({
                    usagePlanId: usagePlanKey.id,
                    keyId: existingApiKey.id,
                }));
            } catch (e) {
                if (e.name === 'NotFoundException') {
                    console.log(e)
                    // Not sure why, but even after the list call above we seem to receive usagePlanKeys that don't exist
                } else {
                    throw e;
                }
            }
        }
        console.log('Deleting api key', {apiKeyId: existingApiKey.id})
        await apigw.send(new DeleteApiKeyCommand({
            apiKey: existingApiKey.id,
        }))
    }

    const apiKey = await apigw.send(new CreateApiKeyCommand({
        enabled: true,
        name: apiKeyName,
    }))

    try {
        await apigw.send(new CreateUsagePlanKeyCommand({
            usagePlanId,
            keyType: "API_KEY",
            keyId: apiKey.id,
        }))
    } catch (e) {
        console.log('Failed to associate usage plan', e);
        throw e;
    }
    return apiKey.value;
}