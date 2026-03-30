// src/db.js — SQLite database setup
// Creates the database file and initializes tables on first run

import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

// __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Database file will be created at task3-api/finance.db
const db = new Database(path.join(__dirname, '../finance.db'))

export function initDB() {
  // Enable WAL mode — faster reads/writes for SQLite
  db.pragma('journal_mode = WAL')

  // ---------- USERS TABLE ----------
  // Stores registered users (id, username, hashed password)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      username  TEXT    NOT NULL UNIQUE,
      password  TEXT    NOT NULL,
      createdAt TEXT    DEFAULT (datetime('now'))
    )
  `)

  // ---------- TRANSACTIONS TABLE ----------
  // Each transaction belongs to a user via user_id (foreign key)
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   INTEGER NOT NULL,
      amount    REAL    NOT NULL,
      type      TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      category  TEXT    NOT NULL,
      note      TEXT    DEFAULT '',
      timestamp TEXT    NOT NULL,
      createdAt TEXT    DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  console.log('Database initialized ✅')
}

// Export db instance so routes can use it
export default db
