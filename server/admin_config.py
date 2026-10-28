"""Admin ro‘yxati va yordamchi funksiyalar."""

import os

DEFAULT_ADMINS = ""


def admin_usernames() -> frozenset[str]:
    raw = os.getenv("ADMIN_USERNAMES", DEFAULT_ADMINS)
    return frozenset(u.strip().lower() for u in raw.split(",") if u.strip())


def is_admin(username: str) -> bool:
    return username.strip().lower() in admin_usernames()


def count_words(text: str) -> int:
    return len([w for w in text.strip().split() if w])
