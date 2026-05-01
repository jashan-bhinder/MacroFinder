# MacroFinder API

This server is the Phase 1 MongoDB scaffold for MacroFinder.

## What it does

- connects to MongoDB Atlas
- seeds the current JSON data into MongoDB
- serves `GET /api/health`
- serves `GET /api/bootstrap`

## Local setup

1. Copy `server/.env.example` to `server/.env`
2. Fill in:
   - `MONGODB_URI`
   - `MONGODB_DB_NAME`
3. Install dependencies from the repo root:

```bash
npm run setup
```

4. Seed MongoDB:

```bash
npm run seed
```

5. Start the API:

```bash
npm run dev:server
```

6. In a second terminal, start the frontend:

```bash
npm run dev:client
```

The Vite frontend proxies `/api` to `http://localhost:4000` during local development.

## Atlas checklist

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Add your IP address to the Atlas access list
4. Copy the connection string into `server/.env`
5. Run `npm run seed`

## Collections seeded

- `restaurants`
- `items`
- `users`
- `requests`
- `tasks`
