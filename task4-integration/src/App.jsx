// App.jsx — Root component (Task 4: Integrated version)
//
// Key differences from Task 2 (localStorage-only):
//   - Auth state: checks for existing JWT on mount
//   - All CRUD operations go through the Task 3 API (api.js)
//   - Loading + error states for every API call
//   - Logout clears the token and returns to AuthPage
//
// Data flow:
//   App (holds auth + transactions state)
//     ├── AuthPage      (shown when not logged in)
//     ├── Summary       (reads transactions)
//     ├── TransactionForm (calls handleAdd / handleUpdate)
//     ├── TransactionList (calls handleEdit / handleDelete)
//     └── Charts        (reads transactions)

import { useState, useEffect, useCallback } from "react";
import * as api from "./api";
import { WalletIcon, AlertIcon } from "./components/Icons";
import AuthPage      from "./components/AuthPage";
import Summary       from "./components/Summary";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import Charts        from "./components/Charts";

export default function App() {
  // ── Auth state ────────────────────────────────────────────
  // token: null = not logged in, string = logged in
  const [token,    setToken]    = useState(() => api.getToken()); // rehydrate from localStorage
  const [username, setUsername] = useState(() => localStorage.getItem("finance_user") || "");

  // ── Data state ────────────────────────────────────────────
  const [transactions, setTransactions] = useState([]);
  const [loadingTx,    setLoadingTx]    = useState(false);
  const [txError,      setTxError]      = useState("");

  // Which transaction is being edited (null = add mode)
  const [editingTx, setEditingTx] = useState(null);

  // ── Fetch transactions from API ───────────────────────────
  // useCallback so we can call it both on mount and after mutations
  const fetchTransactions = useCallback(async () => {
    if (!token) return;
    setLoadingTx(true);
    setTxError("");
    try {
      const data = await api.getTransactions();
      setTransactions(data);
    } catch (err) {
      setTxError(err.message || "Failed to load transactions.");
    } finally {
      setLoadingTx(false);
    }
  }, [token]);

  // Load transactions whenever we have a valid token
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // ── Auth handlers ─────────────────────────────────────────
  function handleAuthSuccess(newToken, newUsername) {
    setToken(newToken);
    setUsername(newUsername);
    localStorage.setItem("finance_user", newUsername);
  }

  function handleLogout() {
    api.removeToken();
    localStorage.removeItem("finance_user");
    setToken(null);
    setUsername("");
    setTransactions([]);
    setEditingTx(null);
  }

  // ── CRUD handlers (all call the API) ─────────────────────

  async function handleAdd(txData) {
    setTxError("");
    try {
      await api.createTransaction(txData);
      // Re-fetch so the list is always in sync with the DB
      await fetchTransactions();
    } catch (err) {
      setTxError(err.message || "Failed to add transaction.");
    }
  }

  async function handleUpdate(txData) {
    setTxError("");
    try {
      await api.updateTransaction(txData.id, txData);
      setEditingTx(null);
      await fetchTransactions();
    } catch (err) {
      setTxError(err.message || "Failed to update transaction.");
    }
  }

  async function handleDelete(id) {
    setTxError("");
    try {
      await api.deleteTransaction(id);
      if (editingTx?.id === id) setEditingTx(null);
      await fetchTransactions();
    } catch (err) {
      setTxError(err.message || "Failed to delete transaction.");
    }
  }

  // ── Render: Auth wall ─────────────────────────────────────
  if (!token) {
    return (
      <div className="app">
        <header className="header">
          <span className="header-logo"><WalletIcon /> FinTrack</span>
        </header>
        <AuthPage onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  // ── Render: Main dashboard ────────────────────────────────
  return (
    <div className="app">
      {/* Header with logged-in user + logout */}
      <header className="header">
        <span className="header-logo"><WalletIcon /> FinTrack</span>
        <div className="header-right">
          <span className="header-user">Signed in as <span>{username}</span></span>
          <button className="btn-logout" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <main className="main">

        {/* API error banner — shown above everything when an operation fails */}
        {txError && (
          <div className="summary-row">
            <div className="api-error"><AlertIcon /> {txError}</div>
          </div>
        )}

        {/* Summary cards */}
        <div className="summary-row">
          <Summary transactions={transactions} />
        </div>

        {/* Left col: form */}
        <div className="form-col">
          <TransactionForm
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            editingTx={editingTx}
            onCancelEdit={() => setEditingTx(null)}
          />
        </div>

        {/* Right col: list + charts */}
        <div className="right-col">
          {loadingTx ? (
            <div className="card api-loading">
              <div className="loading-spinner" />
              Loading transactions from API…
            </div>
          ) : (
            <TransactionList
              transactions={transactions}
              onEdit={null}
              onDelete={handleDelete}
            />
          )}
          <Charts transactions={transactions} />
        </div>

      </main>
    </div>
  );
}
