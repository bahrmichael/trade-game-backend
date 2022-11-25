# Authentication

We use Bearer Authentication with JWTs to authenticate requests.

Your token is tied to a Discord account.

## Create a Token

Tokens may take up to 60 seconds to initialize. In that time you may receive a `403: Forbidden` error.

### v1 - OAuth2 Flow

This is the latest authentication flow. V2 is not available yet.

> We will eventually switch from OAuth2 to Discord commands. However, the latter require a proxy setup that's not ready yet.

To get a JWT token, go to `https://<instance>/api-key/start`, and sign in with your Discord account. Authorize the trade game
to identify your user, so that we can tie Discord IDs to API Keys.

### v2 - Discord Command

This is not available yet.

## Use the Token

Provide the token as a Bearer authentication header, like shown below:

```javascript
const request = {
    // ...
    header: { 'Authorization': 'Bearer MY_TOKEN' }
}
```

You can also test authenticated requests on the OpenAPI page. Go to `https://<instance>/openapi`, click on the Authorize
button in the top right, and enter the token (without Bearer). Then run a request, and check its request headers and response.

## Implementation Details

See the source code for authentication from these changes 
- https://github.com/bahrmichael/trade-game-backend/pull/24, 
- https://github.com/bahrmichael/trade-game-backend/pull/33, and
- https://github.com/bahrmichael/trade-game-backend/compare/7305137e748665db7b0c9eea34e2c5a3e9370ba2...d61585e1ed7f948659b19eb7ad595c8c74fe912a.