"""
AGRO PROCESSING & VALUE CHAIN
Step 4: FastAPI Backend

Endpoints:
    GET  /health              → API health check
    POST /predict/batch       → predict expiry for multiple batches
    GET  /dashboard/summary   → homepage summary stats
    GET  /batches/ranked      → all batches ranked by expiry
"""

import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    BatchInput, BatchListInput,
    BatchPrediction, BatchListPrediction,
    DashboardSummary, RankedBatch, RankedBatchList
)
from alerts import classify_alert, suggest_action, calculate_savings
from model import predict_batch, predict_single, VALID_CATEGORIES

# ─────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────
app = FastAPI(
    title="Agro Processing & Value Chain API",
    description="Predicts expiry days for warehouse batches and generates alerts",
    version="1.0.0"
)


from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print("VALIDATION ERROR:", exc.errors())
    return JSONResponse(status_code=400, content={"detail": exc.errors()})


# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────
# PRECOMPUTE DASHBOARD DATA AT STARTUP
# Load full dataset, run predictions + Step 3 logic once
# Serve pre-computed results to frontend — fast responses
# ─────────────────────────────────────────
BASE_DIR = Path(__file__).parent
USD_TO_INR = 1

@app.on_event("startup")
async def precompute():
    """Run predictions on full dataset at startup"""
    global df_results

    print("Precomputing predictions on full dataset...")

    df_clean = pd.read_csv(BASE_DIR / "models" / "cleaned_perishable_final.csv")
    df_orig  = pd.read_csv(BASE_DIR / "models" / "perishable_goods_management.csv")

    # Apply same filters as Step 1
    df_orig = df_orig[df_orig['category'] != 'Pharmaceuticals'].reset_index(drop=True)
    df_orig = df_orig[df_orig['category'] != 'Frozen_Meals'].reset_index(drop=True)

    # Pull financial + product columns
    df_clean['cost_price']       = df_orig['cost_price'].values
    df_clean['base_price']       = df_orig['base_price'].values
    df_clean['initial_quantity'] = df_orig['initial_quantity'].values
    df_clean['product_name']     = df_orig['product_name'].values
    df_clean['category_name']    = df_orig['category'].values

    # Load feature cols
    with open(BASE_DIR / "models" / "feature_columns.pkl", "rb") as f:
        feature_cols = pickle.load(f)

    # Load model
    from xgboost import XGBRegressor
    model = XGBRegressor(enable_categorical=True, tree_method='hist')
    model.load_model(str(BASE_DIR / "models" / "xgboost_expiry_model.json"))

    # Predict
    X = df_clean[feature_cols].copy()
    X['category'] = X['category'].astype('category')
    preds = model.predict(X)
    df_clean['predicted_expiry_days'] = np.clip(preds, 0, None).round(1)

    # Alert + action
    df_clean['alert_level']      = df_clean['predicted_expiry_days'].apply(classify_alert)
    df_clean['suggested_action'] = df_clean.apply(
        lambda r: suggest_action(r['predicted_expiry_days'], r['category_name']), axis=1
    )

    # Savings for at-risk batches
    for col in ['potential_waste_cost_inr', 'recoverable_revenue_inr',
                'charity_value_inr', 'net_saving_inr']:
        df_clean[col] = 0.0

    at_risk_mask = df_clean['alert_level'].isin(['CRITICAL', 'WARNING'])
    at_risk = df_clean[at_risk_mask].copy()

    df_clean.loc[at_risk_mask, 'potential_waste_cost_inr'] = (
        at_risk['initial_quantity'] * at_risk['cost_price'] * USD_TO_INR
    ).values
    df_clean.loc[at_risk_mask, 'recoverable_revenue_inr'] = (
        at_risk['initial_quantity'] * at_risk['base_price'] * 0.7 * USD_TO_INR
    ).values
    df_clean.loc[at_risk_mask, 'charity_value_inr'] = (
        at_risk['initial_quantity'] * at_risk['cost_price'] * USD_TO_INR
    ).values
    df_clean.loc[at_risk_mask, 'net_saving_inr'] = (
        df_clean.loc[at_risk_mask, 'recoverable_revenue_inr'] -
        df_clean.loc[at_risk_mask, 'potential_waste_cost_inr']
    ).values

    df_results = df_clean
    print(f"Precomputed {len(df_results)} batch predictions ✓")


# ─────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────

@app.get("/health")
def health():
    """Check if API is running"""
    return {"status": "ok", "message": "Agro API is running ✓"}


@app.get("/categories")
def get_categories():
    """Get list of valid product categories"""
    return {"categories": VALID_CATEGORIES}


