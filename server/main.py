import asyncio
import logging
import os
import uuid
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

import db
from admin_config import is_admin
from auth import (
    create_user_session,
    get_current_user,
    get_optional_user,
    hash_password,
    require_admin,
    verify_password,
)
from gemma import ai_status, analyze_image, is_gemma_configured
from points import calc_bin_points, calc_trash_points
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
    redeem_product,
    sync_user_profile,
)

load_dotenv(Path(__file__).parent / ".env", override=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bindy")

limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="Bindy API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,https://app.bindy.uz,http://app.bindy.uz",
)
cors_origins = [o.strip() for o in cors_origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
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


UPLOAD_DIR = Path(__file__).parent / "data" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup():
    db.init_db()
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


# ── Schemas ──────────────────────────────────────────────────


class AuthRegisterBody(BaseModel):
    username: str
    password: str


class AuthLoginBody(BaseModel):
    username: str
    password: str


class ReportBody(BaseModel):
    id: Optional[str] = None
    lat: float
    lng: float
    category: str
    type: str
    label: str
    photoUrl: Optional[str] = None
    userName: str
    points: int = 0

    @field_validator("lat")
    @classmethod
    def validate_lat(cls, v: float) -> float:
        if not (-90.0 <= v <= 90.0):
            raise ValueError("Latitude must be between -90 and 90")
        return v

    @field_validator("lng")
    @classmethod
    def validate_lng(cls, v: float) -> float:
        if not (-180.0 <= v <= 180.0):
            raise ValueError("Longitude must be between -180 and 180")
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in ("bin", "trash"):
            raise ValueError("Category must be 'bin' or 'trash'")
        return v

    @field_validator("userName")
    @classmethod
    def validate_username(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned or len(cleaned) > 50:
            raise ValueError("Username must be between 1 and 50 characters")
        return cleaned


class DeleteReportBody(BaseModel):
    reason: str


class SyncUserBody(BaseModel):
    username: str
    points: Optional[int] = None


class HideItemBody(BaseModel):
    itemId: str
    reason: str


class ProfileSyncBody(BaseModel):
    username: str
    points: Optional[int] = None
    binsReported: Optional[int] = None
    streak: Optional[int] = None
    submissions: Optional[list] = None
    redeemedCoupons: Optional[list] = None


class RedeemShopBody(BaseModel):
    productId: str
    cost: Optional[int] = None
    code: Optional[str] = None
    username: Optional[str] = None


SHOP_PRODUCT_COSTS: dict[str, int] = {
    "belissimo-15": 150,
    "dominos-20": 200,
    "kfc-10": 120,
    "cafe-25": 180,
    "evos-12": 100,
}


# ── Auth Endpoints ────────────────────────────────────────────


@app.post("/api/v1/auth/register")
@limiter.limit("10/minute")
def register(request: Request, body: AuthRegisterBody):
    uname = body.username.strip()
    if len(uname) < 3 or len(uname) > 30:
        raise HTTPException(400, "Username 3 tadan 30 tagacha belgi bo'lishi kerak")
    if len(body.password) < 4:
        raise HTTPException(400, "Parol kamida 4 ta belgi bo'lishi kerak")

    existing = db.get_user_by_username(uname)
    if existing:
        raise HTTPException(400, "Bu username band")

    p_hash = hash_password(body.password)
    user = db.create_user(uname, p_hash)
    token = create_user_session(user["id"])
    log.info("Yangi foydalanuvchi ro'yxatdan o'tdi: %s (id=%d)", uname, user["id"])
    return {
        "ok": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "isAdmin": is_admin(user["username"]),
        },
    }


@app.post("/api/v1/auth/login")
@limiter.limit("20/minute")
def login(request: Request, body: AuthLoginBody):
    uname = body.username.strip()
    user = db.get_user_by_username(uname)
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(400, "Username yoki parol noto'g'ri")

    token = create_user_session(user["id"])
    log.info("Foydalanuvchi kirdi: %s", uname)
    return {
        "ok": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "isAdmin": is_admin(user["username"]),
        },
    }


@app.get("/api/v1/auth/me")
def auth_me(current_user: dict = Depends(get_current_user)):
    profile = db.get_user_profile(current_user["username"])
    return {
        "ok": True,
        "user": current_user,
        "profile": profile,
    }


@app.post("/api/v1/auth/logout")
def logout(current_user: dict = Depends(get_current_user)):
    db.delete_session(current_user["token"])
    return {"ok": True}


# ── AI & Stats ────────────────────────────────────────────────


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
                    if event_type in ("notification.created", "user.stats_updated", "user.profile_updated"):
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


# ── Reports ───────────────────────────────────────────────────


@app.get("/api/v1/reports")
def get_reports():
    return {"reports": list_reports()}


@app.post("/api/v1/reports")
@limiter.limit("30/minute")
def create_report(
    request: Request,
    body: ReportBody,
    user: Optional[dict] = Depends(get_optional_user),
):
    username = user["username"] if user else body.userName
    ensure_user(username)

    if body.points > 0:
        points = body.points
    elif body.category == "trash":
        points = calc_trash_points()
    else:
        points = calc_bin_points("street", 85)

    payload = body.model_dump()
    payload["userName"] = username
    if user:
        payload["userId"] = user["id"]
    payload["points"] = points

    report = add_report(payload)
    log.info("Report saqlandi: %s (%s, %d ball)", username, body.category, points)
    broadcast.emit("report.created", {"report": report})
    emit_stats()
    user_stats = get_user_stats(username)
    broadcast.emit(
        "user.stats_updated",
        {"username": username.strip(), "stats": user_stats},
    )
    return {"report": report, "userStats": user_stats}


