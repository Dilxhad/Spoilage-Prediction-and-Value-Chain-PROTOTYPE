"""
model.py — Model loading + feature engineering + prediction
"""

import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from xgboost import XGBRegressor

# ─────────────────────────────────────────
# LOAD MODEL & ARTIFACTS
# ─────────────────────────────────────────
BASE_DIR = Path(__file__).parent

model = XGBRegressor(enable_categorical=True, tree_method='hist')
model.load_model(str(BASE_DIR / "models" / "xgboost_expiry_model.json"))
print("Model loaded ✓")

with open(BASE_DIR / "models" / "feature_columns.pkl", "rb") as f:
    feature_cols = pickle.load(f)

print(f"Features expected: {feature_cols}")

VALID_CATEGORIES = [
    'Bakery', 'Beverages', 'Dairy', 'Deli',
    'Meat', 'Produce', 'Ready_to_Eat', 'Seafood'
]

GRADE_MAP = {'A': 3, 'B': 2, 'C': 1}


def engineer_features(batch: dict) -> pd.DataFrame:

    # Validate category
    if batch['category'] not in VALID_CATEGORIES:
        raise ValueError(
            f"Unknown category '{batch['category']}'. "
            f"Valid: {VALID_CATEGORIES}"
        )

    # Encode quality grade
    grade_encoded = GRADE_MAP.get(batch.get('quality_grade', 'B'), 2)

    # Engineer temp_abuse_rate
    distribution_hours = float(batch.get('distribution_hours', 1))
    temp_abuse_events  = float(batch.get('temp_abuse_events', 0))
    temp_abuse_rate    = temp_abuse_events / (distribution_hours + 1)

    # Apply same transforms as Step 1
    temp_abuse_events_transformed = np.log1p(temp_abuse_events)
    temp_abuse_rate_transformed   = np.cbrt(temp_abuse_rate)

    # Auto-compute date features from today
    now             = pd.Timestamp.now()
    month           = int(batch.get('month', now.month))
    txn_day_of_year = now.dayofyear
    txn_week        = now.isocalendar().week
    txn_quarter     = now.quarter

    # Build feature row — category as raw string
    row = {
        'category':          batch['category'],
        'storage_temp':      float(batch['storage_temp']),
        'temp_deviation':    float(batch['temp_deviation']),
        'month':             month,
        'temp_abuse_events': temp_abuse_events_transformed,
        'distribution_hours': distribution_hours,
        'handling_score':    int(batch['handling_score']),
        'packaging_score':   int(batch['packaging_score']),
        'quality_grade':     grade_encoded,
        'supplier_score':    int(batch['supplier_score']),
        'txn_day_of_year':   txn_day_of_year,
        'txn_week':          txn_week,
        'txn_quarter':       txn_quarter,
        'temp_abuse_rate':   temp_abuse_rate_transformed,
    }

    df = pd.DataFrame([row])
    df = df[feature_cols]

    # category as string categorical — matches training exactly
    df['category'] = df['category'].astype('category')

    return df


def predict_single(batch: dict) -> float:
    df = engineer_features(batch)
    pred = model.predict(df)[0]
    return round(max(0.0, float(pred)), 1)


def predict_batch(batches: list) -> list:
    dfs = [engineer_features(b) for b in batches]
    combined = pd.concat(dfs, ignore_index=True)
    combined['category'] = combined['category'].astype('category')
    preds = model.predict(combined)
    preds = np.clip(preds, 0, None)
    return [round(float(p), 1) for p in preds]