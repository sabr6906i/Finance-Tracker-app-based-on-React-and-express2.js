// Charts.jsx — Bonus: visual breakdown of spending using Recharts
//
// Props:
//   transactions — full array of transaction objects
//
// Renders two charts:
//   1. PieChart  — expense breakdown by category (% of total spend)
//   2. BarChart  — income vs expenses per category (side-by-side bars)
//
// Recharts is a React wrapper around D3. We use:
//   ResponsiveContainer — makes charts fluid/responsive
//   PieChart + Pie + Cell — donut chart
//   BarChart + Bar — grouped bar chart
//   Tooltip, Legend — standard Recharts helpers

import { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { PieChartIcon, BarChartIcon } from "./Icons";

// Accent palette for chart slices — pulled from CSS vars manually
// (Recharts doesn't read CSS variables directly)
// Black + Orange spectrum palette
const PIE_COLORS = [
  "#FF541E", "#ac2d00", "#ff7a4d", "#7a2900",
  "#ff9e7a", "#5c1f00", "#ffc4a8", "#d73b00", "#3d1500", "#ffe8db",
];

// Custom tooltip component used by both charts
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#111111", border: "none",
      borderRadius: 0, padding: "10px 14px", fontSize: "0.75rem",
      fontFamily: "'Geist Mono', monospace",
      boxShadow: "0 4px 40px rgba(255,84,30,0.08)",
    }}>
      {label && <p style={{ color: "#5c5249", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: "0.65rem" }}>{label}</p>}
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || "#f0ece8" }}>
          {entry.name}: ₹{Number(entry.value).toLocaleString("en-IN")}
        </p>
      ))}
    </div>
  );
}

export default function Charts({ transactions }) {
  // ── Derived data for Pie chart (expense breakdown by category) ──
  const pieData = useMemo(() => {
    const map = {};
    transactions
      .filter(tx => tx.type === "expense")
      .forEach(tx => {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  // ── Derived data for Bar chart (income vs expense per category) ──
  const barData = useMemo(() => {
    const map = {};
    transactions.forEach(tx => {
      if (!map[tx.category]) map[tx.category] = { category: tx.category, income: 0, expense: 0 };
      map[tx.category][tx.type] += tx.amount;
    });
    return Object.values(map).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [transactions]);

  const hasExpenses = pieData.length > 0;
  const hasData     = barData.length > 0;

  return (
    <div className="chart-grid">

      {/* ── Pie chart: spending by category ── */}
      <div className="chart-container">
        <div className="card-title"><PieChartIcon /> Spending by Category</div>
        {!hasExpenses ? (
          <p style={{ color: "var(--on-surface-faint)", fontSize: "0.85rem", textAlign: "center", padding: "24px 0" }}>
            No expense data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}   /* donut hole */
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {pieData.map((entry, i) => (
                  <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "0.68rem", color: "#8a7e74", fontFamily: "'Geist Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Bar chart: income vs expense per category ── */}
      <div className="chart-container">
        <div className="card-title"><BarChartIcon /> Income vs Expenses</div>
        {!hasData ? (
          <p style={{ color: "var(--on-surface-faint)", fontSize: "0.85rem", textAlign: "center", padding: "24px 0" }}>
            No data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,122,77,0.06)" />
              <XAxis
                dataKey="category"
                tick={{ fill: "#5c5249", fontSize: 9, fontFamily: "'Geist Mono', monospace" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                tick={{ fill: "#5c5249", fontSize: 9, fontFamily: "'Geist Mono', monospace" }}
                axisLine={false} tickLine={false}
                tickFormatter={v => `₹${v >= 1000 ? (v/1000).toFixed(0)+"k" : v}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: "0.68rem", color: "#8a7e74", fontFamily: "'Geist Mono', monospace", textTransform: "uppercase", letterSpacing: "0.06em" }}
              />
              <Bar dataKey="income"  name="Income"  fill="#ff9e7a" radius={0} />
              <Bar dataKey="expense" name="Expense" fill="#FF541E" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}
