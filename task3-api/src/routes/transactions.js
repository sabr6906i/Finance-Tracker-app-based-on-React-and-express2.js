import express from 'express'
import db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC`,
      [req.user.id]
    )

    res.json({
      count: result.rows.length,
      transactions: result.rows
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions.' })
  }
})

// Create transaction
router.post('/', async (req, res) => {
  const { amount, type, category, timestamp, note } = req.body

  if (!amount || !type || !category || !timestamp) {
    return res.status(400).json({ error: 'amount, type, category and timestamp are required.' })
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be either "income" or "expense".' })
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number.' })
  }

  try {
    const result = await db.query(
      `INSERT INTO transactions (user_id, amount, type, category, timestamp, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.user.id, Number(amount), type, category, timestamp, note || '']
    )

    res.status(201).json({
      message: 'Transaction added',
      transaction: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create transaction.' })
  }
})

// Update transaction
router.put('/:id', async (req, res) => {
  const { id } = req.params
  const { amount, type, category, timestamp, note } = req.body

  if (!amount || !type || !category || !timestamp) {
    return res.status(400).json({ error: 'amount, type, category and timestamp are required.' })
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be either "income" or "expense".' })
  }

  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount must be a positive number.' })
  }

  try {
    const existing = await db.query(
      `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or does not belong to you.' })
    }

    const result = await db.query(
      `UPDATE transactions SET amount = $1, type = $2, category = $3, timestamp = $4, note = $5
       WHERE id = $6 AND user_id = $7 RETURNING *`,
      [Number(amount), type, category, timestamp, note || '', id, req.user.id]
    )

    res.json({
      message: 'Transaction updated',
      transaction: result.rows[0]
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction.' })
  }
})

// Delete transaction
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const result = await db.query(
      `SELECT * FROM transactions WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found or does not belong to you.' })
    }

    await db.query(`DELETE FROM transactions WHERE id = $1`, [id])

    res.json({ message: 'Transaction deleted', id: Number(id) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete transaction.' })
  }
})

export default router
