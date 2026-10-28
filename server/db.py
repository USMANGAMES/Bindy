import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

DATA_DIR = Path(__file__).parent / "data"
DB_PATH = DATA_DIR / "bindy.db"


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_db() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    con = sqlite3.connect(str(DB_PATH), timeout=15.0)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA journal_mode = WAL;")
    con.execute("PRAGMA synchronous = NORMAL;")
    con.execute("PRAGMA foreign_keys = ON;")
    return con


def init_db() -> None:
    con = get_db()
    with con:
        con.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                expires_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS profiles (
                user_id INTEGER PRIMARY KEY,
                username TEXT NOT NULL UNIQUE COLLATE NOCASE,
                points INTEGER NOT NULL DEFAULT 0,
                bins_reported INTEGER NOT NULL DEFAULT 0,
                streak INTEGER NOT NULL DEFAULT 0,
                submissions_json TEXT NOT NULL DEFAULT '[]',
                coupons_json TEXT NOT NULL DEFAULT '[]',
                updated_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                username TEXT NOT NULL COLLATE NOCASE,
                lat REAL NOT NULL,
                lng REAL NOT NULL,
                category TEXT NOT NULL,
                type TEXT NOT NULL,
                label TEXT NOT NULL,
                photo_url TEXT,
                points INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            );

            CREATE TABLE IF NOT EXISTS hidden_items (
                item_id TEXT PRIMARY KEY,
                admin_user TEXT NOT NULL,
                reason TEXT NOT NULL,
                hidden_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL COLLATE NOCASE,
                type TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_reports_username ON reports(username);
            CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);
            CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(username, read);
        """)
    con.close()


# ── Users & Auth ──────────────────────────────────────────────


def create_user(username: str, password_hash: str) -> dict:
    uname = username.strip()
    now_str = _now()
    con = get_db()
    with con:
        cur = con.execute(
            "INSERT INTO users (username, password_hash, created_at) VALUES (?, ?, ?)",
            (uname, password_hash, now_str),
        )
        user_id = cur.lastrowid
        con.execute(
            """INSERT INTO profiles (user_id, username, points, bins_reported, streak, submissions_json, coupons_json, updated_at)
               VALUES (?, ?, 0, 0, 0, '[]', '[]', ?)""",
            (user_id, uname, now_str),
        )
    con.close()
    return {"id": user_id, "username": uname, "createdAt": now_str}


def get_user_by_username(username: str) -> Optional[dict]:
    con = get_db()
    row = con.execute(
        "SELECT id, username, password_hash, created_at FROM users WHERE username = ?",
        (username.strip(),),
    ).fetchone()
    con.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "username": row["username"],
        "password_hash": row["password_hash"],
        "created_at": row["created_at"],
    }


def get_user_by_id(user_id: int) -> Optional[dict]:
    con = get_db()
    row = con.execute(
        "SELECT id, username, created_at FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    con.close()
    if not row:
        return None
    return {"id": row["id"], "username": row["username"], "created_at": row["created_at"]}


def create_session(token: str, user_id: int, expires_at: str) -> None:
    con = get_db()
    with con:
        con.execute(
            "INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, _now(), expires_at),
        )
    con.close()


def get_session(token: str) -> Optional[dict]:
    con = get_db()
    row = con.execute(
        """SELECT s.token, s.user_id, s.expires_at, u.username
           FROM sessions s
           JOIN users u ON s.user_id = u.id
           WHERE s.token = ?""",
        (token,),
    ).fetchone()
    con.close()
    if not row:
        return None
    return {
        "token": row["token"],
        "user_id": row["user_id"],
        "username": row["username"],
        "expires_at": row["expires_at"],
    }


def delete_session(token: str) -> None:
    con = get_db()
    with con:
        con.execute("DELETE FROM sessions WHERE token = ?", (token,))
    con.close()


# ── Profiles ──────────────────────────────────────────────────


def get_user_profile(username: str) -> dict:
    uname = username.strip()
    con = get_db()
    row = con.execute(
        """SELECT user_id, username, points, bins_reported, streak, submissions_json, coupons_json, updated_at
           FROM profiles WHERE username = ?""",
        (uname,),
    ).fetchone()
    con.close()
    if not row:
        return {
            "username": uname,
            "points": 0,
            "reports": 0,
            "binsReported": 0,
            "streak": 0,
            "submissions": [],
            "redeemedCoupons": [],
            "updatedAt": _now(),
        }
    try:
        submissions = json.loads(row["submissions_json"])
    except Exception:
        submissions = []
    try:
        coupons = json.loads(row["coupons_json"])
    except Exception:
        coupons = []

    return {
        "username": row["username"],
        "points": row["points"],
        "reports": row["bins_reported"],
        "binsReported": row["bins_reported"],
        "streak": row["streak"],
        "submissions": submissions,
        "redeemedCoupons": coupons,
        "updatedAt": row["updated_at"],
    }


def sync_user_profile(username: str, data: dict) -> dict:
    uname = username.strip()
    con = get_db()
    row = con.execute("SELECT id FROM users WHERE username = ?", (uname,)).fetchone()
    user_id = row["id"] if row else None

    # Load current
    cur_profile = get_user_profile(uname)
    points = max(cur_profile["points"], int(data["points"])) if data.get("points") is not None else cur_profile["points"]
    bins_reported = max(cur_profile["binsReported"], int(data["binsReported"])) if data.get("binsReported") is not None else cur_profile["binsReported"]
    streak = max(cur_profile["streak"], int(data["streak"])) if data.get("streak") is not None else cur_profile["streak"]

    subs = data.get("submissions") if data.get("submissions") is not None else cur_profile["submissions"]
    coupons = data.get("redeemedCoupons") if data.get("redeemedCoupons") is not None else cur_profile["redeemedCoupons"]

    subs_json = json.dumps(subs[:50], ensure_ascii=False)
    coupons_json = json.dumps(coupons, ensure_ascii=False)
    now_str = _now()

    with con:
        con.execute(
            """INSERT INTO profiles (user_id, username, points, bins_reported, streak, submissions_json, coupons_json, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(username) DO UPDATE SET
                   points = excluded.points,
                   bins_reported = excluded.bins_reported,
                   streak = excluded.streak,
                   submissions_json = excluded.submissions_json,
                   coupons_json = excluded.coupons_json,
                   updated_at = excluded.updated_at""",
            (user_id, uname, points, bins_reported, streak, subs_json, coupons_json, now_str),
        )
    con.close()
    return get_user_profile(uname)


def add_user_points(username: str, delta_points: int, delta_reports: int = 1) -> None:
    uname = username.strip()
    con = get_db()
    with con:
        con.execute(
            """UPDATE profiles
               SET points = MAX(0, points + ?),
                   bins_reported = MAX(0, bins_reported + ?),
                   updated_at = ?
               WHERE username = ?""",
            (delta_points, delta_reports, _now(), uname),
        )
    con.close()


# ── Reports ───────────────────────────────────────────────────


def list_reports(limit: int = 500) -> list:
    con = get_db()
    rows = con.execute(
        """SELECT id, user_id, username, lat, lng, category, type, label, photo_url, points, created_at
           FROM reports
           ORDER BY created_at DESC
           LIMIT ?""",
        (limit,),
    ).fetchall()
    con.close()

    reports = []
    for r in rows:
        reports.append({
            "id": r["id"],
            "userId": r["user_id"],
            "userName": r["username"],
            "lat": r["lat"],
            "lng": r["lng"],
            "category": r["category"],
            "type": r["type"],
            "label": r["label"],
            "photoUrl": r["photo_url"],
            "points": r["points"],
            "createdAt": r["created_at"],
        })
    return reports


def add_report(payload: dict) -> dict:
    report_id = payload.get("id") or str(uuid.uuid4())
    now_str = _now()
    username = payload.get("userName", "").strip()
    user_id = payload.get("userId")
    points = int(payload.get("points", 0))

    con = get_db()
    # Find user_id if not given
    if not user_id and username:
        u = con.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
        if u:
            user_id = u["id"]

    # ── Deduplication Checks ──────────────────────────────────
    # 1. By ID: if report already exists, return it directly without awarding points again
    existing = con.execute("SELECT id FROM reports WHERE id = ?", (report_id,)).fetchone()
    if existing:
        con.close()
        rep = get_report(report_id)
        return rep if rep else {"id": report_id}

    # 2. By Photo URL (if photo exists and was submitted by this user in last 10 minutes)
    photo_url = payload.get("photoUrl")
    if photo_url and username:
        dup = con.execute(
            """SELECT id FROM reports 
               WHERE username = ? AND photo_url = ? AND created_at >= datetime('now', '-10 minutes')""",
            (username, photo_url),
        ).fetchone()
        if dup:
            con.close()
            rep = get_report(dup["id"])
            return rep if rep else {"id": dup["id"]}

    # 3. By Exact Coordinates for same user within last 1 minute
    lat = float(payload["lat"])
    lng = float(payload["lng"])
    if username:
        dup_geo = con.execute(
            """SELECT id FROM reports 
               WHERE username = ? 
                 AND ABS(lat - ?) < 0.0001 
                 AND ABS(lng - ?) < 0.0001 
                 AND created_at >= datetime('now', '-1 minute')""",
            (username, lat, lng),
        ).fetchone()
        if dup_geo:
            con.close()
            rep = get_report(dup_geo["id"])
            return rep if rep else {"id": dup_geo["id"]}

    with con:
        con.execute(
            """INSERT INTO reports (id, user_id, username, lat, lng, category, type, label, photo_url, points, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                report_id,
                user_id,
                username,
                lat,
                lng,
                payload["category"],
                payload["type"],
                payload.get("label", ""),
                photo_url,
                points,
                now_str,
            ),
        )
    con.close()

    if username and points > 0:
        add_user_points(username, points, 1)

    return {
        "id": report_id,
        "userId": user_id,
        "userName": username,
        "lat": lat,
        "lng": lng,
        "category": payload["category"],
        "type": payload["type"],
        "label": payload.get("label", ""),
        "photoUrl": photo_url,
        "points": points,
        "createdAt": now_str,
    }


