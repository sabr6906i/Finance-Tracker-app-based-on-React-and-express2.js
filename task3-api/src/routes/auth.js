import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    const hashedPassword = bcrypt.hashSync(password, 10)

    const result = await db.query(
      `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id`,
      [username, hashedPassword]
    )

    const newUserId = result.rows[0].id

    const token = jwt.sign(
      { id: newUserId, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: newUserId, username }
    })

  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username already taken.' })
    }
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' })
  }

  try {
    const result = await db.query(
      `SELECT * FROM users WHERE username = $1`,
      [username]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const passwordMatch = bcrypt.compareSync(password, user.password)

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username }
    })

  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error. Please try again.' })
  }
})

export default router
