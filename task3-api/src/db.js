import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id        SERIAL PRIMARY KEY,
      username  TEXT   NOT NULL UNIQUE,
      password  TEXT   NOT NULL,
      createdAt TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  await pool.query(`
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

  console.log('Database initialized')
}

export default pool
