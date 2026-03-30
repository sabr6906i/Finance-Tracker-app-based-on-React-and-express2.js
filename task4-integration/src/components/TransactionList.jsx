// TransactionList.jsx — Displays all transactions with filter and search

import { useState, useMemo } from "react";
import { CATEGORY_ICON_MAP, CoinIcon, ListIcon, SearchIcon, EditIcon, TrashIcon } from "./Icons";

export default function TransactionList({ transactions, onEdit, onDelete }) {
  const [filterType,     setFilterType]     = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery,    setSearchQuery]    = useState("");

  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(tx => tx.category))];
    return cats.sort();
  }, [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      const matchType     = filterType === "all"     || tx.type === filterType;
      const matchCategory = filterCategory === "all" || tx.category === filterCategory;
      const matchSearch   = tx.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchType && matchCategory && matchSearch;
    });
  }, [transactions, filterType, filterCategory, searchQuery]);

  const fmtAmount = (tx) => {
    const sign = tx.type === "income" ? "+" : "\u2212";
    return `${sign}\u20B9${tx.amount.toLocaleString("en-IN")}`;
  };

  const fmtDate = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="card">
      <div className="card-title"><ListIcon /> Transactions</div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="filter-select"
          style={{ minWidth: "130px" }}
        />
        <select
          className="filter-select"
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          className="filter-select"
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <span className="filter-count">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><SearchIcon /></div>
          <p>{transactions.length === 0 ? "No transactions yet. Add one above!" : "No transactions match your filters."}</p>
        </div>
      ) : (
        <div className="tx-list">
          {filtered.map(tx => {
            const CategoryIcon = CATEGORY_ICON_MAP[tx.category] || CoinIcon;
            return (
              <div
                key={tx.id}
                className={`tx-item ${tx.type === "income" ? "income-item" : "expense-item"}`}
              >
                <div className="tx-icon">
                  <CategoryIcon />
                </div>
                <div className="tx-info">
                  <div className="tx-desc">{tx.description}</div>
                  <div className="tx-meta">
                    <span>{fmtDate(tx.date)}</span>
                    <span className="tx-category-tag">{tx.category}</span>
                  </div>
                </div>
                <div className="tx-amount">{fmtAmount(tx)}</div>
                <div className="tx-actions">
                  <button
                    className="tx-action-btn edit"
                    title="Edit"
                    onClick={() => onEdit(tx)}
                  >
                    <EditIcon />
                  </button>
                  <button
                    className="tx-action-btn delete"
                    title="Delete"
                    onClick={() => {
                      if (window.confirm(`Delete "${tx.description}"?`)) onDelete(tx.id);
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