def get_report(report_id: str) -> Optional[dict]:
    con = get_db()
    row = con.execute(
        """SELECT id, user_id, username, lat, lng, category, type, label, photo_url, points, created_at
           FROM reports WHERE id = ?""",
        (report_id,),
    ).fetchone()
    con.close()
    if not row:
        return None
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "userName": row["username"],
        "lat": row["lat"],
        "lng": row["lng"],
        "category": row["category"],
        "type": row["type"],
        "label": row["label"],
        "photoUrl": row["photo_url"],
        "points": row["points"],
        "createdAt": row["created_at"],
    }


def delete_report(report_id: str) -> Optional[dict]:
    report = get_report(report_id)
    if not report:
        return None
    con = get_db()
    with con:
        con.execute("DELETE FROM reports WHERE id = ?", (report_id,))
    con.close()
    return report


# ── Notifications ─────────────────────────────────────────────


def list_notifications(username: str, limit: int = 50) -> list:
    con = get_db()
    rows = con.execute(
        """SELECT id, username, type, title, body, read, created_at
           FROM notifications
           WHERE username = ?
           ORDER BY created_at DESC
           LIMIT ?""",
        (username.strip(), limit),
    ).fetchall()
    con.close()

    return [
        {
            "id": r["id"],
            "username": r["username"],
            "type": r["type"],
            "title": r["title"],
            "body": r["body"],
            "read": bool(r["read"]),
            "createdAt": r["created_at"],
        }
        for r in rows
    ]


