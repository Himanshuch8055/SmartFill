# SmartFill Server (experimental)

> **Not used by the extension.** SmartFill stores all data locally in the browser. This Express + MongoDB scaffold is kept as a starting point for a possible future, opt-in, end-to-end-encrypted sync service. It has no auth and no real endpoints yet, so do not deploy it.

## Dev

```bash
npm install
cp .env.example .env
npm run dev
```

## Routes

- `GET /api/health` — Service health
- `GET /api/example` — Demo route
