# 🌾 Agro Processing & Value Chain — Spoilage Prediction System

An end-to-end machine learning system for warehouse perishable goods management. Predicts batch expiry dates, generates real-time alerts, suggests actions (Priority Delivery / Charity / Discard), and calculates financial savings — all displayed on a live React dashboard.

---

## 🎯 Problem Statement

Warehouses handling perishable goods face significant financial losses due to undetected spoilage. Without a proactive monitoring system, batches expire unnoticed leading to:
- Direct financial loss (cost of wasted goods)
- Missed opportunity to redirect near-expiry stock to charity
- Inefficient manual monitoring processes

---

## 💡 Solution

AgroWatch predicts how many days remain before each batch expires using an XGBoost regression model trained on environmental and handling features. The system:

- Ranks all batches by urgency
- Classifies each as Critical / Warning / Safe
- Suggests actions automatically
- Calculates potential savings in ₹
- Tracks ethical score based on charitable donations

---

## 🏗️ Architecture

```
Warehouse Data
      ↓
XGBoost Model (Python / Jupyter)
      ↓
FastAPI Backend (REST API)
      ↓
React Frontend (Dashboard)
```

---

## 🤖 Model

| Detail | Value |
|--------|-------|
| Algorithm | XGBoost Regressor |
| Target | `days_until_expiry` |
| Features | 14 (environmental + handling + seasonal) |
| Training rows | ~80,000 |
| Within 10 days accuracy | 97.2% |
| Categories | Bakery, Beverages, Dairy, Deli, Meat, Produce, Ready_to_Eat, Seafood |

### Key Features Used
- `storage_temp` — storage temperature (°C)
- `temp_deviation` — temperature fluctuation
- `temp_abuse_events` — cold chain breaches during transit
- `temp_abuse_rate` — abuse events normalized by distribution hours
- `distribution_hours` — time spent in transit
- `handling_score` — physical handling quality (1-10)
- `packaging_score` — packaging quality (1-10)
- `quality_grade` — batch grade (A/B/C)
- `supplier_score` — supplier reliability (1-10)
- `category` — product category
- `month`, `txn_day_of_year`, `txn_week`, `txn_quarter` — seasonal signals

---

## 🚨 Alert System

| Alert | Threshold | Action |
|-------|-----------|--------|
| 🔴 Critical | ≤ 2 days | Charity or Discard |
| 🟡 Warning | ≤ 7 days | Priority Delivery |
| 🟢 Safe | > 7 days | Monitor |

---

## 💰 Savings Calculation

For each at-risk batch:
```
Potential Loss     = quantity × cost_price
Recoverable Revenue = quantity × base_price × 0.7  (30% markdown)
Net Saving         = Recoverable Revenue - Potential Loss
Charity Value      = quantity × cost_price
```

---

## 🧭 Ethical Score

```
Ethical Score = (charity batches / (charity + discard batches)) × 100
```

Measures what % of at-risk batches were redirected to charity instead of being discarded.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| ML Model | XGBoost, scikit-learn, pandas, numpy |
| Backend | FastAPI, uvicorn, pydantic |
| Frontend | React 18, Tailwind CSS, Recharts, React Router |
| Data | Kaggle — Perishable Goods Management Dataset |

---

## 📁 Project Structure

```
Agro hackathon/
├── README.md                        ← you are here
│
├── agro_api/                        ← FastAPI backend
│   ├── main.py                      ← all endpoints
│   ├── model.py                     ← model loading + inference
│   ├── alerts.py                    ← alert + savings logic
│   ├── schemas.py                   ← input/output schemas
│   ├── requirements.txt
│   ├── README.md                    ← API setup guide
│   └── models/
│       ├── xgboost_expiry_model.json
│       ├── feature_columns.pkl
│       ├── cleaned_perishable_final.csv
│       └── perishable_goods_management.csv
│
└── agro-frontend/                   ← React frontend
    ├── src/
    │   ├── App.jsx
    │   ├── api/index.js
    │   ├── components/Navbar.jsx
    │   └── pages/
    │       ├── Dashboard.jsx
    │       ├── Batches.jsx
    │       ├── Analytics.jsx
    │       └── Predict.jsx
    └── README.md                    ← Frontend setup guide
```

---

## 🚀 Running the Project

### Prerequisites
- Python 3.10+
- Node.js 16+
- XGBoost 3.2.0

### 1. Clone the repository
```bash
git clone https://github.com/Dilxhad/Spoilage-Prediction-and-Value-Chain-PROTOTYPE.git
cd Spoilage-Prediction-and-Value-Chain-PROTOTYPE
```

### 2. Start the API
```bash
cd agro_api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API runs at `http://localhost:8000`
Auto docs at `http://localhost:8000/docs`

### 3. Start the Frontend
```bash
cd agro-frontend
npm install
npm start
```

Frontend runs at `http://localhost:3000`

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | API health check |
| GET | `/categories` | Valid product categories |
| POST | `/predict/batch` | Predict expiry for new batches |
| GET | `/dashboard/summary` | Homepage summary stats |
| GET | `/batches/ranked` | All batches ranked by urgency |

---

## 📈 Frontend Pages

| Page | Description |
|------|-------------|
| Dashboard | Alert counts, ₹ savings, ethical score, charts |
| Batch Monitor | Full ranked table with alert/category filters |
| Analytics | Loss by category, action distribution, expiry histogram |
| Predict | Real-time prediction form for new batches |

---

## 🔮 Future Work

- Hardware integration — IoT sensors for real-time temperature monitoring
- Indian product database — retrain with Indian warehouse data
- Hourly prediction refresh — live monitoring mode
- Mobile app — warehouse staff alerts on phone
- Multi-warehouse support — aggregate dashboard across locations
- Demand forecasting integration — combine expiry prediction with sales data
