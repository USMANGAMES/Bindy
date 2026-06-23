import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from seed_bins import SEED_BIN_IDS

DATA_DIR = Path(__file__).parent / "data"
REPORTS_FILE = DATA_DIR / "reports.json"
USERS_FILE = DATA_DIR / "users.json"
NOTIFICATIONS_FILE = DATA_DIR / "notifications.json"
HIDDEN_FILE = DATA_DIR / "hidden_items.json"


def _read(path: Path, default):
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return default


def _write(path: Path, data) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ── Reports ──────────────────────────────────────────────────


def list_reports() -> list:
    reports = _read(REPORTS_FILE, [])
    return sorted(reports, key=lambda r: r.get("createdAt", ""), reverse=True)[:500]


def add_report(payload: dict) -> dict:
    report = {"id": str(uuid.uuid4()), "createdAt": _now(), **payload}
    reports = _read(REPORTS_FILE, [])
    reports.insert(0, report)
    _write(REPORTS_FILE, reports)

    username = payload.get("userName", "").strip()
    points = int(payload.get("points", 0))
    if username:
        _add_user_points(username, points, 1)
    return report


def get_report(report_id: str) -> dict | None:
    for r in _read(REPORTS_FILE, []):
        if r.get("id") == report_id:
            return r
    return None


def delete_report(report_id: str) -> dict | None:
    reports = _read(REPORTS_FILE, [])
    target = next((r for r in reports if r.get("id") == report_id), None)
    if not target:
        return None
    reports = [r for r in reports if r.get("id") != report_id]
    _write(REPORTS_FILE, reports)
    return target


# ── Users ────────────────────────────────────────────────────


def _load_users() -> dict:
    return _read(USERS_FILE, {})


def _save_users(users: dict) -> None:
    _write(USERS_FILE, users)


def ensure_user(username: str) -> dict:
    users = _load_users()
    key = username.strip()
    if key not in users:
        users[key] = {
            "username": key,
            "points": 0,
            "reports": 0,
            "binsReported": 0,
            "streak": 0,
            "submissions": [],
            "redeemedCoupons": [],
            "createdAt": _now(),
            "updatedAt": _now(),
        }
        _save_users(users)
    return users[key]


def _add_user_points(username: str, delta: int, reports_delta: int = 0) -> dict:
    users = _load_users()
    key = username.strip()
    user = users.get(key) or ensure_user(key)
    user["points"] = max(0, int(user.get("points", 0)) + delta)
    user["reports"] = max(0, int(user.get("reports", 0)) + reports_delta)
    user["binsReported"] = user["reports"]
    user["updatedAt"] = _now()
    users[key] = user
    _save_users(users)
    return user


def get_user_stats(username: str) -> dict:
    return ensure_user(username)


def sync_user_profile(username: str, payload: dict) -> dict:
    """To‘liq profil — ball, submission, kuponlar. Serverda saqlanadi."""
    users = _load_users()
    key = username.strip()
    user = ensure_user(key)

    if payload.get("points") is not None:
        user["points"] = max(int(user.get("points", 0)), int(payload["points"]))

    if payload.get("binsReported") is not None:
        user["binsReported"] = max(int(user.get("binsReported", 0)), int(payload["binsReported"]))
        user["reports"] = user["binsReported"]

    if payload.get("streak") is not None:
        user["streak"] = max(int(user.get("streak", 0)), int(payload["streak"]))

    if payload.get("submissions") is not None:
        existing = {s.get("id"): s for s in user.get("submissions", []) if s.get("id")}
        for s in payload["submissions"]:
            sid = s.get("id")
            if sid:
                existing[sid] = s
        merged = sorted(existing.values(), key=lambda x: x.get("createdAt", ""), reverse=True)
        user["submissions"] = merged[:100]

    if payload.get("redeemedCoupons") is not None:
        existing = {c.get("productId"): c for c in user.get("redeemedCoupons", []) if c.get("productId")}
        for c in payload["redeemedCoupons"]:
            pid = c.get("productId")
            if pid:
                existing[pid] = c
        user["redeemedCoupons"] = list(existing.values())

    user["updatedAt"] = _now()
    users[key] = user
    _save_users(users)
    return user


