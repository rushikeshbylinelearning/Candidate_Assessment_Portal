# Assessment Portal — Production Deployment Guide

Optimized for **shared hosting**, **LiteSpeed Passenger**, **low-RAM VPS**, and **PM2** (single fork instance).

## Resource targets

| Metric | Before (typical) | After (estimated) |
|--------|------------------|-------------------|
| Node processes | 1 (+ spikes from parallel parsing) | **1** (fork only) |
| MongoDB pool | ~100 (driver default) | **3–5** |
| Concurrent Gemini/PDF jobs | Unlimited | **2** (configurable) |
| Analytics API calls / session | 6+ (Dashboard + Analytics) | **3** (cached 60s server + 55s client) |
| Candidates list API on mount | 4 requests | **2** |
| Initial JS bundle | Single monolith chunk | **Lazy routes + manual chunks** |
| Idle resume polling | Every 3s fixed | **3–12s exponential backoff** |

## Environment variables

Copy `backend/.env.example` to `backend/.env` and set:

```bash
NODE_ENV=production
MONGODB_MAX_POOL_SIZE=5
MAX_BACKGROUND_TASKS=2
RATE_LIMIT_MAX=300
TRUST_PROXY=true
```

## Build & start

```bash
# From candidate-assessment-portal/
cd frontend && npm ci && npm run build
cd ../backend && npm ci && npm run build:prod   # or npm run build

# Direct start
cd backend && npm run start:win    # Windows
# or
NODE_ENV=production node server.js
```

## PM2 (recommended VPS)

```bash
npm install -g pm2
cd candidate-assessment-portal
pm2 start ecosystem.config.cjs --env production
pm2 save
```

**Important:** Use `instances: 1` and `exec_mode: fork`. Do not enable cluster mode on shared hosts with process limits.

## LiteSpeed / Passenger / cPanel

1. Set **Node.js version** ≥ 18.
2. Application root: `backend/`, startup file: `server.js`.
3. Environment: `NODE_ENV=production`, `PORT` as assigned by host.
4. Enable **Passenger** single instance; avoid spawning multiple Node apps for the same site.
5. Set `TRUST_PROXY=true` behind reverse proxy.
6. Serve uploads from `backend/uploads` (persistent volume).

## Response cache

Server-side in-memory cache reduces MongoDB reads on page reload:

- Scoped **per user** (JWT user id) — no cross-account data leaks
- Bounded to **300 entries** with LRU eviction
- Auto-invalidates on POST/PUT/DELETE for related data
- Skips live endpoints: `/status`, `/tokens`, auth, webhooks

Client-side `sessionStorage` cache mirrors GET responses for the same TTL window (tab-scoped).

Tune via `CACHE_TTL_*` and `CACHE_MAX_ENTRIES` in `backend/.env`.

Check hit rate: `GET /api/health` → `cache.hitRate`.

Force fresh data: add `?nocache=1` to any GET, or use `api.get(url, forceRefresh())` in code.

## Health check

```http
GET /api/health
```

Returns DB state, memory (MB), uptime, request/error counts, background task queue stats.

## Monitoring

- Production logs: **errors and slow requests (>1s)** only.
- Development: full request timing via `appLogger`.
- Memory restart: configure `PM2_MAX_MEMORY=400M` in ecosystem file.

## MongoDB indexes

Candidate indexes are defined in the schema (`appliedRole`, `assessmentStatus`, `finalDecision`, `email`, text on name/email). Run once in production if upgrading an existing DB:

```js
db.candidates.createIndex({ appliedRole: 1, assessmentStatus: 1 })
```

## Security checklist

- [ ] Strong `JWT_SECRET`
- [ ] `RATE_LIMIT_MAX` appropriate for your traffic
- [ ] CORS `CLIENT_URL` set to production domain only
- [ ] Remove localhost origins from `server.js` allowedOrigins in strict production (optional)
- [ ] `GEMINI_API_KEY` only on server, never in frontend

## Troubleshooting

| Symptom | Action |
|---------|--------|
| Process limit exceeded | Ensure PM2 `instances: 1`; lower `MAX_BACKGROUND_TASKS` to 1 |
| High RAM | Lower `MONGODB_MAX_POOL_SIZE` to 3; set `PM2_MAX_MEMORY` |
| Slow candidates list | N+1 pipeline queries fixed — redeploy backend |
| 503 on `/api/health` | MongoDB disconnected — check `MONGODB_URI` |
