// src/pages/Dashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";

const ALERT_COLORS = {
  CRITICAL: "#ef4444",
  WARNING:  "#f59e0b",
  SAFE:     "#22c55e",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getDashboardSummary()
      .then(setData)
      .catch(() => setError("Could not connect to API. Make sure FastAPI is running on port 8000."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-lg text-gray-500 animate-pulse">Loading dashboard...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 m-6 text-red-700">
      ⚠️ {error}
    </div>
  );

  const alertData = [
    { name: "Critical", value: data.critical_batches, color: "#ef4444" },
    { name: "Warning",  value: data.warning_batches,  color: "#f59e0b" },
    { name: "Safe",     value: data.safe_batches,      color: "#22c55e" },
  ];

  const savingsData = [
    { name: "Potential Loss",   amount: data.total_potential_loss_inr  / 100000 },
    { name: "Recoverable",      amount: data.total_recoverable_inr     / 100000 },
    { name: "Net Saving",       amount: data.total_net_saving_inr      / 100000 },
    { name: "Charity Value",    amount: data.total_charity_value_inr   / 100000 },
  ];

  const ethicalColor =
    data.ethical_score >= 70 ? "text-green-600" :
    data.ethical_score >= 40 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Real-time expiry monitoring across {data.total_batches.toLocaleString()} batches
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Total Batches"   value={data.total_batches.toLocaleString()} icon="📦" color="bg-blue-50 border-blue-200" />
        <KPICard label="🔴 Critical"     value={data.critical_batches.toLocaleString()} icon="" color="bg-red-50 border-red-200"    textColor="text-red-700" />
        <KPICard label="🟡 Warning"      value={data.warning_batches.toLocaleString()}  icon="" color="bg-yellow-50 border-yellow-200" textColor="text-yellow-700" />
        <KPICard label="🟢 Safe"         value={data.safe_batches.toLocaleString()}     icon="" color="bg-green-50 border-green-200" textColor="text-green-700" />
      </div>

      {/* Savings Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SavingsCard label="Potential Loss"  value={fmt(data.total_potential_loss_inr)} color="bg-red-50 border-red-200"     textColor="text-red-700" />
        <SavingsCard label="Recoverable"     value={fmt(data.total_recoverable_inr)}    color="bg-blue-50 border-blue-200"   textColor="text-blue-700" />
        <SavingsCard label="Net Saving"      value={fmt(data.total_net_saving_inr)}     color="bg-green-50 border-green-200" textColor="text-green-700" />
        <SavingsCard label="Charity Value"   value={fmt(data.total_charity_value_inr)}  color="bg-purple-50 border-purple-200" textColor="text-purple-700" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alert Pie Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Alert Distribution</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={alertData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {alertData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => v.toLocaleString()} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Savings Bar Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Financial Summary (₹ Lakhs)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={savingsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `₹${v.toFixed(1)}L`} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ethical Score */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">Ethical Score</h2>
        <p className="text-sm text-gray-500 mb-4">
          % of at-risk batches redirected to charity instead of being discarded
        </p>
        <div className="flex items-center gap-6">
          <div className={`text-6xl font-bold ${ethicalColor}`}>
            {data.ethical_score.toFixed(1)}
            <span className="text-2xl text-gray-400">/100</span>
          </div>
          <div className="flex-1">
            <div className="w-full bg-gray-100 rounded-full h-4">
              <div
                className="h-4 rounded-full transition-all duration-700"
                style={{
                  width: `${data.ethical_score}%`,
                  backgroundColor:
                    data.ethical_score >= 70 ? "#22c55e" :
                    data.ethical_score >= 40 ? "#f59e0b" : "#ef4444",
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <span className="text-purple-600 font-semibold">{data.charity_batches.toLocaleString()}</span>
            <span className="text-gray-500 ml-2">batches donated to charity</span>
          </div>
          <div className="bg-red-50 rounded-lg p-3 border border-red-100">
            <span className="text-red-600 font-semibold">{data.discard_batches.toLocaleString()}</span>
            <span className="text-gray-500 ml-2">batches discarded</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ label, value, color, textColor = "text-gray-900" }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
    </div>
  );
}

function SavingsCard({ label, value, color, textColor }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-lg font-bold ${textColor}`}>{value}</p>
    </div>
  );
}
