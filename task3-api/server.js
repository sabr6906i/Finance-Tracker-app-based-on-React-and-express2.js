import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDB } from './src/db.js'
import authRoutes from './src/routes/auth.js'
import transactionRoutes from './src/routes/transactions.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// ---------- MIDDLEWARE ----------
app.use(cors())
app.use(express.json())           // Parse JSON bodies
app.use(express.urlencoded({ extended: true }))  // Parse URL-encoded bodies

// ---------- ROUTES ----------
app.use('/auth', authRoutes)
app.use('/transactions', transactionRoutes)

// ---------- HEALTH CHECK ----------
app.get('/', (req, res) => {
  res.json({ message: 'Finance Tracker API is running ✅' })
})

// ---------- START ----------
initDB()
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
