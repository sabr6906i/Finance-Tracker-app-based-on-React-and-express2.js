# FinTrack - Personal Finance Tracker

## Project Structure

- **task3-api/** — Express 5 REST API with SQLite (better-sqlite3) and JWT auth
- **task4-integration/** — React 19 + Vite frontend with Recharts

Both packages use ES modules (`"type": "module"`).

## Development

```bash
# Backend (runs on port 3000 by default)
cd task3-api && npm run dev

# Frontend (Vite dev server with proxy to API)
cd task4-integration && npm run dev
```

## Key Commands

| Task | Command |
|------|---------|
| Start API | `cd task3-api && npm run dev` |
| Start frontend | `cd task4-integration && npm run dev` |
| Build frontend | `cd task4-integration && npm run build` |
| Lint frontend | `cd task4-integration && npm run lint` |

## Tech Stack

- **Backend:** Node.js, Express 5, better-sqlite3, JWT (jsonwebtoken), bcryptjs
- **Frontend:** React 19, Vite 8, Recharts
- **Database:** SQLite (`task3-api/finance.db`)

## Conventions

- ES module syntax (`import`/`export`) throughout
- Frontend proxies API requests via Vite config
- JWT-based authentication (register/login endpoints)
