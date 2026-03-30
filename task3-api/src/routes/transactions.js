// src/routes/transactions.js — Transaction Routes
// All routes here are protected — require valid JWT token
// GET    /transactions       — fetch all transactions for logged-in user
// POST   /transactions       — add a new transaction
// DELETE /transactions/:id   — delete a transaction by ID

import express from 'express'
import db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Apply auth middleware to ALL routes in this file
// Every request to /transactions must have a valid token
router.use(authenticateToken)

// ---------- GET ALL TRANSACTIONS ----------
// GET /transactions
// Returns all transactions belonging to the logged-in user
router.get('/', (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions
      WHERE user_id = ?
      ORDER BY timestamp DESC
    `).all(req.user.id)

    res.json({
      count: transactions.length,
      transactions
    })

  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.' })
  }
})

// ---------- CREATE TRANSACTION ----------
// POST /transactions
// Body: { amount, type, category, timestamp, note? }
router.post('/', (req, res) => {
  const { amount, type, category, timestamp, note } = req.body

  // Validate required fields
  if (!amount || !type || !category || !timestamp) {
    return res.status(400).json({
      error: 'amount, type, category and timestamp are required.'
    })
  }

  // Validate type value
  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({
      error: 'type must be either "income" or "expense".'
    })
  }

  // Validate amount is a positive number
  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({
      error: 'amount must be a positive number.'
    })
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (user_id, amount, type, category, timestamp, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `)

    const result = stmt.run(
      req.user.id,        // from JWT token — ties transaction to logged-in user
      Number(amount),
      type,
      category,
      timestamp,
      note || ''          // note is optional
    )

    // Fetch and return the newly created transaction
    const newTransaction = db.prepare(`
      SELECT * FROM transactions WHERE id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json({
      message: 'Transaction added ✅',
      transaction: newTransaction
    })

  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction.' })
  }
})

// ---------- DELETE TRANSACTION ----------
// DELETE /transactions/:id
router.delete('/:id', (req, res) => {
  const { id } = req.params

  try {
    // First check if transaction exists AND belongs to this user
    // Prevents one user from deleting another user's transactions
    const transaction = db.prepare(`
      SELECT * FROM transactions WHERE id = ? AND user_id = ?
    `).get(id, req.user.id)

    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found or does not belong to you.'
      })
    }

    // Safe to delete
    db.prepare(`DELETE FROM transactions WHERE id = ?`).run(id)

    res.json({ message: 'Transaction deleted ✅', id: Number(id) })

  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction.' })
  }
})

export default router
