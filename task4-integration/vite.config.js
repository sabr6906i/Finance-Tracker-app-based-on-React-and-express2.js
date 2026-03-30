// vite.config.js
//
// The proxy setting means any request to /auth/* or /transactions/*
// from the React dev server gets forwarded to your Express API on port 3000.
//
// This avoids CORS issues during local development.
// When deployed, you'll set the full API URL in api.js instead.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /auth/* → http://localhost:3000/auth/*
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Forward /transactions/* → http://localhost:3000/transactions/*
      '/transactions': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
