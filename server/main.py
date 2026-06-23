import asyncio
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from admin_config import is_admin
from gemma import ai_status, analyze_image, is_gemma_configured
from realtime import broadcast, emit_stats, format_sse
from store import (
    add_report,
    admin_delete_report,
    build_snapshot,
    ensure_user,
    get_global_stats,
    get_user_stats,
    hide_map_item,
    list_hidden_ids,
    list_leaderboard,
    list_notifications,
    list_reports,
    mark_notifications_read,
    sync_user_profile,
)

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bindy")

app = FastAPI(title="Bindy API")

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    if request.url.path.endswith("/events/stream"):
        return await call_next(request)
    origin = request.headers.get("origin", "-")
    log.info(">>> %s %s  origin=%s", request.method, request.url.path, origin)
    response = await call_next(request)
    log.info("<<< %s %s -> %s", request.method, request.url.path, response.status_code)
    return response


@app.on_event("startup")
def startup():
    status = ai_status()
    if status["configured"]:
        log.info("Gemma4 AI YOQILGAN — model=%s, provider=%s", status["model"], status["provider"])
    else:
        log.warning("Gemma4 AI O'CHIQ — server/.env da GEMMA_API_KEY yo'q")
    log.info(
        "Ma'lumotlar yuklandi: %d report, %d yashirin, %d user",
        len(list_reports()),
        len(list_hidden_ids()),
        get_global_stats()["totalUsers"],
    )


class ReportBody(BaseModel):
    lat: float
    lng: float
    category: str
    type: str
    label: str
    photoUrl: str | None = None
    userName: str
    points: int


class DeleteReportBody(BaseModel):
    adminUser: str
    reason: str


class SyncUserBody(BaseModel):
    username: str
    points: int | None = None


class HideItemBody(BaseModel):
    itemId: str
    adminUser: str
    reason: str


class ProfileSyncBody(BaseModel):
    username: str
    points: int | None = None
    binsReported: int | None = None
    streak: int | None = None
    submissions: list | None = None
    redeemedCoupons: list | None = None


@app.get("/api/v1/ai/status")
def get_ai_status():
    return ai_status()


@app.get("/api/v1/stats/global")
def global_stats():
    return get_global_stats()


@app.get("/api/v1/events/stream")
async def events_stream(username: str = ""):
    async def generator():
        q = broadcast.register()
        try:
            yield format_sse("snapshot", build_snapshot(username))
            while True:
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=25.0)
                    event_type = msg["type"]
                    data = msg["data"]
                    if event_type == "notification.created":
                        if data.get("username", "") != username.strip():
                            continue
                    if event_type == "user.stats_updated":
                        if data.get("username", "") != username.strip():
                            continue
                    yield format_sse(event_type, data)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
        finally:
            broadcast.unregister(q)

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.get("/api/v1/admin/check")
def admin_check(user: str):
    return {"isAdmin": is_admin(user)}


@app.get("/api/v1/reports")
def get_reports():
    return {"reports": list_reports()}


@app.post("/api/v1/reports")
def create_report(body: ReportBody):
    ensure_user(body.userName)
    report = add_report(body.model_dump())
    log.info("Report saqlandi: %s (%s)", body.userName, body.category)
    broadcast.emit("report.created", {"report": report})
    emit_stats()
    broadcast.emit(
        "user.stats_updated",
        {"username": body.userName.strip(), "stats": get_user_stats(body.userName)},
    )
    return {"report": report}


@app.delete("/api/v1/reports/{report_id}")
def delete_report(report_id: str, body: DeleteReportBody):
    if not is_admin(body.adminUser):
        raise HTTPException(403, "Admin emas")
    deleted, err = admin_delete_report(report_id, body.adminUser, body.reason)
    if err:
        raise HTTPException(400, err)
    log.info("Admin %s report o‘chirdi: %s", body.adminUser, report_id)
    owner = (deleted or {}).get("userName", "").strip()
    broadcast.emit("report.deleted", {"id": report_id, "deleted": deleted})
    emit_stats()
    if owner:
        notifs = list_notifications(owner)
        if notifs:
            broadcast.emit(
                "notification.created",
                {"username": owner, "notification": notifs[0]},
            )
        broadcast.emit(
            "user.stats_updated",
            {"username": owner, "stats": get_user_stats(owner)},
        )
    return {"ok": True, "deleted": deleted}


@app.get("/api/v1/hidden-items")
def get_hidden_items():
    return {"ids": list_hidden_ids()}


@app.post("/api/v1/hidden-items")
def hide_item(body: HideItemBody):
    from admin_config import count_words

    if not is_admin(body.adminUser):
        raise HTTPException(403, "Admin emas")
    if count_words(body.reason) < 5:
        raise HTTPException(400, "Sabab kamida 5 ta so‘z bo‘lishi kerak")
    hide_map_item(body.itemId, body.adminUser, body.reason)
    log.info("Admin %s yashirdi: %s", body.adminUser, body.itemId)
    broadcast.emit("hidden_item.added", {"itemId": body.itemId})
    emit_stats()
    return {"ok": True}


@app.get("/api/v1/users/{username}/stats")
def user_stats(username: str):
    return get_user_stats(username)


@app.post("/api/v1/users/profile")
def sync_profile(body: ProfileSyncBody):
    profile = sync_user_profile(body.username, body.model_dump(exclude={"username"}))
    emit_stats()
    broadcast.emit(
        "user.profile_updated",
        {"username": body.username.strip(), "profile": profile},
    )
    return {"profile": profile}


@app.post("/api/v1/users/sync")
def sync_user(body: SyncUserBody):
    user = ensure_user(body.username)
    if body.points is not None and int(body.points) > int(user.get("points", 0)):
        user["points"] = int(body.points)
    broadcast.emit(
        "user.stats_updated",
        {"username": body.username.strip(), "stats": get_user_stats(body.username)},
    )
    emit_stats()
    return {"user": user}


@app.get("/api/v1/leaderboard")
def leaderboard():
    return list_leaderboard(10)


@app.get("/api/v1/notifications/{username}")
def notifications(username: str):
    return {"notifications": list_notifications(username)}


@app.post("/api/v1/notifications/{username}/read")
def read_notifications(username: str):
    mark_notifications_read(username)
    broadcast.emit("notifications.read", {"username": username.strip()})
    return {"ok": True}


@app.post("/api/v1/analyze")
async def analyze(image: UploadFile = File(...)):
    filename = image.filename or "photo.jpg"
    log.info("--- /api/v1/analyze: %s ---", filename)

    if not is_gemma_configured():
        return {"ok": False, "error": "AI sozlanmagan — server/.env da GEMMA_API_KEY qo'ying"}

    data = await image.read()
    if len(data) < 1000:
        return {"ok": False, "error": "Rasm juda kichik"}

    result, reject_reason = analyze_image(data, image.content_type)
    if not result:
        return {"ok": False, "error": reject_reason or "Gemma tahlil qila olmadi"}

    return {"ok": True, **result}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
