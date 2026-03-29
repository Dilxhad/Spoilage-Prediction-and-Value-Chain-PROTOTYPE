# AgroWatch — FastAPI Backend

REST API for the Agro Processing & Value Chain project. Loads the trained XGBoost model at startup, precomputes predictions on the full warehouse dataset, and serves results to the React frontend.

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check if API is running |
| GET | `/categories` | List valid product categories |
| POST | `/predict/batch` | Predict expiry for one or more new batches |
| GET | `/dashboard/summary` | Homepage summary — alert counts, ₹ savings, ethical score |
| GET | `/batches/ranked` | All batches ranked by expiry urgency |

### Filters for `/batches/ranked`
```
/batches/ranked                           → all batches
/batches/ranked?alert_level=CRITICAL      → critical only
/batches/ranked?category=Produce          → produce only
/batches/ranked?alert_level=WARNING&limit=50
```

---

## Tech Stack

- FastAPI
- Uvicorn
- XGBoost 3.2.0
- Pandas, NumPy
- Pydantic v2

---

## Prerequisites

- Python 3.10+
- XGBoost 3.2.0

---

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Add model files to `models/` folder
Copy these files into `agro_api/models/`:
```
xgboost_expiry_model.json      ← trained XGBoost model
feature_columns.pkl            ← feature column order
cleaned_perishable_final.csv   ← cleaned dataset
perishable_goods_management.csv ← original dataset (for financial columns)
```

### 3. Run the API
```bash
uvicorn main:app --reload --port 8000
```

### 4. Open auto-generated docs
```
http://localhost:8000/docs
```

---

## Folder Structure

```
agro_api/
├── main.py          ← FastAPI app + all endpoints
├── model.py         ← model loading + feature engineering + inference
├── alerts.py        ← alert classification + savings calculation
├── schemas.py       ← input/output data shapes (Pydantic)
├── requirements.txt
└── models/
    ├── xgboost_expiry_model.json
    ├── feature_columns.pkl
    ├── cleaned_perishable_final.csv
    └── perishable_goods_management.csv
```

---

## Alert Logic

| Alert | Threshold | Actions |
|-------|-----------|---------|
| 🔴 Critical | ≤ 2 days | Charity or Discard |
| 🟡 Warning | ≤ 7 days | Priority Delivery |
| 🟢 Safe | > 7 days | Monitor |

High perishable categories (Seafood, Meat, Ready_to_Eat) expiring in ≤ 1 day → DISCARD.
All others expiring in ≤ 1 day → CHARITY.

---

## Savings Calculation

```
potential_waste_cost = quantity × cost_price
recoverable_revenue  = quantity × base_price × 0.7  (30% markdown)
charity_value        = quantity × cost_price
net_saving           = recoverable_revenue - potential_waste_cost
```

---

## Ethical Score

```
ethical_score = (charity_batches / (charity_batches + discard_batches)) × 100
```

---

## Example Request — POST /predict/batch

```json
{
  "batches": [
    {
      "category": "Produce",
      "storage_temp": 4.0,
      "temp_deviation": 1.5,
      "temp_abuse_events": 1,
      "distribution_hours": 12.0,
      "handling_score": 8,
      "packaging_score": 7,
      "quality_grade": "A",
      "supplier_score": 8,
      "month": 6,
      "product_name": "Tomatoes",
      "initial_quantity": 200,
      "cost_price": 0.64,
      "base_price": 1.05
    }
  ]
}
```

## Example Response

```json
{
  "total_batches": 1,
  "predictions": [
    {
      "product_name": "Tomatoes",
      "category": "Produce",
      "predicted_expiry_days": 8.3,
      "alert_level": "WARNING",
      "suggested_action": "PRIORITY DELIVERY",
      "potential_waste_cost_inr": 3200.0,
      "recoverable_revenue_inr": 3675.0,
      "net_saving_inr": 475.0
    }
  ]
}
```

---

## Valid Categories
Bakery, Beverages, Dairy, Deli, Meat, Produce, Ready_to_Eat, Seafood

## Valid Quality Grades
A (best), B (average), C (poor)
