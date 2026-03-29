// src/api/index.js
// All FastAPI calls in one place

const BASE_URL = "http://localhost:8000";

export const api = {
  // Health check
  health: async () => {
    const res = await fetch(`${BASE_URL}/health`);
    return res.json();
  },

  // Dashboard summary
  getDashboardSummary: async () => {
    const res = await fetch(`${BASE_URL}/dashboard/summary`);
    if (!res.ok) throw new Error("Failed to fetch dashboard summary");
    return res.json();
  },

  // Ranked batches with optional filters
  getRankedBatches: async ({ alertLevel, category, limit = 200 } = {}) => {
    const params = new URLSearchParams();
    if (alertLevel) params.append("alert_level", alertLevel);
    if (category) params.append("category", category);
    if (limit) params.append("limit", limit);
    const res = await fetch(`${BASE_URL}/batches/ranked?${params}`);
    if (!res.ok) throw new Error("Failed to fetch batches");
    return res.json();
  },

  // Predict new batch
  predictBatch: async (batches) => {
    const res = await fetch(`${BASE_URL}/predict/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batches }),
    });
    if (!res.ok) {
      const errorText = await res.text(); // ← get actual error from API
      throw new Error(errorText);
    }
    return res.json();
  },

  // Get valid categories
  getCategories: async () => {
    const res = await fetch(`${BASE_URL}/categories`);
    return res.json();
  },
};