@app.post("/predict/batch", response_model=BatchListPrediction)
def predict_batches(input_data: BatchListInput):
    """
    Predict expiry days for multiple batches at once.
    Returns expiry prediction + alert level + suggested action + savings.
    """
    try:
        batch_dicts = [b.dict() for b in input_data.batches]
        predictions = predict_batch(batch_dicts)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    results = []
    for batch, pred_days in zip(input_data.batches, predictions):
        alert  = classify_alert(pred_days)
        action = suggest_action(pred_days, batch.category)

        # Calculate savings if financial data provided
        savings = None
        if batch.initial_quantity and batch.cost_price and batch.base_price:
            if alert in ['CRITICAL', 'WARNING']:
                savings = calculate_savings(
                    batch.initial_quantity,
                    batch.cost_price,
                    batch.base_price
                )

        results.append(BatchPrediction(
            product_name=batch.product_name,
            category=batch.category,
            predicted_expiry_days=pred_days,
            alert_level=alert,
            suggested_action=action,
            potential_waste_cost_inr=savings['potential_waste_cost_inr'] if savings else None,
            recoverable_revenue_inr=savings['recoverable_revenue_inr'] if savings else None,
            net_saving_inr=savings['net_saving_inr'] if savings else None,
        ))

    return BatchListPrediction(
        total_batches=len(results),
        predictions=results
    )


@app.get("/dashboard/summary", response_model=DashboardSummary)
def dashboard_summary():
    """
    Homepage dashboard summary.
    Returns totals: alert counts, savings, ethical score.
    Pre-computed at startup for fast response.
    """
    df = df_results

    alert_counts  = df['alert_level'].value_counts()
    action_counts = df['suggested_action'].value_counts()

    at_risk = df[df['alert_level'].isin(['CRITICAL', 'WARNING'])]
    charity = df[df['suggested_action'] == 'CHARITY']
    discard = df[df['suggested_action'] == 'DISCARD']

    total_at_risk_batches = len(at_risk)
    total_charity_batches = len(charity)

    denominator = total_charity_batches + len(discard)
    ethical_score = (
        (total_charity_batches / denominator * 100)
        if denominator > 0 else 0
    )

    return DashboardSummary(
        total_batches=len(df),
        critical_batches=int(alert_counts.get('CRITICAL', 0)),
        warning_batches=int(alert_counts.get('WARNING', 0)),
        safe_batches=int(alert_counts.get('SAFE', 0)),
        total_potential_loss_inr=round(df['potential_waste_cost_inr'].sum(), 2),
        total_recoverable_inr=round(df['recoverable_revenue_inr'].sum(), 2),
        total_net_saving_inr=round(df['net_saving_inr'].sum(), 2),
        total_charity_value_inr=round(df['charity_value_inr'].sum(), 2),
        ethical_score=round(ethical_score, 1),
        charity_batches=total_charity_batches,
        discard_batches=int(len(discard)),
    )


@app.get("/batches/ranked", response_model=RankedBatchList)
def batches_ranked(
    alert_level: str = None,
    category: str = None,
    limit: int = 100
):
    """
    All batches ranked by expiry (most urgent first).
    Optional filters: alert_level, category, limit.

    Usage:
        /batches/ranked
        /batches/ranked?alert_level=CRITICAL
        /batches/ranked?category=Produce
        /batches/ranked?alert_level=WARNING&limit=50
    """
    df = df_results.copy()

    # Apply filters
    if alert_level:
        alert_level = alert_level.upper()
        if alert_level not in ['CRITICAL', 'WARNING', 'SAFE']:
            raise HTTPException(
                status_code=400,
                detail="alert_level must be CRITICAL, WARNING or SAFE"
            )
        df = df[df['alert_level'] == alert_level]

    if category:
        df = df[df['category_name'].str.lower() == category.lower()]
        if len(df) == 0:
            raise HTTPException(
                status_code=404,
                detail=f"No batches found for category '{category}'"
            )

    # Sort by most urgent
    df = df.sort_values('predicted_expiry_days').head(limit).reset_index(drop=True)

    batches = []
    for rank, (_, row) in enumerate(df.iterrows(), 1):
        batches.append(RankedBatch(
            rank=rank,
            product_name=str(row['product_name']),
            category=str(row['category_name']),
            predicted_expiry_days=float(row['predicted_expiry_days']),
            actual_expiry_days=float(row['days_until_expiry']),
            alert_level=str(row['alert_level']),
            suggested_action=str(row['suggested_action']),
            initial_quantity=int(row['initial_quantity']),
            potential_waste_cost_inr=float(row['potential_waste_cost_inr']),
            recoverable_revenue_inr=float(row['recoverable_revenue_inr']),
            net_saving_inr=float(row['net_saving_inr']),
        ))

    return RankedBatchList(total=len(batches), batches=batches)
