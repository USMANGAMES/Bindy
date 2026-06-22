"""Gemma4 (Alem AI) — faqat bin yoki katta musor to‘plami."""

import base64
import json
import logging
import os
import re
import time
from typing import Any

import httpx

from points import BIN_SIZE_LABELS, calc_bin_points, calc_trash_points

log = logging.getLogger("bindy.ai")

GEMMA_API_URL = os.getenv("GEMMA_API_URL", "https://llm.alem.ai/v1/chat/completions")
GEMMA_API_KEY = os.getenv("GEMMA_API_KEY", "")
GEMMA_MODEL = os.getenv("GEMMA_MODEL", "gemma4")
MIN_CONFIDENCE = int(os.getenv("GEMMA_MIN_CONFIDENCE", "78"))

TYPES = ("plastic", "glass", "paper", "mixed", "organic")
MATERIAL_LABELS = {
    "plastic": "Plastic & PET",
    "glass": "Glass",
    "paper": "Paper & Cardboard",
    "mixed": "Mixed Recycling",
    "organic": "Organic Waste",
}

VALID_BIN_SIZES = frozenset({"street", "wheel", "large"})
MASSIVE_TRASH = frozenset({"massive", "large", "dump", "pile", "big", "huge"})
OUTDOOR_LOCATIONS = frozenset({"outdoor", "public", "street", "outside", "park", "sidewalk"})

# Ofis/uy ichidagi qutilar — rad etish
INDOOR_BIN_KEYWORDS = (
    "office",
    "indoor",
    "inside",
    "room",
    "desk",
    "wastebasket",
    "waste basket",
    "wire mesh",
    "wire-mesh",
    "mesh bin",
    "mesh basket",
    "bathroom",
    "kitchen",
    "household",
    "home bin",
    "bedroom",
    "toilet",
    "under desk",
    "small indoor",
    "plastic liner",
    "office bin",
    "ofis",
    "ichki",
)

INVALID_BIN_TYPES = frozenset(
    {
        "office",
        "indoor",
        "desk",
        "household",
        "home",
        "bathroom",
        "kitchen",
        "wire_mesh",
        "wire-mesh",
        "mesh",
        "wastebasket",
    }
)

PROMPT = """Strict classifier for Bindy eco app (Uzbekistan). ONLY outdoor/public waste infrastructure counts.

ACCEPT only:

A) category="bin" AND binLocation="outdoor" — public/outdoor waste container. Set binSize:
   - "street" = public roadside bin, pole-mounted bin, park litter bin (COMMON)
   - "wheel" = outdoor wheelie bin with wheels on street/yard (MEDIUM)
   - "large" = outdoor dumpster, skip, industrial container (RARE)

B) category="trash" AND trashScale="massive" — ONLY massive outdoor illegal litter dumps.
   NOT single items. Must be large pile/mess.

ALWAYS REJECT (valid=false) — do NOT count these as bins:
- indoor office wastebaskets (wire mesh + plastic liner on office floor)
- desk bins, bathroom bins, kitchen bins, household/home bins
- any bin clearly inside a room, office, building interior
- small mesh baskets used indoors

REJECT also: person, selfie, car, food, phone, blurry, single litter piece.

When unsure or indoor → valid=false, binLocation="indoor".

JSON only (no markdown):
{"valid":true|false,"category":"bin"|"trash"|"none","binLocation":"outdoor"|"indoor"|"none","binSize":"street"|"wheel"|"large"|"none","binType":"outdoor"|"office"|"indoor"|"none","trashScale":"massive"|"none","type":"plastic"|"glass"|"paper"|"mixed"|"organic"|"none","confidence":0-100,"label":"short English","reason":"brief"}"""


def is_gemma_configured() -> bool:
    return bool(GEMMA_API_KEY.strip())


def ai_status() -> dict:
    return {
        "configured": is_gemma_configured(),
        "provider": "alem.ai",
        "model": GEMMA_MODEL,
        "endpoint": GEMMA_API_URL,
        "minConfidence": MIN_CONFIDENCE,
    }


def _mime(content_type: str | None) -> str:
    if content_type and content_type.startswith("image/"):
        return content_type.split(";")[0].strip()
    return "image/jpeg"


def _extract_text(data: dict[str, Any]) -> str:
    choice = (data.get("choices") or [{}])[0]
    message = choice.get("message") or {}
    content = message.get("content", "")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(str(block.get("text", "")))
        return "\n".join(parts)
    return str(content)


def _parse_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\s*", "", text)
        text = re.sub(r"\s*```$", "", text)

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{.*\}", text, re.DOTALL)
    if not match:
        return None
    try:
        return json.loads(match.group())
    except json.JSONDecodeError:
        return None


def _as_bool(value: Any) -> bool | None:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("true", "yes", "1"):
            return True
        if lowered in ("false", "no", "0"):
            return False
    return None


def _looks_indoor_bin(raw: dict[str, Any]) -> bool:
    location = str(raw.get("binLocation", "")).lower().strip()
    if location == "indoor":
        return True
    if location and location not in OUTDOOR_LOCATIONS and location != "none":
        if location in ("indoor", "inside", "interior", "room", "office"):
            return True

    bin_type = str(raw.get("binType", "")).lower().strip()
    if bin_type in INVALID_BIN_TYPES:
        return True

    combined = " ".join(
        str(raw.get(k, "")) for k in ("label", "reason", "binType", "binLocation")
    ).lower()
    return any(kw in combined for kw in INDOOR_BIN_KEYWORDS)


INVALID_CATEGORIES = frozenset(
    {
        "none",
        "invalid",
        "other",
        "unknown",
        "na",
        "n/a",
        "not_applicable",
        "unrelated",
        "reject",
        "rejected",
        "single",
        "small",
        "tiny",
    }
)


