import pg from 'pg'

const { Pool } = pg

let pool = null

function getPool() {
  if (!pool) {
    pool = new Pool(
      process.env.DATABASE_URL
        ? { connectionString: process.env.DATABASE_URL }
        : {
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || 'postgres',
            password: String(process.env.DB_PASSWORD || ''),
            database: process.env.DB_NAME || 'fintrack',
          }
    )
  }
  return pool
}

export async function initDB() {
  const db = getPool()

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      username  TEXT   NOT NULL UNIQUE,
      password  TEXT   NOT NULL,
      createdAt TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id        SERIAL PRIMARY KEY,
      user_id   INTEGER NOT NULL,
      amount    REAL    NOT NULL,
      type      TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      category  TEXT    NOT NULL,
      note      TEXT    DEFAULT '',
      timestamp TEXT    NOT NULL,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS assistant_messages (
      id        SERIAL PRIMARY KEY,
      user_id   INTEGER NOT NULL,
      role      TEXT    NOT NULL,
      content   TEXT    NOT NULL,
      metadata  TEXT    DEFAULT '{}',
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS payment_patterns (
      id        SERIAL PRIMARY KEY,
      user_id   INTEGER NOT NULL,
      label     TEXT    NOT NULL,
      keywords  TEXT    NOT NULL,
      category  TEXT    NOT NULL,
      type      TEXT    NOT NULL CHECK(type IN ('income', 'expense')),
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  console.log('Database initialized')
}

// Proxy object so existing `import db from '../db.js'` + `db.query(...)` still works
export default {
  query: (...args) => getPool().query(...args),
}