def add_notification(username: str, n_type: str, title: str, body: str) -> dict:
    nid = str(uuid.uuid4())
    now_str = _now()
    con = get_db()
    with con:
        con.execute(
            """INSERT INTO notifications (id, username, type, title, body, read, created_at)
               VALUES (?, ?, ?, ?, ?, 0, ?)""",
            (nid, username.strip(), n_type, title, body, now_str),
        )
    con.close()
    return {
        "id": nid,
        "username": username.strip(),
        "type": n_type,
        "title": title,
        "body": body,
        "read": False,
        "createdAt": now_str,
    }


def mark_notifications_read(username: str) -> None:
    con = get_db()
    with con:
        con.execute(
            "UPDATE notifications SET read = 1 WHERE username = ?",
            (username.strip(),),
        )
    con.close()


# ── Hidden Items ──────────────────────────────────────────────


def list_hidden_ids() -> list:
    con = get_db()
    rows = con.execute("SELECT item_id FROM hidden_items").fetchall()
    con.close()
    return [r["item_id"] for r in rows]


def hide_map_item(item_id: str, admin_user: str, reason: str) -> None:
    con = get_db()
    with con:
        con.execute(
            """INSERT OR REPLACE INTO hidden_items (item_id, admin_user, reason, hidden_at)
               VALUES (?, ?, ?, ?)""",
            (item_id.strip(), admin_user.strip(), reason.strip(), _now()),
        )
    con.close()


# ── Stats & Leaderboard ───────────────────────────────────────


def get_global_stats() -> dict:
    con = get_db()
    total_users = con.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
    total_reports = con.execute("SELECT COUNT(*) as c FROM reports").fetchone()["c"]
    community_bins = con.execute("SELECT COUNT(*) as c FROM reports WHERE category = 'bin'").fetchone()["c"]
    community_trash = con.execute("SELECT COUNT(*) as c FROM reports WHERE category = 'trash'").fetchone()["c"]
    hidden_count = con.execute("SELECT COUNT(*) as c FROM hidden_items").fetchone()["c"]
    con.close()

    return {
        "totalBins": community_bins,
        "seedBins": 0,
        "communityBins": community_bins,
        "communityTrash": community_trash,
        "hiddenSeedBins": hidden_count,
        "totalReports": total_reports,
        "totalUsers": total_users,
    }


def list_leaderboard(limit: int = 10) -> dict:
    con = get_db()
    rows = con.execute(
        """SELECT username, points, bins_reported
           FROM profiles
           WHERE points > 0 OR bins_reported > 0
           ORDER BY points DESC, bins_reported DESC
           LIMIT ?""",
        (limit,),
    ).fetchall()
    con.close()

    top = [
        {
            "rank": i + 1,
            "username": r["username"],
            "points": r["points"],
            "reports": r["bins_reported"],
        }
        for i, r in enumerate(rows)
    ]
    return {"top": top}
