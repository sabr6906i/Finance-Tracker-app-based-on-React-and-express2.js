[README (3).md](https://github.com/user-attachments/files/26350131/README.3.md)
# 💰 FinTrack — Personal Finance Tracker

A full-stack personal finance tracker built as part of the ITC Web Convener Assignment (Tasks 2, 3 & 4).

---

## 📁 Project Structure

```
├── task2-finance-ui/      # React frontend (localStorage version)
├── task3-api/             # Node.js + Express + SQLite REST API
└── task4-integration/     # React frontend integrated with Task 3 API
```

---

## ✨ Features

- Add, delete income and expense transactions
- Summary cards showing total income, expenses, and balance
- Filter transactions by type and category
- Search transactions by description
- Category-wise spending pie chart
- Income vs expense bar chart
- JWT-based authentication (register & login)
- Data persisted in SQLite database (Task 3 & 4)

---

## 🛠️ Tech Stack

### Frontend (Task 2 & 4)
- React 19 + Vite
- Recharts (for pie and bar charts)
- CSS custom properties (dark theme)

### Backend (Task 3)
- Node.js + Express 5
- SQLite via `better-sqlite3`
- JWT authentication via `jsonwebtoken`
- Password hashing via `bcryptjs`

---

## 🚀 Getting Started

### Task 3 — Run the API

```bash
cd task3-api
npm install
npm run dev
```

API will start at `http://localhost:3000`

**Endpoints:**
```
GET    /                        # Health check
POST   /auth/register           # Register a new user
POST   /auth/login              # Login and get JWT token
GET    /transactions            # Get all transactions (requires JWT)
POST   /transactions            # Add a transaction (requires JWT)
DELETE /transactions/:id        # Delete a transaction (requires JWT)
```

### Task 2 — Run the Frontend (standalone)

```bash
cd task2-finance-ui
npm install
npm install recharts
npm run dev
```

Opens at `http://localhost:5173` — uses localStorage, no backend needed.

### Task 4 — Run the Integrated App

Make sure Task 3 API is running first, then:

```bash
cd task4-integration
npm install
npm install recharts
npm run dev
```

Opens at `http://localhost:5173` — login or register, then manage your finances via the API.

---

## 🔐 Authentication Flow

1. User registers via `POST /auth/register` with username and password (min 6 chars)
2. API returns a JWT token valid for 7 days
3. Token is stored in `localStorage`
4. Every subsequent request to `/transactions` sends the token as `Authorization: Bearer <token>`
5. Logout clears the token and returns to the login screen

---

## 🗃️ Database Schema

```sql
-- Users table
CREATE TABLE users (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  username  TEXT    NOT NULL UNIQUE,
  password  TEXT    NOT NULL,        -- bcrypt hashed
  createdAt TEXT    DEFAULT (datetime('now'))
);

-- Transactions table
CREATE TABLE transactions (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id   INTEGER NOT NULL,        -- foreign key to users
  amount    REAL    NOT NULL,
  type      TEXT    NOT NULL,        -- "income" or "expense"
  category  TEXT    NOT NULL,
  note      TEXT    DEFAULT '',
  timestamp TEXT    NOT NULL,
  createdAt TEXT    DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## 📦 Environment Variables

Create a `.env` file in `task3-api/`:

```env
PORT=3000
JWT_SECRET=your_secret_key_here
```

---

## 🌐 Deployment

| Service | What to deploy |
|---|---|
| Vercel | `task4-integration` (React frontend) |
| Render | `task3-api` (Express backend) |

After deploying the backend, update `API_BASE` in `task4-integration/src/api.js` to your Render URL.

---

## 📝 Notes

- The edit transaction feature is available in Task 2 (localStorage) but disabled in Task 4 since the Task 3 API does not have a `PUT /transactions/:id` route
- Task 4 uses a Vite proxy (`vite.config.js`) to forward `/auth` and `/transactions` requests to `localhost:3000` during development, avoiding CORS issues

---

## 👤 Author

**Sarbjeet Singh Pal**  
Economics, IIT Bombay  
ITC Web Convener Application — 2026
