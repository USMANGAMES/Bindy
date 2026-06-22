"""Eco ball — nadirlik bo‘yicha."""

import random
from typing import Literal

BinSize = Literal["street", "wheel", "large"]

BIN_SIZE_RANGE: dict[str, tuple[int, int]] = {
    "street": (3, 4),   # oddiy ko‘cha qutisi
    "wheel": (4, 5),    # g‘ildirakli (wheelie)
    "large": (5, 6),    # katta konteyner / dumpster
}

TRASH_POINTS = 8

BIN_SIZE_LABELS = {
    "street": "Ko‘cha qutisi",
    "wheel": "G‘ildirakli konteyner",
    "large": "Katta konteyner",
}


def calc_bin_points(bin_size: str, confidence: int) -> int:
    lo, hi = BIN_SIZE_RANGE.get(bin_size, BIN_SIZE_RANGE["street"])
    # Yuqori ishonch → diapazondagi yuqori ball (topish qiyinroq = ko‘proq)
    if confidence >= 92:
        return hi
    if confidence >= 85:
        return hi if hi > lo else lo
    if confidence >= 78:
        return lo + 1 if hi > lo else lo
    return lo


def calc_trash_points() -> int:
    return TRASH_POINTS


def roll_points(bin_size: str) -> int:
    """Mock/test uchun tasodifiy diapazon ichida."""
    lo, hi = BIN_SIZE_RANGE.get(bin_size, BIN_SIZE_RANGE["street"])
    return random.randint(lo, hi)
