# Agro Processing & Value Chain — FastAPI Backend

## Folder Structure
```
agro_api/
  main.py          ← FastAPI app + all endpoints
  model.py         ← model loading + prediction logic
  alerts.py        ← alert classification + savings logic
  schemas.py       ← input/output data shapes
  requirements.txt ← dependencies
  models/
    xgboost_expiry_model.pkl   ← trained XGBoost model (copy from Downloads)
    feature_columns.pkl        ← feature column order (copy from Downloads)
    label_encoders.pkl         ← category encoders (copy from Downloads)
    cleaned_perishable_final.csv ← cleaned dataset (copy from Downloads)
    perishable_goods_management.csv ← original dataset (copy from Downloads)
```

## Setup

### 1. Copy model files
Copy these from your Downloads folder into `agro_api/models/`:
- `xgboost_expiry_model.pkl`
- `feature_columns.pkl`
- `label_encoders.pkl`
- `cleaned_perishable_final.csv`
- `perishable_goods_management.csv`

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the API
```bash
uvicorn main:app --reload --port 8000
```

### 4. Open API docs
Visit: http://localhost:8000/docs

---

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check API is running |
| GET | `/categories` | List valid product categories |
| POST | `/predict/batch` | Predict expiry for multiple batches |
| GET | `/dashboard/summary` | Homepage summary stats |
| GET | `/batches/ranked` | All batches ranked by expiry |

### Filters for `/batches/ranked`
```
/batches/ranked                          → all batches
/batches/ranked?alert_level=CRITICAL     → critical only
/batches/ranked?category=Produce         → produce only
/batches/ranked?alert_level=WARNING&limit=50
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
      "potential_waste_cost_inr": 12032.0,
      "recoverable_revenue_inr": 13818.0,
      "net_saving_inr": 1786.0
    }
  ]
}
```

---

## Valid Categories
- Bakery
- Beverages
- Dairy
- Deli
- Meat
- Produce
- Ready_to_Eat
- Seafood

## Valid Quality Grades
- A (best)
- B (average)
- C (poor)
