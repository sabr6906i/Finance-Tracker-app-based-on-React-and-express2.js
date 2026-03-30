// src/middleware/auth.js — JWT Authentication Middleware
// Protects routes by verifying the token sent in request headers
// Any route that uses this middleware will require a valid JWT token

import jwt from 'jsonwebtoken'

export function authenticateToken(req, res, next) {
  // Token is sent in the Authorization header as: "Bearer <token>"
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  // No token provided
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' })
  }

  // Verify the token using our JWT secret from .env
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' })
    }

    // Token is valid — attach user data to request object
    // Now any route can access req.user.id to know who is logged in
    req.user = user
    next()
  })
}