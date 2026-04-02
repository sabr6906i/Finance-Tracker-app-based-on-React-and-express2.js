// api.js — Centralized API client

const API_BASE = import.meta.env.VITE_API_BASE || "";

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

// PUT /transactions/:id
export async function updateTransaction(id, tx) {
  const payload = {
    amount:    tx.amount,
    type:      tx.type,
    category:  tx.category,
    timestamp: tx.date,
    note:      tx.description || tx.note || "",
  };
  return request(`/transactions/${id}`, {
    method:  "PUT",
    headers: authHeaders(),
    body:    JSON.stringify(payload),
  });
}
