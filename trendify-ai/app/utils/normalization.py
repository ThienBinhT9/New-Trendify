"""
Normalization and scoring utilities.
"""

import numpy as np


def min_max_normalize(values: np.ndarray) -> np.ndarray:
    """Normalize values to [0, 1] range using min-max scaling."""
    if len(values) == 0:
        return values
    v_min = values.min()
    v_max = values.max()
    if v_max == v_min:
        return np.zeros_like(values, dtype=float)
    return (values - v_min) / (v_max - v_min)


def safe_divide(a: float, b: float, default: float = 0.0) -> float:
    """Safe division avoiding ZeroDivisionError."""
    return a / b if b != 0 else default


def time_decay(age_hours: float, half_life_hours: float = 72.0) -> float:
    """
    Exponential time decay factor.
    Returns value in (0, 1] — newer items get higher scores.
    half_life_hours: after this many hours, score drops to 50%.
    """
    return float(np.exp(-0.693 * age_hours / half_life_hours))
