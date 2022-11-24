# Trade Game Backend

More to come...

## Instances

The latest available instance is `https://st1mnt1acj.execute-api.us-east-1.amazonaws.com/20221023`. Start by looking at its [OpenAPI](https://st1mnt1acj.execute-api.us-east-1.amazonaws.com/20221023/openapi).

## OpenAPI

You can find the live version at `https://<instance>/openapi`.

We introduced OpenAPI documentation with https://github.com/bahrmichael/trade-game-backend/pull/18.

### Developing Trade Game

You can debug OpenAPI changes by running the command below, and paste it into editor.swagger.io.

```
serverless openapi generate -o openapi.yaml -f yaml && pbcopy < openapi.yaml
```

## Authentication

Check out https://github.com/bahrmichael/trade-game-backend/blob/main/docs/authentication.md