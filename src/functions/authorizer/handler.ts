import 'source-map-support/register';
import {APIGatewayAuthorizerEvent} from "aws-lambda/trigger/api-gateway-authorizer";
import {verify} from "jsonwebtoken";
import {ddb} from "@libs/ddb-client";
import {GetCommand} from "@aws-sdk/lib-dynamodb";

const {JWT_SECRET_TABLE} = process.env;

export const main = async (event: APIGatewayAuthorizerEvent) => {

    console.log({authType: event.type});

    let authorizationToken;
    if (event.type === 'REQUEST') {
        /*
        Lowercase the headers so that the customer doesn't have to respect casing on
        the authorization header. E.g. insomnia sent a lowercase authorization header.
         */
        for (const key of Object.keys(event.headers)) {
            event.headers[key.toLowerCase()] = event.headers[key];
        }
        authorizationToken = event.headers.authorization;
    } else {
        throw Error(`Unhandled authorizer event type: ${event.type}`);
    }

    const {methodArn} = event;

    if (!authorizationToken) {
        console.log('Access denied. Missing authorizationToken.')
        return generatePolicy('user', 'Deny', methodArn, undefined, { error: { messageString: 'The Authorization header is missing.' }});
    }

    if (!authorizationToken.startsWith('Bearer ')) {
        console.log('Access denied. Authorization header does not start with "Bearer ".')
        return generatePolicy('user', 'Deny', methodArn, undefined, { error: { messageString: 'The Authorization header should be in the Bearer format.' }});
    }

    const token = authorizationToken.split(' ')[1];

    const jwtSecret = (await ddb.send(new GetCommand({
        TableName: JWT_SECRET_TABLE,
        Key: {id: 'jwt_secret'}
    }))).Item?.value;

    try {
        const {owner} = verify(token, jwtSecret);
        return generatePolicy('user', 'Allow', methodArn, token, {owner});
    } catch(err) {
        return generatePolicy('user', 'Deny', methodArn, token, { error: { messageString: 'The Authorization token is invalid.' }});
    }
};

function generatePolicy(principalId, effect, resource, internalApiKey?: string, context?: any) {
    const authResponse: any = {};

    authResponse.principalId = principalId;
    if (effect && resource) {
        const policyDocument: any = {};
        policyDocument.Version = '2012-10-17';
        policyDocument.Statement = [];
        const statementOne: any = {};
        statementOne.Action = 'execute-api:Invoke';
        statementOne.Effect = effect;
        statementOne.Resource = resource;
        policyDocument.Statement[0] = statementOne;
        authResponse.policyDocument = policyDocument;
    }

    authResponse.context = context;
    authResponse.usageIdentifierKey = internalApiKey;
    return authResponse;
}