// src/pages/Predict.jsx
import { useState } from "react";
import { api } from "../api";

const CATEGORIES = [
  "Bakery",
  "Beverages",
  "Dairy",
  "Deli",
  "Meat",
  "Produce",
  "Ready_to_Eat",
  "Seafood",
];

const ALERT_STYLES = {
  CRITICAL: {
    bg: "bg-red-50 border-red-300",
    text: "text-red-700",
    badge: "bg-red-500 text-white",
  },
  WARNING: {
    bg: "bg-yellow-50 border-yellow-300",
    text: "text-yellow-700",
    badge: "bg-yellow-500 text-white",
  },
  SAFE: {
    bg: "bg-green-50 border-green-300",
    text: "text-green-700",
    badge: "bg-green-500 text-white",
  },
};

const ACTION_ICONS = {
  "PRIORITY DELIVERY": "🚚",
  CHARITY: "🤝",
  DISCARD: "🗑️",
  MONITOR: "👁️",
};

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const defaultForm = {
  category: "Produce",
  storage_temp: 4.0,
  temp_deviation: 1.0,
  temp_abuse_events: 0,
  distribution_hours: 12,
  handling_score: 8,
  packaging_score: 7,
  quality_grade: "A",
  supplier_score: 8,
  month: new Date().getMonth() + 1,
  product_name: "",
  initial_quantity: 100,
  cost_price: 0.64 * 25,
  base_price: 1.05 * 25,
};

export default function Predict() {
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    const intFields = [
      "handling_score",
      "packaging_score",
      "supplier_score",
      "temp_abuse_events",
      "initial_quantity",
      "month",
    ];
    setForm((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? intFields.includes(name)
            ? parseInt(value)
            : parseFloat(value)
          : value,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.predictBatch([form]);
      setResult(data.predictions[0]);
    } catch (err) {
      // setError("Prediction failed. Is the API running on port 8000?");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const alertStyle = result ? ALERT_STYLES[result.alert_level] : null;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Predict Batch Expiry
        </h1>
        <p className="text-gray-500 mt-1">
          Enter batch details to get expiry prediction and alert
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Batch Details</h2>

          <Field label="Product Name (optional)">
            <input
              name="product_name"
              value={form.product_name}
              onChange={handleChange}
              placeholder="e.g. Tomatoes"
              className="input"
            />
          </Field>

          <Field label="Category">
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              className="input"
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Storage Temp (°C)">
              <input
                type="number"
                name="storage_temp"
                value={form.storage_temp}
                onChange={handleChange}
                step="0.1"
                className="input"
              />
            </Field>
            <Field label="Temp Deviation">
              <input
                type="number"
                name="temp_deviation"
                value={form.temp_deviation}
                onChange={handleChange}
                step="0.1"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Temp Abuse Events">
              <input
                type="number"
                name="temp_abuse_events"
                value={form.temp_abuse_events}
                onChange={handleChange}
                min="0"
                className="input"
              />
            </Field>
            <Field label="Distribution Hours">
              <input
                type="number"
                name="distribution_hours"
                value={form.distribution_hours}
                onChange={handleChange}
                min="0"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Handling Score (1-10)">
              <input
                type="number"
                name="handling_score"
                value={form.handling_score}
                onChange={handleChange}
                min="1"
                max="10"
                className="input"
              />
            </Field>
            <Field label="Packaging Score (1-10)">
              <input
                type="number"
                name="packaging_score"
                value={form.packaging_score}
                onChange={handleChange}
                min="1"
                max="10"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Quality Grade">
              <select
                name="quality_grade"
                value={form.quality_grade}
                onChange={handleChange}
                className="input"
              >
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </Field>
            <Field label="Supplier Score (1-10)">
              <input
                type="number"
                name="supplier_score"
                value={form.supplier_score}
                onChange={handleChange}
                min="1"
                max="10"
                className="input"
              />
            </Field>
          </div>

          <Field label="Month of Receipt">
            <input
              type="number"
              name="month"
              value={form.month}
              onChange={handleChange}
              min="1"
              max="12"
              className="input"
            />
          </Field>

          <hr className="border-gray-100" />
          <h3 className="text-sm font-semibold text-gray-600">
            Financial Details (optional)
          </h3>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Quantity (units)">
              <input
                type="number"
                name="initial_quantity"
                value={form.initial_quantity}
                onChange={handleChange}
                min="1"
                className="input"
              />
            </Field>
            <Field label="Cost Price (₹)">
              <input
                type="number"
                name="cost_price"
                value={form.cost_price}
                onChange={handleChange}
                step="0.01"
                className="input"
              />
            </Field>
            <Field label="Base Price (₹)">
              <input
                type="number"
                name="base_price"
                value={form.base_price}
                onChange={handleChange}
                step="0.01"
                className="input"
              />
            </Field>
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Predicting..." : "Predict Expiry →"}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
              <div className="text-4xl mb-3">📦</div>
              <p>Fill in batch details and click Predict</p>
            </div>
          )}

          {result && alertStyle && (
            <>
              {/* Main result */}
              <div className={`rounded-xl border-2 p-6 ${alertStyle.bg}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Predicted Expiry</p>
                    <p className={`text-5xl font-bold ${alertStyle.text}`}>
                      {result.predicted_expiry_days}
                      <span className="text-2xl font-normal ml-1">days</span>
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-bold ${alertStyle.badge}`}
                  >
                    {result.alert_level}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 text-lg font-semibold ${alertStyle.text}`}
                >
                  <span>{ACTION_ICONS[result.suggested_action]}</span>
                  <span>{result.suggested_action}</span>
                </div>
              </div>

              {/* Savings */}
              {result.potential_waste_cost_inr && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-sm">
                  <h3 className="font-semibold text-gray-800">
                    Financial Impact (₹)
                  </h3>
                  <SavingsRow
                    label="Potential Loss if Wasted"
                    value={fmt(result.potential_waste_cost_inr)}
                    color="text-red-600"
                  />
                  <SavingsRow
                    label="Recoverable Revenue"
                    value={fmt(result.recoverable_revenue_inr)}
                    color="text-blue-600"
                  />
                  <SavingsRow
                    label="Net Saving if Acted"
                    value={fmt(result.net_saving_inr)}
                    color="text-green-600"
                  />
                </div>
              )}

              {/* Category */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm text-sm text-gray-600 space-y-2">
                <p>
                  <span className="font-medium">Category:</span>{" "}
                  {result.category}
                </p>
                {result.product_name && (
                  <p>
                    <span className="font-medium">Product:</span>{" "}
                    {result.product_name}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function SavingsRow({ label, value, color }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500">{label}</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}
