// src/pages/Analytics.jsx
import { useEffect, useState } from "react";
import { api } from "../api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
  LineChart, Line,
} from "recharts";

const CATEGORY_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

export default function Analytics() {
  const [batches, setBatches]   = useState([]);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([
      api.getRankedBatches({ limit: 500 }),
      api.getDashboardSummary(),
    ]).then(([batchData, summaryData]) => {
      setBatches(batchData.batches);
      setSummary(summaryData);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 animate-pulse">
      Loading analytics...
    </div>
  );

  // Group by category
  const byCategory = batches.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = { category: b.category, batches: 0, loss: 0, saving: 0, critical: 0, warning: 0, safe: 0 };
    acc[b.category].batches++;
    acc[b.category].loss   += b.potential_waste_cost_inr;
    acc[b.category].saving += b.net_saving_inr;
    if (b.alert_level === 'CRITICAL') acc[b.category].critical++;
    if (b.alert_level === 'WARNING')  acc[b.category].warning++;
    if (b.alert_level === 'SAFE')     acc[b.category].safe++;
    return acc;
  }, {});
  const categoryData = Object.values(byCategory);

  // Action distribution
  const byAction = batches.reduce((acc, b) => {
    acc[b.suggested_action] = (acc[b.suggested_action] || 0) + 1;
    return acc;
  }, {});
  const actionData = Object.entries(byAction).map(([name, value]) => ({ name, value }));

  // Expiry distribution histogram
  const expiryBuckets = [
    { range: "0-1d",  count: batches.filter(b => b.predicted_expiry_days <= 1).length },
    { range: "2-3d",  count: batches.filter(b => b.predicted_expiry_days > 1 && b.predicted_expiry_days <= 3).length },
    { range: "4-7d",  count: batches.filter(b => b.predicted_expiry_days > 3 && b.predicted_expiry_days <= 7).length },
    { range: "8-14d", count: batches.filter(b => b.predicted_expiry_days > 7 && b.predicted_expiry_days <= 14).length },
    { range: "15-30d",count: batches.filter(b => b.predicted_expiry_days > 14).length },
  ];

  const ACTION_COLORS = {
    "PRIORITY DELIVERY": "#3b82f6",
    "CHARITY":           "#8b5cf6",
    "DISCARD":           "#6b7280",
    "MONITOR":           "#22c55e",
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-500 mt-1">Waste reduction and financial breakdown</p>
      </div>

      {/* Summary stat strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Potential Loss"  value={fmt(summary.total_potential_loss_inr)} color="text-red-600" />
          <StatCard label="Total Net Saving"      value={fmt(summary.total_net_saving_inr)}     color="text-green-600" />
          <StatCard label="Charity Value"         value={fmt(summary.total_charity_value_inr)}  color="text-purple-600" />
          <StatCard label="Ethical Score"         value={`${summary.ethical_score} / 100`}      color="text-blue-600" />
        </div>
      )}

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Loss by category */}
        <ChartCard title="Potential Loss by Category (₹)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v) => fmt(v)} />
              <Bar dataKey="loss" fill="#ef4444" radius={[0, 4, 4, 0]} name="Potential Loss" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Action distribution pie */}
        <ChartCard title="Action Distribution">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={actionData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {actionData.map((entry) => (
                  <Cell key={entry.name} fill={ACTION_COLORS[entry.name] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => `${v.toLocaleString()} batches`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Alert breakdown by category */}
        <ChartCard title="Alert Levels by Category">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="critical" name="Critical" stackId="a" fill="#ef4444" />
              <Bar dataKey="warning"  name="Warning"  stackId="a" fill="#f59e0b" />
              <Bar dataKey="safe"     name="Safe"     stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Expiry distribution */}
        <ChartCard title="Expiry Distribution (all batches)">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={expiryBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="range" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => `${v.toLocaleString()} batches`} />
              <Bar dataKey="count" name="Batches" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Net saving by category */}
      <ChartCard title="Net Saving if Action Taken — by Category (₹)">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={categoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="category" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v) => fmt(v)} />
            <Bar dataKey="saving" name="Net Saving" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-gray-800 mb-4">{title}</h2>
      {children}
    </div>
  );
}
