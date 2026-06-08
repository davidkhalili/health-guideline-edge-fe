# HealthGuidelineEdge Frontend

This directory contains the production-oriented Next.js frontend for HealthGuidelineEdge.

## Runtime contract

The app expects the Python API to be available at:

- `NEXT_PUBLIC_RAG_API_BASE_URL` (default: `http://health.twift.finance:8000`)
- Optional Google sign-in button: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

Required backend routes:

- `GET /api/status`
- `GET /api/auth/config`
- `GET /api/auth/me`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `GET /api/llm/options`
- `GET /api/sources`
- `GET /api/sources/{source_id}/build-status`
- `POST /api/sources/upload`
- `DELETE /api/sources/{source_id}` (admin only)
- `POST /api/chat`
- `POST /api/chat/stream`
- `GET /api/chat/sessions`
- `GET /api/chat/sessions/{session_id}`
- `POST /api/citations/highlight`

Delete source behavior:

- Deletion is admin-only.
- Backend removes source registry entry and generated artifacts (`faiss.index`, `chunks.json`, `config.json`, `_intermediate`).
- Managed source files are removed when safe (uploads/documents and not shared by another source).
- If active sessions are using the deleted source, backend automatically migrates those sessions to the current default source.
- Deletion returns conflict if source build/rebuild is in progress.

## Local development

```bash
npm install
npm run dev
```

Then open [http://health.twift.finance:3000](http://health.twift.finance:3000).

## Production build

```bash
npm run build
npm run start
```

## Docker

Use the root `docker-compose.yml` to run frontend + API + Streamlit + Ollama together.
