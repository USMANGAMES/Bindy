import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from gemma import ai_status, analyze_image, is_gemma_configured
from store import add_report, list_reports

load_dotenv(Path(__file__).parent / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bindy")

app = FastAPI(title="Bindy API")

# localhost, LAN, Tailscale — barcha manzillar (dev uchun)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
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
    log.info("CORS: barcha originlar ruxsat (dev rejim)")


class ReportBody(BaseModel):
    lat: float
    lng: float
    category: str
    type: str
    label: str
    photoUrl: str | None = None
    userName: str
    points: int


@app.get("/api/v1/ai/status")
def get_ai_status():
    return ai_status()


@app.get("/api/v1/reports")
def get_reports():
    return {"reports": list_reports()}


@app.post("/api/v1/reports")
def create_report(body: ReportBody):
    report = add_report(body.model_dump())
    log.info("Report saqlandi: %s (%s) @ %.4f, %.4f", body.userName, body.category, body.lat, body.lng)
    return {"report": report}


@app.post("/api/v1/analyze")
async def analyze(image: UploadFile = File(...)):
    filename = image.filename or "photo.jpg"
    log.info("--- /api/v1/analyze: %s ---", filename)

    if not is_gemma_configured():
        log.error("Tahlil rad etildi: AI sozlanmagan")
        return {"ok": False, "error": "AI sozlanmagan — server/.env da GEMMA_API_KEY qo'ying"}

    data = await image.read()
    if len(data) < 1000:
        log.warning("Tahlil rad etildi: rasm juda kichik (%s bayt)", len(data))
        return {"ok": False, "error": "Rasm juda kichik"}

    result, reject_reason = analyze_image(data, image.content_type)
    if not result:
        msg = reject_reason or "Gemma tahlil qila olmadi"
        log.error("Tahlil RAD ETILDI: %s", msg)
        return {"ok": False, "error": msg}

    log.info("Tahlil MUVAFFAQIYATLI: %s / %s", result["category"], result["type"])
    return {"ok": True, **result}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
