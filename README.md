# ResearchMind

A production-grade AI research & knowledge platform: upload your own documents for retrieval-augmented Q&A, run a multi-agent deep-research pipeline on any topic (live web search → read → write → critique), and chat conversationally with an assistant that can reach for both your documents and the web.

Built on top of an existing prototype (`python_backend/` - a Streamlit multi-agent research pipeline using LangChain + Mistral + Tavily) and expanded into the full three-tier architecture below.

## Architecture

```
Client (React + Vite)
        │  never calls the AI service directly
        ▼
Node.js / Express  ── auth, RBAC, MongoDB, sessions, history, proxies AI calls
        │  X-Internal-Api-Key
        ▼
FastAPI (Python)   ── RAG (FAISS/Mongo vector search), multi-agent research, chat agent
        │
        ▼
MongoDB            ── Node's business data. The AI service keeps its own local
                       SQLite registries + vector index (see ai-service/README notes below).
```

The frontend only ever talks to the Node server. Node is the only authorized caller of the FastAPI service, enforced by a shared `X-Internal-Api-Key` header.

## Tech stack

| Layer | Stack |
|---|---|
| Client | React 18, Vite, Tailwind CSS, Framer Motion, React Router v6, React Hook Form + Zod, Axios |
| Server | Node.js, Express, MongoDB/Mongoose, single stateless JWT, RBAC, Zod validation, Winston, Swagger |
| AI Service | FastAPI, LangChain 1.x / LangGraph, Mistral (default LLM + embeddings), Tavily web search, FAISS / MongoDB Atlas Vector Search |

## ⚠️ Security note

The uploaded prototype's `python_backend/.env` contained **live Tavily and Mistral API keys**, and that file was committed to git history. Those values were **not** carried into this project - every `.env.example` here uses placeholders only. **Rotate both keys** (Mistral console, Tavily dashboard) before using this project, since they must be treated as already compromised. Going forward, `.gitignore` at every level excludes `.env` files.

## What was reconciled from the original prototype

The original code was a single-file Streamlit app with a 4-stage agent pipeline (Search → Reader → Writer → Critic) and no API, no document upload, and no persistence. Rather than discard it, it was upgraded and folded into the new spec:

