"""
schemas.py — Input/Output data shapes for FastAPI
"""

from pydantic import BaseModel, Field
from typing import List, Optional


# ─────────────────────────────────────────
# INPUT SCHEMAS
# ─────────────────────────────────────────

class BatchInput(BaseModel):
    """Single batch input for prediction"""
    category: str = Field(..., description="Product category e.g. Dairy, Meat, Produce")
    storage_temp: float = Field(..., description="Storage temperature in Celsius")
    temp_deviation: float = Field(..., description="Temperature deviation from set point")
    temp_abuse_events: float = Field(..., description="Number of cold chain breaches during transit")
    distribution_hours: float = Field(..., description="Hours spent in transit/distribution")
    handling_score: float = Field(..., ge=1, le=10, description="Handling quality score (1-10)")
    packaging_score: float = Field(..., ge=1, le=10, description="Packaging quality score (1-10)")
    quality_grade: str = Field(..., description="Quality grade: A, B or C")
    supplier_score: float = Field(..., ge=1, le=10, description="Supplier reliability score (1-10)")
    month: int = Field(..., ge=1, le=12, description="Month of batch receipt (1-12)")

    # Financial fields for savings calculation
    product_name: Optional[str] = Field(None, description="Product name (optional)")
    initial_quantity: Optional[int] = Field(None, description="Number of units in batch")
    cost_price: Optional[float] = Field(None, description="Cost price per unit in USD")
    base_price: Optional[float] = Field(None, description="Base retail price per unit in USD")

    class Config:
        json_schema_extra = {
            "example": {
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
        }


class BatchListInput(BaseModel):
    """Multiple batches input"""
    batches: List[BatchInput]


# ─────────────────────────────────────────
# OUTPUT SCHEMAS
# ─────────────────────────────────────────

class BatchPrediction(BaseModel):
    """Prediction result for a single batch"""
    product_name: Optional[str]
    category: str
    predicted_expiry_days: float
    alert_level: str           # CRITICAL / WARNING / SAFE
    suggested_action: str      # PRIORITY DELIVERY / CHARITY / DISCARD / MONITOR
    potential_waste_cost_inr: Optional[float]
    recoverable_revenue_inr: Optional[float]
    net_saving_inr: Optional[float]


class BatchListPrediction(BaseModel):
    """Response for multiple batch predictions"""
    total_batches: int
    predictions: List[BatchPrediction]


class DashboardSummary(BaseModel):
    """Homepage dashboard summary"""
    total_batches: int
    critical_batches: int
    warning_batches: int
    safe_batches: int
    total_potential_loss_inr: float
    total_recoverable_inr: float
    total_net_saving_inr: float
    total_charity_value_inr: float
    ethical_score: float
    charity_batches: int
    discard_batches: int


class RankedBatch(BaseModel):
    """Single batch in ranked list"""
    rank: int
    product_name: str
    category: str
    predicted_expiry_days: float
    actual_expiry_days: Optional[float]
    alert_level: str
    suggested_action: str
    initial_quantity: int
    potential_waste_cost_inr: float
    recoverable_revenue_inr: float
    net_saving_inr: float


class RankedBatchList(BaseModel):
    """Ranked batch list response"""
    total: int
    batches: List[RankedBatch]
