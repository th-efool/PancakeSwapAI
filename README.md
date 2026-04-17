# PancakeSwapAI Backend

## Deployment contract (Railway)

This service expects a strict build/start sequence:

1. `npm run build`
2. `npm start`

`npm start` runs `node dist/index.js`, and `prestart` enforces that a fresh build is produced before startup.

### Runtime expectations

- Backend binds to `0.0.0.0` on `process.env.PORT` (fallback `3000`).
- `/state` serves the latest in-memory pipeline snapshot first.
- If in-memory state is unavailable or malformed, `/state` falls back to `latest_state.json`.
- If both sources fail validation, `/state` returns:

```json
{ "status": "starting" }
```

### Crash telemetry

Process-level fatal handlers are enabled for:

- `uncaughtException`
- `unhandledRejection`

Server-level listen errors are also fatal and logged to help diagnose Railway 502 restart loops.
