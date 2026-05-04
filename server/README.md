# MacroFinder API

This server now backs the demo app with MongoDB for:

- restaurants and items
- users, saved items, and saved restaurants
- owner/admin requests and tasks
- uploaded PDFs/images/files through GridFS

## What it does

- connects to MongoDB Atlas
- seeds the current app JSON data into MongoDB
- migrates the remaining demo and pipeline JSON files into MongoDB
- serves `GET /api/health`
- serves `GET /api/bootstrap`
- serves `GET /api/app-state`
- serves `POST /api/files` and `GET /api/files/:fileId`

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

`npm run seed` is a reset seed. It replaces the main app collections:

- `restaurants`
- `items`
- `users`
- `requests`
- `tasks`

5. Migrate the remaining JSON-only datasets without wiping live app data:

```bash
npm run migrate:json
```

This imports the leftover JSON files into dedicated Mongo collections like:

- `legacy_demo_users`
- `legacy_demo_requests`
- `legacy_demo_tasks`
- `owner_item_drafts`
- `menu_items_raw`
- `menu_items_imputed`
- `pipeline_parse_summaries`
- `pipeline_imputation_summaries`

6. Start the API:

```bash
npm run dev:server
```

7. In a second terminal, start the frontend:

```bash
npm run dev:client
```

The Vite frontend proxies `/api` to `http://localhost:4000` during local development.

## Deploy to Render

This repo includes [render.yaml](/Users/gurwinder/IdeaProjects/MacroFinder/render.yaml) for a single-service deployment:

- Render builds the Vite frontend from `mainfiles`
- Render starts the Express server from `server`
- the Express server serves the built frontend and the `/api/*` routes from one URL

### Recommended deploy flow

1. Push the repo to GitHub
2. In Render, create a new Blueprint deploy from the repo
3. Let Render load `render.yaml`
4. Set the `MONGODB_URI` environment variable in Render
5. Keep the provided demo-safe env vars:
   - `DISABLE_PUBLIC_SIGNUP=true`
   - `PUBLIC_DEMO_MODE=true`
   - `SERVE_STATIC_FRONTEND=true`
6. Deploy

After the first deploy, seed the hosted database once:

```bash
npm run seed
npm run migrate:json
```

You can run those from your local machine against the same Atlas database, or from a Render shell.

### Public demo behavior

The deployed demo is intentionally a little stricter than local dev:

- public signup is disabled
- issue submissions require login
- owner/admin mutation routes require real seeded demo accounts
- uploaded support files are stored in MongoDB GridFS

That makes the public link safer to share on a resume while still letting interviewers explore the real flows.

## Atlas checklist

1. Create a MongoDB Atlas cluster
2. Create a database user
3. Add your IP address to the Atlas access list
4. Copy the connection string into `server/.env`
5. Run `npm run seed`
6. Run `npm run migrate:json`

## Core collections seeded

- `restaurants`
- `items`
- `users`
- `requests`
- `tasks`
