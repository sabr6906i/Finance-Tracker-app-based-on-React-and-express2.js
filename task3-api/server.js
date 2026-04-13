import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { initDB } from './src/db.js'
import authRoutes from './src/routes/auth.js'
import transactionRoutes from './src/routes/transactions.js'
import assistantRoutes from './src/routes/assistant.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/auth', authRoutes)
app.use('/transactions', transactionRoutes)
app.use('/assistant', assistantRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Finance Tracker API is running' })
})

async function start() {
  await initDB()
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
}

start()
