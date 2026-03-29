"""
alerts.py — Alert classification + savings calculation
Same logic as Step 3 notebook
"""

USD_TO_INR = 1

# Categories too perishable to donate at last minute
HIGH_PERISHABLE_CATS = ['Seafood', 'Meat', 'Ready_to_Eat']


def classify_alert(days: float) -> str:
    """Classify batch into alert level based on predicted expiry days"""
    if days <= 2:
        return 'CRITICAL'
    elif days <= 7:
        return 'WARNING'
    else:
        return 'SAFE'


def suggest_action(days: float, category: str) -> str:
    """Suggest action based on expiry days and category"""
    if days <= 1:
        if category in HIGH_PERISHABLE_CATS:
            return 'DISCARD'
        else:
            return 'CHARITY'
    elif days <= 2:
        return 'CHARITY'
    elif days <= 7:
        return 'PRIORITY DELIVERY'
    else:
        return 'MONITOR'


def calculate_savings(
    initial_quantity: int,
    cost_price: float,
    base_price: float
) -> dict:
    """
    Calculate savings in INR for an at-risk batch

    Returns:
        potential_waste_cost_inr  → loss if batch spoils
        recoverable_revenue_inr   → revenue if sold at 30% markdown
        charity_value_inr         → value if donated
        net_saving_inr            → recoverable - potential loss
    """
    potential_waste_cost_inr = initial_quantity * cost_price * USD_TO_INR
    recoverable_revenue_inr  = initial_quantity * base_price * 0.7 * USD_TO_INR
    charity_value_inr        = initial_quantity * cost_price * USD_TO_INR
    net_saving_inr           = recoverable_revenue_inr - potential_waste_cost_inr

    return {
        'potential_waste_cost_inr': round(potential_waste_cost_inr, 2),
        'recoverable_revenue_inr':  round(recoverable_revenue_inr, 2),
        'charity_value_inr':        round(charity_value_inr, 2),
        'net_saving_inr':           round(net_saving_inr, 2),
    }