@app.delete("/api/v1/reports/{report_id}")
def delete_report(
    report_id: str,
    body: DeleteReportBody,
    admin: dict = Depends(require_admin),
):
    deleted, err = admin_delete_report(report_id, admin["username"], body.reason)
    if err:
        raise HTTPException(400, err)
    log.info("Admin %s report o‘chirdi: %s", admin["username"], report_id)
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
def hide_item(body: HideItemBody, admin: dict = Depends(require_admin)):
    from admin_config import count_words

    if count_words(body.reason) < 5:
        raise HTTPException(400, "Sabab kamida 5 ta so‘z bo‘lishi kerak")
    hide_map_item(body.itemId, admin["username"], body.reason)
    log.info("Admin %s yashirdi: %s", admin["username"], body.itemId)
    broadcast.emit("hidden_item.added", {"itemId": body.itemId})
    emit_stats()
    return {"ok": True}


# ── Users & Stats ─────────────────────────────────────────────


@app.get("/api/v1/users/{username}/stats")
def user_stats(username: str):
    return get_user_stats(username)


@app.post("/api/v1/users/profile")
def sync_profile(body: ProfileSyncBody, user: Optional[dict] = Depends(get_optional_user)):
    username = user["username"] if user else body.username
    profile = sync_user_profile(username, body.model_dump(exclude={"username"}))
    emit_stats()
    broadcast.emit(
        "user.profile_updated",
        {"username": username.strip(), "profile": profile},
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


@app.post("/api/v1/shop/redeem")
@limiter.limit("20/minute")
def redeem_shop_coupon(
    request: Request,
    body: RedeemShopBody,
    user: Optional[dict] = Depends(get_optional_user),
):
    uname = (user["username"] if user else (body.username or "")).strip()
    if not uname:
        raise HTTPException(400, "Foydalanuvchi aniqlanmadi")

    cost = SHOP_PRODUCT_COSTS.get(body.productId)
    if cost is None:
        if body.cost is not None and body.cost > 0:
            cost = body.cost
        else:
            raise HTTPException(400, "Mahsulot topilmadi")

    res = redeem_product(uname, body.productId, cost, body.code)
    if not res.get("ok"):
        raise HTTPException(400, res.get("reason", "Kuponni xarid qilib bo'lmadi"))

    broadcast.emit(
        "user.stats_updated",
        {"username": uname, "stats": res["userStats"]},
    )
    broadcast.emit(
        "user.profile_updated",
        {"username": uname, "profile": res["profile"]},
    )
    emit_stats()
    return res


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


# ── Media Upload & AI ─────────────────────────────────────────


MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


@app.post("/api/v1/upload")
@limiter.limit("20/minute")
async def upload_image(request: Request, image: UploadFile = File(...)):
    if image.content_type and image.content_type.lower() not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(400, "Faqat JPEG, PNG yoki WebP formatdagi rasmlar qabul qilinadi")

    data = await image.read(MAX_IMAGE_SIZE + 1)
    if len(data) > MAX_IMAGE_SIZE:
        raise HTTPException(400, "Rasm juda katta (maksimal 10 MB)")
    if len(data) < 200:
        raise HTTPException(400, "Rasm fayli yaroqsiz")

    ext = ".webp"
    if image.content_type:
        if "jpeg" in image.content_type.lower() or "jpg" in image.content_type.lower():
            ext = ".jpg"
        elif "png" in image.content_type.lower():
            ext = ".png"

    filename = f"{uuid.uuid4().hex}{ext}"
    out_path = UPLOAD_DIR / filename
    out_path.write_bytes(data)

    log.info("Rasm yuklandi: %s (%d bayt)", filename, len(data))
    return {"ok": True, "url": f"/uploads/{filename}"}


@app.post("/api/v1/analyze")
@limiter.limit("15/minute")
async def analyze(request: Request, image: UploadFile = File(...)):
    filename = image.filename or "photo.jpg"
    log.info("--- /api/v1/analyze: %s ---", filename)

    if not is_gemma_configured():
        return {"ok": False, "error": "AI sozlanmagan — server/.env da GEMMA_API_KEY qo'ying"}

    if image.content_type and image.content_type.lower() not in ALLOWED_IMAGE_TYPES:
        return {"ok": False, "error": "Faqat JPEG, PNG yoki WebP formatdagi rasmlar qabul qilinadi"}

    data = await image.read(MAX_IMAGE_SIZE + 1)
    if len(data) > MAX_IMAGE_SIZE:
        return {"ok": False, "error": "Rasm juda katta (maksimal 10 MB)"}
    if len(data) < 1000:
        return {"ok": False, "error": "Rasm juda kichik"}

    result, reject_reason = analyze_image(data, image.content_type)
    if not result:
        return {"ok": False, "error": reject_reason or "Gemma tahlil qila olmadi"}

    return {"ok": True, **result}


# ── SPA Frontend ──────────────────────────────────────────────


DIST_DIR = Path(__file__).parent.parent / "dist"
if (DIST_DIR / "index.html").exists():
    app.mount("/assets", StaticFiles(directory=DIST_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("uploads/"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = DIST_DIR / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(DIST_DIR / "index.html")


if __name__ == "__main__":
    import uvicorn

    is_dev = os.getenv("ENV", "production").lower() in ("dev", "development")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=is_dev,
    )
