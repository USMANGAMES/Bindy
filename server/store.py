from typing import Optional
import db
from admin_config import count_words


def list_reports() -> list:
    return db.list_reports(500)


def add_report(payload: dict) -> dict:
    return db.add_report(payload)


def get_report(report_id: str) -> Optional[dict]:
    return db.get_report(report_id)


def delete_report(report_id: str) -> Optional[dict]:
    return db.delete_report(report_id)


def ensure_user(username: str) -> dict:
    uname = username.strip()
    u = db.get_user_by_username(uname)
    if not u:
        # For legacy compatibility, auto-create stub if needed
        u = db.create_user(uname, "")
    return db.get_user_profile(uname)


def _add_user_points(username: str, delta: int, reports_delta: int = 0) -> dict:
    db.add_user_points(username, delta, reports_delta)
    return db.get_user_profile(username)


def get_user_stats(username: str) -> dict:
    return db.get_user_profile(username)


def sync_user_profile(username: str, payload: dict) -> dict:
    return db.sync_user_profile(username, payload)


def redeem_product(username: str, product_id: str, cost: int, code: Optional[str] = None) -> dict:
    return db.redeem_product(username, product_id, cost, code)


def list_leaderboard(limit: int = 10) -> dict:
    return db.list_leaderboard(limit)


def list_notifications(username: str) -> list:
    return db.list_notifications(username)


def add_notification(username: str, payload: dict) -> dict:
    return db.add_notification(
        username=username,
        n_type=payload.get("type", "admin_warning"),
        title=payload.get("title", ""),
        body=payload.get("body", ""),
    )


def mark_notifications_read(username: str) -> None:
    db.mark_notifications_read(username)


def admin_delete_report(
    report_id: str,
    admin_user: str,
    reason: str,
) -> tuple[Optional[dict], Optional[str]]:
    if count_words(reason) < 5:
        return None, "Sabab kamida 5 ta so‘z bo‘lishi kerak"

    report = db.get_report(report_id)
    if not report:
        return None, "Report topilmadi"

    deleted = db.delete_report(report_id)
    if not deleted:
        return None, "O‘chirib bo‘lmadi"

    owner = deleted.get("userName", "").strip()
    points = int(deleted.get("points", 0))
    category = deleted.get("category", "bin")
    label = deleted.get("label", "Report")

    if owner:
        db.add_user_points(owner, -points, -1)
        cat_uz = "chiqindi nuqtasi" if category == "trash" else "qayta ishlash qutisi"
        db.add_notification(
            username=owner,
            n_type="report_deleted",
            title="Hisobotingiz moderator tomonidan o‘chirildi",
            body=(
                f"Siz qo‘shgan «{label}» ({cat_uz}) admin tomonidan olib tashlandi. "
                f"Berilgan {points} ball qaytarib olindi. "
                f"Sabab: «{reason.strip()}»"
            ),
        )

    return deleted, None


def list_hidden_ids() -> list[str]:
    return db.list_hidden_ids()


def hide_map_item(item_id: str, admin_user: str, reason: str) -> None:
    db.hide_item(item_id, admin_user, reason)


def get_global_stats() -> dict:
    return db.get_global_stats()


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
