# Frontend Tester

A simple, stateless HTML frontend for testing the Wallet API.

## Access

Run `docker-compose up -d` then visit: **http://localhost:8080**

## Features

- **Topup**: Add funds to a wallet
- **Charge**: Withdraw funds (respects daily limit of 10,000)
- **Balance**: View current balance and last 10 transactions
- **Verbose Debugging**: Full request/response details including:
  - Timestamps
  - HTTP status codes
  - Request/response headers
  - JSON payloads
  - Timing information
  - Error stack traces

## Testing Tips

1. **Idempotency**: Use the same `idempotencyKey` multiple times to see safe retries
2. **Daily Limit**: Charge more than 10,000 to trigger `LIMIT_EXCEEDED` error
3. **Insufficient Funds**: Charge more than available balance to see `INSUFFICIENT_FUNDS` error
4. **Validation**: Leave fields empty to see validation errors
5. **Multiple Users**: Use different `userId` values to test multiple wallets

## Troubleshooting

If you see "Network Error", check:

1. Run `docker-compose ps` to verify all services are running
2. Check the API URL configuration at the top of the page
3. Check browser console for CORS or network errors

## Technical Details

- Built with vanilla HTML, CSS, and JavaScript
- No frameworks or build tools
- Served by nginx:alpine Docker container
- Read-only volume mount for security
- Stateless - no cookies or local storage
