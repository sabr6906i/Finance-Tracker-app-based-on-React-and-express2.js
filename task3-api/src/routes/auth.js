// src/routes/auth.js — Authentication Routes
// Handles user registration and login
// POST /auth/register — create a new account
// POST /auth/login    — login and get a JWT token

import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

// ---------- REGISTER ----------
// POST /auth/register
// Body: { username, password }
router.post('/register', (req, res) => {
  const { username, password } = req.body

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    // Hash the password — never store plain text passwords
    // 10 = salt rounds (higher = more secure but slower)
    const hashedPassword = bcrypt.hashSync(password, 10)

    // Insert new user into database
    const stmt = db.prepare(`
      INSERT INTO users (username, password) VALUES (?, ?)
    `)
    const result = stmt.run(username, hashedPassword)

    // Generate JWT token so user is logged in immediately after registering
    const token = jwt.sign(
      { id: result.lastInsertRowid, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // Token valid for 7 days
    )

    res.status(201).json({
      message: 'Account created successfully ✅',
      token,
      user: { id: result.lastInsertRowid, username }
    })

  } catch (err) {
    // UNIQUE constraint on username will trigger this
    if (err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already taken.' })
    }
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// ---------- LOGIN ----------
// POST /auth/login
// Body: { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  try {
    // Find user in database
    const user = db.prepare(`
      SELECT * FROM users WHERE username = ?
    `).get(username)

    // User not found
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    // Compare entered password with hashed password in DB
    const passwordMatch = bcrypt.compareSync(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    // Password correct — generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful ✅',
      token,
      user: { id: user.id, username: user.username }
    })

  } catch (err) {
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

export default router
