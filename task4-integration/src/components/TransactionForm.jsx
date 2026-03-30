// TransactionForm.jsx — Form to add a new transaction or edit an existing one

import { useState, useEffect } from "react";
import { CATEGORY_ICON_MAP, PlusIcon, EditIcon, ArrowUpIcon, ArrowDownIcon, AlertIcon } from "./Icons";

const CATEGORIES = [
  "Salary", "Freelance", "Food", "Transport", "Education",
  "Entertainment", "Utilities", "Healthcare", "Shopping", "Other",
];

const EMPTY_FORM = {
  description: "",
  amount: "",
  type: "expense",
  category: "Food",
  date: new Date().toISOString().split("T")[0],
};

export default function TransactionForm({ onAdd, onUpdate, editingTx, onCancelEdit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editingTx) {
      setForm({
        description: editingTx.description,
        amount:      String(editingTx.amount),
        type:        editingTx.type,
        category:    editingTx.category,
        date:        editingTx.date,
      });
      setError("");
    } else {
      setForm(EMPTY_FORM);
    }
  }, [editingTx]);

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.description.trim()) { setError("Please enter a description."); return; }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) {
      setError("Please enter a valid positive amount."); return;
    }

    const txData = {
      description: form.description.trim(),
      amount:      parseFloat(form.amount),
      type:        form.type,
      category:    form.category,
      date:        form.date || new Date().toISOString().split("T")[0],
    };

    if (editingTx) {
      onUpdate({ ...txData, id: editingTx.id });
    } else {
      onAdd(txData);
    }

    setForm(EMPTY_FORM);
    setError("");
  }

  const isEditing = !!editingTx;

  return (
    <div className="card">
      <div className="card-title">
        {isEditing ? <><EditIcon /> Edit Transaction</> : <><PlusIcon /> Add Transaction</>}
      </div>

      <div className="type-toggle">
        <button
          type="button"
          className={`type-btn income ${form.type === "income" ? "active" : ""}`}
          onClick={() => setForm(prev => ({ ...prev, type: "income" }))}
        >
          <ArrowUpIcon /> Income
        </button>
        <button
          type="button"
          className={`type-btn expense ${form.type === "expense" ? "active" : ""}`}
          onClick={() => setForm(prev => ({ ...prev, type: "expense" }))}
        >
          <ArrowDownIcon /> Expense
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="e.g. Mess bill, Internship stipend..."
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="amount">Amount (&#8377;)</label>
          <input
            id="amount"
            name="amount"
            type="number"
            placeholder="0"
            min="0"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="date">Date</label>
          <input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
          />
        </div>

        {error && (
          <p style={{ color: "var(--expense-color)", fontSize: "0.82rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            <AlertIcon /> {error}
          </p>
        )}

        <button
          type="submit"
          className={`btn-submit ${isEditing ? "editing" : ""}`}
        >
          {isEditing ? "Update Transaction" : "Add Transaction"}
        </button>

        {isEditing && (
          <button type="button" className="btn-cancel" onClick={onCancelEdit}>
            Cancel Edit
          </button>
        )}
      </form>
    </div>
  );
}
