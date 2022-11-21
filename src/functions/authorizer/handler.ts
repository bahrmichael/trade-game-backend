import {APIGatewayAuthorizerEvent} from "aws-lambda/trigger/api-gateway-authorizer";
import jwt from "jsonwebtoken";

const {JWT_SECRET, VERSION} = process.env;

export const main = async (event: APIGatewayAuthorizerEvent) => {

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

    try {
        const {sub, internalApiKey} = jwt.verify(token, JWT_SECRET, {audience: 'player', issuer: VERSION});
        return generatePolicy('user', 'Allow', methodArn, internalApiKey, {discordId: sub});
    } catch(err) {
        console.log(err)
        return generatePolicy('user', 'Deny', methodArn, undefined, { error: { messageString: 'The Authorization token is invalid.' }});
    }
};

function generatePolicy(principalId, effect, resource, internalApiKey?: string, context?: any) {
    const authResponse: any = {};

    console.log(effect === 'Deny' ? 'Access denied' : 'Access granted')

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