# ShopHappily: AI-powered e-commerce (MERN + Redis + RAG + Docker)

An online store where shoppers can **ask for what they need in plain language** ("a waterproof jacket for
trekking under ₹5000", "what's your return policy?") and get a streamed, grounded answer with product cards.

| Layer | Tech | Job |
|---|---|---|
| Frontend | React 18, Vite, React Router | Shop, smart search, cart, orders, admin, streaming chat drawer |
| API | Node 20, Express, Zod | REST + Server-Sent Events, validation, auth |
| Database | MongoDB (Mongoose) | Source of truth: users, products, orders |
| Redis Stack | Redis + RediSearch | **Vector DB** (RAG), catalogue cache, carts, rate limiter, answer cache, idempotency keys |
| AI | Local embeddings (MiniLM, 384-dim) + Claude API | Retrieval + answer generation |
| Infra | Docker Compose, nginx, GitHub Actions | One-command run, CI |

## Run it

```bash
cp .env.example .env          # set JWT_SECRET (openssl rand -hex 32). API key is optional.
docker compose up --build
```

Open **http://localhost:3000**. On first start the server downloads the embedding model (~25 MB, cached in a
volume) and seeds 26 products + 6 store-policy docs. Wait for `[seed] vector index built` in
`docker compose logs -f server`. Chat works before that, but retrieval returns nothing until the index exists.

* Demo admin: `admin@shopmind.dev` / `Admin@12345` (set in `.env`)
* **No Anthropic key?** The assistant runs in *demo mode*: retrieval, filters, sources and streaming are
  real; only the final wording is templated. Add `ANTHROPIC_API_KEY` to `.env` and restart for real answers.
* Payment is simulated; policies and products are fictional demo data.

## Features

* Auth: bcrypt, JWT in an **httpOnly cookie**, roles (user/admin), login rate limiting
* Catalogue: keyword search (Mongo text index), **smart search** (vector KNN), category filter, sort, pagination
* Cart in Redis (hash, 7-day TTL); checkout with **atomic stock decrement** and **idempotency keys**
* Admin: add/delete products (auto-embedded into the vector index), rebuild index
* **RAG assistant**: retrieve (products + policies) -> price filter from the query -> similarity floor -> grounded prompt -> streamed answer
* Visible Redis behaviour: `X-Cache` badge on the catalogue, "served from Redis answer cache" in chat

## How Redis is used (six jobs)

1. **Vector database**: `FT.CREATE ... VECTOR HNSW ... COSINE`; `FT.SEARCH` with `KNN` + tag/numeric pre-filters
2. **Cache-aside** for catalogue reads, with *versioned keys* for instant invalidation
3. **Cart storage**: one hash per user, TTL
4. **Sliding-window rate limiter** in an atomic Lua script (chat per user, auth per IP)
5. **LLM answer cache** for standalone questions (keyed by catalogue version)
6. **Idempotency keys + lock** for checkout

## Useful commands

```bash
docker compose exec server npm run eval      # retrieval quality: hit@1 / hit@3 over 10 queries
docker compose exec server npm run reindex   # rebuild the vector index from Mongo
docker compose exec server npm run seed -- --force   # reset products
cd server && npm test                        # unit tests (no services needed)
```

## Local development (apps on host, databases in Docker)

```bash
docker run -d -p 27017:27017 mongo:7
docker run -d -p 6379:6379 redis/redis-stack-server:latest
cd server && npm install && JWT_SECRET=dev SEED_ON_START=true npm run dev
cd client && npm install && npm run dev      # http://localhost:5173, /api proxied to :5000
```

## API

| Method | Route | Notes |
|---|---|---|
| POST | /api/auth/register, /login, /logout | cookie session; 10 req/min/IP |
| GET | /api/auth/me | |
| GET | /api/products | `search, category, sort, page, limit`; Redis-cached (`X-Cache`) |
| GET | /api/products/semantic?q= | vector search, 30 req/min/IP |
| GET | /api/products/categories, /:id | |
| GET / PUT / DELETE | /api/cart, /api/cart/items, /api/cart | PUT `{productId, qty}` |
| GET / POST | /api/orders | POST honours `Idempotency-Key` |
| POST | /api/ai/chat | SSE: `sources` -> `token`* -> `done` / `error`; per-user rate limit |
| GET | /api/ai/stats | LLM calls, answer-cache hits |
| POST/PUT/DELETE | /api/admin/products, POST /api/admin/reindex | admin only |
| GET | /api/health | mongo, redis, ai mode, vector doc count |

See **docs/INTERVIEW_GUIDE.md** for the architecture walkthrough, trade-offs and likely interview questions.