- The Search/Reader agents and Writer/Critic chains now run async, inside FastAPI, with retries and structured logging - reachable via `POST /ask` with `mode=research`.
- A new RAG layer (upload, chunk, embed, vector search) was added for `POST /ask` with `mode=quick` and `POST /chat`, which use a tool-calling agent that can pull from your documents and/or the live web.
- "Research mode" reports are persisted like any other chat message (see `Chat.model.js`'s `researchData` field), so they survive a page reload same as a quick answer would.

## Project structure

```
multi-agent-system/
├── ai-service/         FastAPI - RAG, agents, vector store (see ai-service/.env.example)
├── server/             Express - auth, RBAC, MongoDB, proxies ai-service (see server/.env.example)
├── client/             React - dashboard, chat, documents, history, admin (see client/.env.example)
├── docker-compose.yml  Runs all four containers together (mongo, ai-service, server, client)
└── .env.example        Root env file, only used by docker-compose
```

## Getting started

### Option A - Docker Compose (recommended)

```bash
cp .env.example .env
# edit .env: set INTERNAL_API_KEY, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET (all random strings),
# and MISTRAL_API_KEY + TAVILY_API_KEY (your own, freshly rotated keys)

docker compose up --build
```

- Client: http://localhost:8080
- Server API: http://localhost:5000/api (docs at `/api-docs`)
- AI service is internal-only (not published to the host) by design

### Option B - Run each service locally

Prerequisites: Node.js 18+, Python 3.11+, MongoDB running locally (or an Atlas connection string).

**1. AI service**

```bash
cd ai-service
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # fill in INTERNAL_API_KEY, MISTRAL_API_KEY, TAVILY_API_KEY
uvicorn app.main:app --reload --port 8000
```

Swagger docs: http://localhost:8000/docs

**2. Server**

```bash
cd server
npm install
cp .env.example .env   # fill in MONGODB_URI, JWT secrets, INTERNAL_AI_SERVICE_API_KEY (must match ai-service's INTERNAL_API_KEY)
npm run dev
```

API docs: http://localhost:5000/api-docs

**3. Client**

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

http://localhost:5173

### Creating the first admin account

Register a normal account through the UI, then either:
- Set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` in `server/.env` and run `npm run seed:admin`, or
- Manually set that user's `role` to `admin` in the `users` collection.

## Environment variables

Each service documents its own variables in full inside its `.env.example`:
- `ai-service/.env.example`
- `server/.env.example`
- `client/.env.example`

The most important ones to actually change before running anything real:

| Variable | Where | Why |
|---|---|---|
| `INTERNAL_API_KEY` (ai-service) / `INTERNAL_AI_SERVICE_API_KEY` (server) | both | Must be the identical value - it's how Node authenticates to the AI service |
| `JWT_SECRET` | server | Any long random string. Single stateless token - no refresh token, so keep the expiry (`JWT_EXPIRES_IN`, default 7d) reasonable for your use case |
| `MISTRAL_API_KEY` | ai-service | LLM + embeddings (default provider) |
| `TAVILY_API_KEY` | ai-service | Powers the `web_search` tool |
| `VECTOR_DB_PROVIDER` | ai-service | `faiss` (default, zero-infra) or `mongodb` (requires Atlas Vector Search) |

## API overview

### FastAPI (internal only - `ai-service`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/upload` | Extract, chunk, embed, and index a document |
| POST | `/ask` | `mode=quick` → RAG+tool answer; `mode=research` → full 4-agent pipeline |
| POST | `/chat` | Multi-turn conversational agent with document + web tools |
| POST | `/search` | Pure retrieval - documents, web, or both |
| POST | `/summarize` | Map-reduce summary of a stored document or raw text |
| GET | `/documents` | List indexed documents |
| DELETE | `/documents/{file}` | Remove a document from the index |
| POST | `/rebuild-vector-db` | Re-chunk and re-embed everything |
| GET | `/health` | Service + dependency status |
| GET | `/history/{session_id}` | This service's own turn buffer for a session |

Full request/response schemas: `http://localhost:8000/docs`.

### Node/Express (public - `server`)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/login`, `/logout` | Auth (single stateless JWT - no refresh token) |
| GET/PATCH | `/api/users/me` | Profile |
| POST | `/api/users/me/password` | Change password |
| GET | `/api/users` *(admin)* | List users |
| PATCH | `/api/users/:id/role`, `/:id/status` *(admin)* | RBAC management |
| POST/GET | `/api/sessions` | Create/list conversations |
| GET | `/api/sessions/:id/messages` | Load a conversation |
| POST | `/api/sessions/:id/messages` | Send a chat/research message |
| PATCH/DELETE | `/api/sessions/:id` | Archive/delete a conversation |
| POST/GET | `/api/documents` | Upload/list documents |
| DELETE | `/api/documents/:id` | Delete a document |
| GET | `/api/documents/admin/all` *(admin)* | All documents, any owner |
| POST | `/api/documents/rebuild-vector-db` *(admin)* | Rebuild the vector index |
| POST | `/api/ai/ask`, `/search`, `/summarize` | Direct AI-service passthroughs |
| GET | `/api/history` | Activity feed |
| GET | `/api/admin/overview`, `/ai-requests`, `/logs` *(admin)* | System monitoring |

Full Swagger docs: `http://localhost:5000/api-docs`.

## What's been tested

- **ai-service**: booted end-to-end against real HTTP requests - auth enforcement, file-type/size validation, Pydantic validation errors, and graceful (non-crashing) failure when an LLM provider key is missing were all verified live, not just read through.
- **server**: full dependency install + require-chain resolution verified (every controller/service/model/route wires together correctly); auth, RBAC, and the AI-service client were reviewed in detail against the ai-service's actual contract.
- **client**: full `vite build` production build passes clean with code-split vendor chunks.

## Known limitations / good next steps

- Auth uses a single stateless JWT (by design - see below) rather than an access+refresh pair. This means a token cannot be individually revoked before it expires; if that matters for your use case, the lowest-effort upgrade path is adding a `tokenVersion` field to `User` that gets embedded in the JWT and bumped on demand, without reintroducing a second token or a token-storage collection.
- No automated test suite yet (Pytest for ai-service, Jest/Supertest for server, Vitest/RTL for client would be the natural next addition).
- No CI/CD pipeline is included.
- The AI service's own SQLite-backed registries (indexed documents, session buffers) are single-node by design - fine for one instance, but would need to move to Mongo/Atlas Vector Search (already supported as a provider) or Postgres before running multiple ai-service replicas behind a load balancer.
- Rate limiting is in-memory (`express-rate-limit`) - swap to a Redis store before running multiple Node instances.