def list_leaderboard(limit: int = 10) -> dict:
    users = list(_load_users().values())
    users.sort(key=lambda u: int(u.get("points", 0)), reverse=True)
    top = users[:limit]
    return {"totalUsers": len(users), "top": top}


# ── Notifications ────────────────────────────────────────────


def _load_notifications() -> dict:
    return _read(NOTIFICATIONS_FILE, {})


def _save_notifications(data: dict) -> None:
    _write(NOTIFICATIONS_FILE, data)


def list_notifications(username: str) -> list:
    all_n = _load_notifications()
    items = all_n.get(username.strip(), [])
    return sorted(items, key=lambda n: n.get("createdAt", ""), reverse=True)


def add_notification(username: str, payload: dict) -> dict:
    key = username.strip()
    all_n = _load_notifications()
    note = {"id": str(uuid.uuid4()), "createdAt": _now(), "read": False, **payload}
    all_n.setdefault(key, [])
    all_n[key].insert(0, note)
    _write(NOTIFICATIONS_FILE, all_n)
    return note


def mark_notifications_read(username: str) -> None:
    key = username.strip()
    all_n = _load_notifications()
    if key not in all_n:
        return
    for n in all_n[key]:
        n["read"] = True
    _save_notifications(all_n)


def admin_delete_report(
    report_id: str,
    admin_user: str,
    reason: str,
) -> tuple[dict | None, str | None]:
    from admin_config import count_words

    if count_words(reason) < 5:
        return None, "Sabab kamida 5 ta so‘z bo‘lishi kerak"

    report = get_report(report_id)
    if not report:
        return None, "Report topilmadi"

    deleted = delete_report(report_id)
    if not deleted:
        return None, "O‘chirib bo‘lmadi"

    owner = deleted.get("userName", "").strip()
    points = int(deleted.get("points", 0))
    category = deleted.get("category", "bin")
    label = deleted.get("label", "Report")

    if owner:
        _add_user_points(owner, -points, -1)
        add_notification(
            owner,
            {
                "type": "report_deleted",
                "title": "Report o‘chirildi",
                "message": f"Admin {admin_user} sizning {category} reportingizni o‘chirdi.",
                "reason": reason.strip(),
                "pointsDelta": -points,
                "reportLabel": label,
                "category": category,
                "adminUser": admin_user,
            },
        )

    return deleted, None


# ── Hidden map items (seed bins va boshqalar) ────────────────


def list_hidden_ids() -> list[str]:
    data = _read(HIDDEN_FILE, {"ids": []})
    return list(data.get("ids", []))


def hide_map_item(item_id: str, admin_user: str, reason: str) -> None:
    data = _read(HIDDEN_FILE, {"ids": [], "log": []})
    ids = data.setdefault("ids", [])
    if item_id not in ids:
        ids.append(item_id)
    data.setdefault("log", []).insert(
        0,
        {
            "id": item_id,
            "adminUser": admin_user,
            "reason": reason.strip(),
            "at": _now(),
        },
    )
    _write(HIDDEN_FILE, data)


def get_global_stats() -> dict:
    reports = _read(REPORTS_FILE, [])
    hidden = set(list_hidden_ids())
    visible = [r for r in reports if r.get("id") not in hidden]
    community_bins = sum(1 for r in visible if r.get("category") == "bin")
    trash_reports = sum(1 for r in visible if r.get("category") == "trash")
    seed_visible = sum(1 for i in SEED_BIN_IDS if i not in hidden)
    users = _load_users()
    return {
        "totalBins": seed_visible + community_bins,
        "seedBins": seed_visible,
        "communityBins": community_bins,
        "trashReports": trash_reports,
        "totalReports": len(visible),
        "totalUsers": len(users),
    }


def build_snapshot(username: str = "") -> dict:
    key = username.strip()
    profile = get_user_stats(key) if key else None
    return {
        "stats": get_global_stats(),
        "reports": list_reports(),
        "hiddenIds": list_hidden_ids(),
        "leaderboard": list_leaderboard(10),
        "notifications": list_notifications(key) if key else [],
        "userProfile": profile,
    }