def _validate(raw: dict[str, Any]) -> tuple[dict[str, str | int] | None, str | None]:
    valid = _as_bool(raw.get("valid"))
    if valid is False:
        reason = str(raw.get("reason", "")).strip() or "Rasmda quti yoki musor aniqlanmadi"
        log.warning("AI rad etdi (valid=false): %s", reason)
        return None, reason

    category = str(raw.get("category", "")).lower().strip()
    if category in INVALID_CATEGORIES or not category:
        reason = str(raw.get("reason", "")).strip() or "Bu rasm bin yoki musor emas"
        log.warning("AI rad etdi (category=%s): %s", category, reason)
        return None, reason

    if category not in ("bin", "trash"):
        reason = str(raw.get("reason", "")).strip() or f"Noto'g'ri kategoriya: {category}"
        log.warning("AI rad etdi: %s", reason)
        return None, reason

    try:
        confidence = int(raw.get("confidence", 0))
    except (TypeError, ValueError):
        confidence = 0

    if confidence < MIN_CONFIDENCE:
        reason = f"Ishonch past ({confidence}% < {MIN_CONFIDENCE}%)"
        log.warning("AI rad etdi: %s", reason)
        return None, reason

    type_ = str(raw.get("type", "mixed")).lower().strip()
    if type_ in INVALID_CATEGORIES or type_ == "none":
        type_ = "mixed"
    if type_ not in TYPES:
        type_ = "mixed"

    if category == "trash":
        trash_scale = str(raw.get("trashScale", "")).lower().strip()
        if trash_scale not in MASSIVE_TRASH:
            reason = "Faqat katta miqdordagi musor qabul qilinadi (1 ta parcha emas)"
            log.warning("AI rad etdi (trashScale=%s): %s", trash_scale, reason)
            return None, reason

        return (
            {
                "category": "trash",
                "type": type_,
                "confidence": min(99, confidence),
                "label": "Noqonuniy musor to‘plami",
                "points": calc_trash_points(),
            },
            None,
        )

    # bin — faqat tashqi (outdoor) qutilar
    if _looks_indoor_bin(raw):
        reason = "Ichki/ofis qutilari hisobga olinmaydi — faqat ko‘cha qutisi, konteyner"
        log.warning("AI rad etdi (indoor bin): %s", raw.get("reason", ""))
        return None, reason

    bin_location = str(raw.get("binLocation", "")).lower().strip()
    if bin_location and bin_location not in OUTDOOR_LOCATIONS and bin_location != "none":
        reason = "Faqat tashqi (ko‘cha) qutilar qabul qilinadi"
        log.warning("AI rad etdi (binLocation=%s)", bin_location)
        return None, reason

    bin_size = str(raw.get("binSize", "")).lower().strip()
    if bin_size not in VALID_BIN_SIZES:
        # AI ko‘cha qutisi deb belgilamagan bo‘lsa — eng past ball
        bin_size = "street"
        log.info("binSize aniqlanmadi, street deb qabul qilindi")

    size_label = BIN_SIZE_LABELS.get(bin_size, "Quti")
    material = MATERIAL_LABELS.get(type_, "Mixed Recycling")
    points = calc_bin_points(bin_size, confidence)

    return (
        {
            "category": "bin",
            "type": type_,
            "binSize": bin_size,
            "confidence": min(99, confidence),
            "label": f"{size_label} — {material}",
            "points": points,
        },
        None,
    )


def analyze_image(
    image_bytes: bytes, content_type: str | None = None
) -> tuple[dict[str, str | int] | None, str | None]:
    if not is_gemma_configured():
        log.error("GEMMA_API_KEY yo'q — server/.env ni tekshiring")
        return None, "AI sozlanmagan"

    size_kb = len(image_bytes) / 1024
    mime = _mime(content_type)
    log.info("Rasm qabul qilindi: %.1f KB, format=%s", size_kb, mime)

    if len(image_bytes) < 1000:
        log.warning("Rasm juda kichik (<1KB)")
        return None, "Rasm juda kichik"

    b64 = base64.b64encode(image_bytes).decode("ascii")
    payload = {
        "model": GEMMA_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}"},
                    },
                ],
            }
        ],
        "max_tokens": 320,
        "temperature": 0.0,
    }

    log.info("Alem Gemma4 ga yuborilmoqda... model=%s", GEMMA_MODEL)
    started = time.perf_counter()

    try:
        with httpx.Client(timeout=90.0) as client:
            response = client.post(
                GEMMA_API_URL,
                headers={
                    "Authorization": f"Bearer {GEMMA_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            elapsed = time.perf_counter() - started
            log.info("Alem javob: HTTP %s (%.1fs)", response.status_code, elapsed)

            if response.status_code != 200:
                log.error("Alem xato body: %s", response.text[:300])
                response.raise_for_status()

            data = response.json()
    except Exception as exc:
        elapsed = time.perf_counter() - started
        log.error("Alem API xato (%.1fs): %s", elapsed, exc)
        return None, "Gemma serveriga ulanib bo'lmadi"

    text = _extract_text(data)
    log.info("Gemma javob: %s", text[:350] + ("..." if len(text) > 350 else ""))

    parsed = _parse_json(text)
    if not parsed:
        log.error("JSON parse xato")
        return None, "AI javobini tushunib bo'lmadi"

    result, reject_reason = _validate(parsed)
    if not result:
        return None, reject_reason

    log.info(
        "QABUL: %s | points=%s | %s",
        result.get("binSize") or result["category"],
        result["points"],
        result["label"],
    )
    return result, None
