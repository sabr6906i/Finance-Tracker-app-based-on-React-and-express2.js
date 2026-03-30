// Summary.jsx — Three summary cards: Total Income, Total Expenses, Balance
//
// Props:
//   transactions: array of all transaction objects
//
// Logic:
//   - Sums up all income transactions
//   - Sums up all expense transactions
//   - Balance = income - expenses (can be negative)
//
// No state needed here — purely derived from props.

export default function Summary({ transactions }) {
  // Derive totals from the transactions array
  const totalIncome = transactions
    .filter(tx => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalExpenses = transactions
    .filter(tx => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const balance = totalIncome - totalExpenses;

  // Count transactions of each type
  const incomeCount  = transactions.filter(tx => tx.type === "income").length;
  const expenseCount = transactions.filter(tx => tx.type === "expense").length;

  // Format a number as Indian Rupees (₹)
  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(n));

  return (
    <div className="summary-grid">

      {/* Total Income */}
      <div className="summary-card income">
        <div className="summary-label">Total Income</div>
        <div className="summary-amount">+{fmt(totalIncome)}</div>
        <div className="summary-count">{incomeCount} transaction{incomeCount !== 1 ? "s" : ""}</div>
      </div>

      {/* Total Expenses */}
      <div className="summary-card expense">
        <div className="summary-label">Total Expenses</div>
        <div className="summary-amount">−{fmt(totalExpenses)}</div>
        <div className="summary-count">{expenseCount} transaction{expenseCount !== 1 ? "s" : ""}</div>
      </div>

      {/* Balance */}
      <div className="summary-card balance">
        <div className="summary-label">Balance</div>
        <div className="summary-amount">
          {balance < 0 ? "−" : "+"}{fmt(balance)}
        </div>
        <div className="summary-count">{transactions.length} total transactions</div>
      </div>

    </div>
  );
}
