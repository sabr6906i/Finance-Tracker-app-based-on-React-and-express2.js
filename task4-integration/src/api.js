// api.js — Centralized API client

const API_BASE = import.meta.env.VITE_API_BASE !== undefined
  ? import.meta.env.VITE_API_BASE
  : "https://finance-tracker-app-based-on-react-and.onrender.com";

// ── Token helpers ─────────────────────────────────────────────
export const getToken    = ()      => localStorage.getItem("finance_token");
export const setToken    = (token) => localStorage.setItem("finance_token", token);
export const removeToken = ()      => localStorage.removeItem("finance_token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── Generic fetch wrapper ─────────────────────────────────────
async function request(path, options = {}) {
  const res  = await fetch(`${API_BASE}${path}`, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed: ${res.status}`);
  }
  return data;
}

// ══════════════════════════════════════════════════════════════
// AUTH
// ══════════════════════════════════════════════════════════════

export async function register(username, password) {
  return request("/auth/register", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ username, password }),
  });
}

export async function login(username, password) {
  return request("/auth/login", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ username, password }),
  });
}

// ══════════════════════════════════════════════════════════════
// TRANSACTIONS
// ══════════════════════════════════════════════════════════════

// GET /transactions → returns { count, transactions: [...] }
export async function getTransactions() {
  const data = await request("/transactions", {
    method:  "GET",
    headers: authHeaders(),
  });
  const list = Array.isArray(data) ? data : (data.transactions || []);
  // Normalize API fields ("note"→"description", "timestamp"→"date")
  // so frontend components can use consistent field names
  return list.map(tx => ({
    ...tx,
    description: tx.description || tx.note || "",
    date:        tx.date        || (tx.timestamp ? tx.timestamp.split("T")[0] : ""),
  }));
}

// POST /transactions
// Maps form fields to what your API actually expects
export async function createTransaction(tx) {
  const payload = {
    amount:    tx.amount,
    type:      tx.type,
    category:  tx.category,
    timestamp: tx.date,                          // "date" → "timestamp"
    note:      tx.description || tx.note || "",  // "description" → "note"
  };
  return request("/transactions", {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
}

// DELETE /transactions/:id
export async function deleteTransaction(id) {
  return request(`/transactions/${id}`, {
    method:  "DELETE",
    headers: authHeaders(),
  });
}

// Update transaction — tries PUT first, falls back to delete + recreate
export async function updateTransaction(id, tx) {
  const payload = {
    amount:    tx.amount,
    type:      tx.type,
    category:  tx.category,
    timestamp: tx.date,
    note:      tx.description || tx.note || "",
  };
  try {
    return await request(`/transactions/${id}`, {
      method:  "PUT",
      headers: authHeaders(),
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    if (err.message.includes("404") || err.message.includes("Not Found")) {
      await deleteTransaction(id);
      return createTransaction(tx);
    }
    throw err;
  }
}

// ══════════════════════════════════════════════════════════════
// ASSISTANT / AI
// ══════════════════════════════════════════════════════════════

// GET /assistant/messages
export async function getMessages() {
  return request("/assistant/messages", {
    method:  "GET",
    headers: authHeaders(),
  });
}

// POST /assistant/chat
export async function sendChat(message) {
  return request("/assistant/chat", {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ message }),
  });
}

// POST /assistant/analyze-image
export async function analyzeImage(base64, mimeType) {
  return request("/assistant/analyze-image", {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ base64, mimeType }),
  });
}

// POST /assistant/analyze-csv
export async function analyzeCSV(csvText) {
  return request("/assistant/analyze-csv", {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ csvText }),
  });
}

// POST /assistant/confirm-transactions
export async function confirmTransactions(transactions) {
  return request("/assistant/confirm-transactions", {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ transactions }),
  });
}

// GET /assistant/patterns
export async function getPatterns() {
  return request("/assistant/patterns", {
    method:  "GET",
    headers: authHeaders(),
  });
}

// POST /assistant/patterns
export async function savePattern(label, keywords, category, type) {
  return request("/assistant/patterns", {
    method:  "POST",
    headers: authHeaders(),
    body:    JSON.stringify({ label, keywords, category, type }),
  });
}

// DELETE /assistant/patterns/:id
export async function deletePattern(id) {
  return request(`/assistant/patterns/${id}`, {
    method:  "DELETE",
    headers: authHeaders(),
  });
}
