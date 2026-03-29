// src/pages/Batches.jsx
import { useEffect, useState } from "react";
import { api } from "../api";

const ALERT_STYLES = {
  CRITICAL: "bg-red-100 text-red-700 border-red-300",
  WARNING:  "bg-yellow-100 text-yellow-700 border-yellow-300",
  SAFE:     "bg-green-100 text-green-700 border-green-300",
};

const ACTION_STYLES = {
  "PRIORITY DELIVERY": "bg-blue-100 text-blue-700",
  "CHARITY":           "bg-purple-100 text-purple-700",
  "DISCARD":           "bg-gray-100 text-gray-600",
  "MONITOR":           "bg-green-50 text-green-600",
};

const CATEGORIES = [
  "All", "Bakery", "Beverages", "Dairy",
  "Deli", "Meat", "Produce", "Ready_to_Eat", "Seafood"
];

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(n);

export default function Batches() {
  const [batches, setBatches]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [alertFilter, setAlertFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [search, setSearch]       = useState("");

  useEffect(() => {
    setLoading(true);
    const params = {
      alertLevel: alertFilter !== "All" ? alertFilter : undefined,
      category:   categoryFilter !== "All" ? categoryFilter : undefined,
      limit: 500,
    };
    api.getRankedBatches(params)
      .then((data) => setBatches(data.batches))
      .catch(() => setError("Failed to load batches. Is the API running?"))
      .finally(() => setLoading(false));
  }, [alertFilter, categoryFilter]);

  const filtered = batches.filter((b) =>
    search === "" ||
    b.product_name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Batch Monitor</h1>
        <p className="text-gray-500 mt-1">All warehouse batches ranked by expiry urgency</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search product or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />

        {/* Alert filter */}
        <div className="flex gap-2">
          {["All", "CRITICAL", "WARNING", "SAFE"].map((level) => (
            <button
              key={level}
              onClick={() => setAlertFilter(level)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                alertFilter === level
                  ? level === "CRITICAL" ? "bg-red-500 text-white border-red-500"
                  : level === "WARNING"  ? "bg-yellow-500 text-white border-yellow-500"
                  : level === "SAFE"     ? "bg-green-500 text-white border-green-500"
                  : "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        >
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>

        <span className="text-sm text-gray-400 ml-auto">
          {filtered.length} batches
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-400 animate-pulse">
          Loading batches...
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Predicted Expiry</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Actual Expiry</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Alert</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Qty</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Potential Loss</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Net Saving</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((b) => (
                  <tr key={b.rank} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{b.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.product_name}</td>
                    <td className="px-4 py-3 text-gray-600">{b.category}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        b.predicted_expiry_days <= 2 ? "text-red-600" :
                        b.predicted_expiry_days <= 7 ? "text-yellow-600" : "text-green-600"
                      }`}>
                        {b.predicted_expiry_days}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{b.actual_expiry_days}d</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-semibold border ${ALERT_STYLES[b.alert_level]}`}>
                        {b.alert_level}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium ${ACTION_STYLES[b.suggested_action]}`}>
                        {b.suggested_action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{b.initial_quantity}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{fmt(b.potential_waste_cost_inr)}</td>
                    <td className="px-4 py-3 text-green-600 font-medium">{fmt(b.net_saving_inr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                No batches found for the selected filters.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
