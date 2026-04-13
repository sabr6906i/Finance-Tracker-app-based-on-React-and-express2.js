import express from 'express'
import db from '../db.js'
import { authenticateToken } from '../middleware/auth.js'
import {
  analyzeReceiptImage,
  analyzeCSV,
  chatWithContext,
  detectSpendingWarnings,
  extractJSON,
} from '../services/llm.js'

const router = express.Router()

// Apply auth to all routes
router.use(authenticateToken)

// Get chat message history
router.get('/messages', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, role, content, metadata, createdat FROM assistant_messages
       WHERE user_id = $1
       ORDER BY createdat DESC LIMIT 50`,
      [req.user.id]
    )

    // Reverse to get chronological order
    const messages = result.rows.reverse()
    res.json({ messages })
  } catch (err) {
    console.error('Error fetching messages:', err)
    res.status(500).json({ error: 'Failed to fetch message history.' })
  }
})

// Send a text message to the assistant
router.post('/chat', async (req, res) => {
  const { message } = req.body

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required.' })
  }

  try {
    // Save user message
    await db.query(
      `INSERT INTO assistant_messages (user_id, role, content, metadata, createdat)
       VALUES ($1, $2, $3, $4, NOW())`,
      [req.user.id, 'user', message, '{}']
    )

    // Get user's transactions for context
    const txResult = await db.query(
      `SELECT id, amount, type, category, note, timestamp
       FROM transactions WHERE user_id = $1
       ORDER BY timestamp DESC LIMIT 30`,
      [req.user.id]
    )
    const recentTransactions = txResult.rows

    // Get user's learned patterns
    const patternsResult = await db.query(
      `SELECT label, keywords, category, type FROM payment_patterns WHERE user_id = $1`,
      [req.user.id]
    )
    const patterns = patternsResult.rows

    // Calculate transaction summary
    const expenseSum = recentTransactions
      .filter((tx) => tx.type === 'expense')
      .reduce((sum, tx) => sum + tx.amount, 0)
    const incomeSum = recentTransactions
      .filter((tx) => tx.type === 'income')
      .reduce((sum, tx) => sum + tx.amount, 0)

    const transactionSummary = `
- Total Expenses (last 30 tx): ₹${expenseSum.toFixed(2)}
- Total Income (last 30 tx): ₹${incomeSum.toFixed(2)}
- Net: ₹${(incomeSum - expenseSum).toFixed(2)}
- Transaction Count: ${recentTransactions.length}
`

    // Get assistant response with context
    const { reply, warnings } = await chatWithContext(
      message,
      transactionSummary,
      patterns,
      recentTransactions
    )

    // Check if the LLM wants to add a transaction
    const parsed = extractJSON(reply)
    if (parsed && parsed.action === 'add_transaction' && parsed.transactions?.length > 0) {
      const displayMsg = parsed.message || `Adding ${parsed.transactions.length} transaction(s).`
      const metadata = JSON.stringify({
        warnings: warnings || [],
        action: 'add_transaction',
        transactions: parsed.transactions,
      })
      const msgResult = await db.query(
        `INSERT INTO assistant_messages (user_id, role, content, metadata, createdat)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING id, role, content, metadata, createdat`,
        [req.user.id, 'assistant', displayMsg, metadata]
      )

      return res.json({
        message: msgResult.rows[0],
        warnings: warnings || [],
        pendingTransactions: parsed.transactions,
      })
    }

    // Save assistant response (normal text reply)
    const metadata = JSON.stringify({ warnings: warnings || [] })
    const msgResult = await db.query(
      `INSERT INTO assistant_messages (user_id, role, content, metadata, createdat)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING id, role, content, metadata, createdat`,
      [req.user.id, 'assistant', reply, metadata]
    )

    res.json({
      message: msgResult.rows[0],
      warnings: warnings || [],
    })
  } catch (err) {
    console.error('Error in chat:', err)
    res.status(500).json({ error: `Failed to process message: ${err.message}` })
  }
})

// Analyze receipt image
router.post('/analyze-image', async (req, res) => {
  const { base64, mimeType } = req.body

  if (!base64 || !mimeType) {
    return res.status(400).json({ error: 'base64 and mimeType are required.' })
  }

  try {
    // Get user's learned patterns
    const patternsResult = await db.query(
      `SELECT label, keywords, category, type FROM payment_patterns WHERE user_id = $1`,
      [req.user.id]
    )
    const patterns = patternsResult.rows

    // Analyze image with Groq
    const analysis = await analyzeReceiptImage(base64, mimeType, patterns)

    // Save message with extracted transactions in metadata
    const metadata = JSON.stringify({
      transactions: analysis.transactions,
      confidence: analysis.confidence,
      warnings: analysis.warnings,
    })
    await db.query(
      `INSERT INTO assistant_messages (user_id, role, content, metadata, createdat)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        req.user.id,
        'assistant',
        `Analyzed receipt. Found ${analysis.transactions.length} transaction(s).`,
        metadata,
      ]
    )

    res.json(analysis)
  } catch (err) {
    console.error('Error analyzing image:', err)
    res.status(500).json({ error: 'Failed to analyze image: ' + err.message })
  }
})

