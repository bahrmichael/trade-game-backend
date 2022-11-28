# Testing

Introduced with https://github.com/bahrmichael/trade-game-backend/pull/39

## Troubleshooting

### Rare 403s

The token is rotated every 2 hours. When a rotation happens, the API may throw 403s for a minute or two for that token.