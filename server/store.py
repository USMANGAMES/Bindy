import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
REPORTS_FILE = DATA_DIR / "reports.json"


def _load_reports() -> list:
    if not REPORTS_FILE.exists():
        return []
    return json.loads(REPORTS_FILE.read_text(encoding="utf-8"))


def _save_reports(reports: list) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_FILE.write_text(json.dumps(reports, indent=2, ensure_ascii=False), encoding="utf-8")


def list_reports() -> list:
    return sorted(_load_reports(), key=lambda r: r.get("createdAt", ""), reverse=True)[:200]


def add_report(payload: dict) -> dict:
    report = {
        "id": str(uuid.uuid4()),
        "createdAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        **payload,
    }
    reports = _load_reports()
    reports.insert(0, report)
    _save_reports(reports)
    return report