// Analyze CSV (bank statement)
router.post('/analyze-csv', async (req, res) => {
  const { csvText } = req.body

  if (!csvText || !csvText.trim()) {
    return res.status(400).json({ error: 'csvText is required.' })
  }

  try {
    // Get user's learned patterns
    const patternsResult = await db.query(
      `SELECT label, keywords, category, type FROM payment_patterns WHERE user_id = $1`,
      [req.user.id]
    )
    const patterns = patternsResult.rows

    // Get existing transactions for duplicate detection
    const existingTxResult = await db.query(
      `SELECT amount, timestamp, category FROM transactions WHERE user_id = $1`,
      [req.user.id]
    )
    const existingTx = existingTxResult.rows

    // Analyze CSV with Groq
    const analysis = await analyzeCSV(csvText, patterns)

    // Check for duplicates by amount + date (category ignored since LLM may categorize differently)
    const duplicates = []
    const unique = analysis.transactions.filter((tx) => {
      const isDuplicate = existingTx.some((existing) => {
        const existingDate = existing.timestamp instanceof Date
          ? existing.timestamp.toISOString().split('T')[0]
          : String(existing.timestamp).split('T')[0]
        const txDate = String(tx.timestamp).split('T')[0]
        return (
          Number(existing.amount) === Number(tx.amount) &&
          existingDate === txDate
        )
      })
      if (isDuplicate) {
        duplicates.push(tx)
      }
      return !isDuplicate
    })

    // Save message with extracted transactions
    const metadata = JSON.stringify({
      transactions: unique,
      duplicates: duplicates,
      warnings: analysis.warnings,
      metadata: analysis.metadata,
    })
    await db.query(
      `INSERT INTO assistant_messages (user_id, role, content, metadata, createdat)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        req.user.id,
        'assistant',
        `Analyzed CSV. Found ${unique.length} new transaction(s), ${duplicates.length} potential duplicate(s).`,
        metadata,
      ]
    )

    res.json({
      transactions: unique,
      duplicates: duplicates,
      warnings: analysis.warnings,
      metadata: analysis.metadata,
    })
  } catch (err) {
    console.error('Error analyzing CSV:', err)
    res.status(500).json({ error: 'Failed to analyze CSV: ' + err.message })
  }
})

// Confirm and insert transactions
router.post('/confirm-transactions', async (req, res) => {
  const { transactions } = req.body

  if (!Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'transactions array is required.' })
  }

  try {
    const inserted = []
    const errors = []

    for (const tx of transactions) {
      const { amount, type, category, timestamp, description } = tx

      // Validate
      if (!amount || !type || !category || !timestamp) {
        errors.push(`Missing required fields: ${JSON.stringify(tx)}`)
        continue
      }

      if (!['income', 'expense'].includes(type)) {
        errors.push(`Invalid type for ${description}: ${type}`)
        continue
      }

      if (isNaN(amount) || Number(amount) <= 0) {
        errors.push(`Invalid amount for ${description}: ${amount}`)
        continue
      }

      try {
        const result = await db.query(
          `INSERT INTO transactions (user_id, amount, type, category, timestamp, note)
           VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
          [req.user.id, Number(amount), type, category, timestamp, description || '']
        )
        inserted.push(result.rows[0])
      } catch (dbErr) {
        errors.push(`Failed to insert ${description}: ${dbErr.message}`)
      }
    }

    res.json({
      inserted: inserted,
      errors: errors,
      summary: `Successfully inserted ${inserted.length} of ${transactions.length} transactions.`,
    })
  } catch (err) {
    console.error('Error confirming transactions:', err)
    res.status(500).json({ error: 'Failed to confirm transactions.' })
  }
})

// Get user's learned payment patterns
router.get('/patterns', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, label, keywords, category, type, createdat
       FROM payment_patterns WHERE user_id = $1
       ORDER BY createdat DESC`,
      [req.user.id]
    )

    res.json({ patterns: result.rows })
  } catch (err) {
    console.error('Error fetching patterns:', err)
    res.status(500).json({ error: 'Failed to fetch patterns.' })
  }
})

// Save a new payment pattern
router.post('/patterns', async (req, res) => {
  const { label, keywords, category, type } = req.body

  if (!label || !keywords || !category || !type) {
    return res.status(400).json({ error: 'label, keywords, category, and type are required.' })
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'type must be "income" or "expense".' })
  }

  try {
    const result = await db.query(
      `INSERT INTO payment_patterns (user_id, label, keywords, category, type)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.id, label, keywords, category, type]
    )

    res.status(201).json({
      message: 'Pattern saved',
      pattern: result.rows[0],
    })
  } catch (err) {
    console.error('Error saving pattern:', err)
    res.status(500).json({ error: 'Failed to save pattern.' })
  }
})

// Delete a payment pattern
router.delete('/patterns/:id', async (req, res) => {
  const { id } = req.params

  try {
    const existing = await db.query(
      `SELECT * FROM payment_patterns WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    )

    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Pattern not found or does not belong to you.' })
    }

    await db.query(`DELETE FROM payment_patterns WHERE id = $1`, [id])

    res.json({ message: 'Pattern deleted', id: Number(id) })
  } catch (err) {
    console.error('Error deleting pattern:', err)
    res.status(500).json({ error: 'Failed to delete pattern.' })
  }
})

export default router
