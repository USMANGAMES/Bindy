import random
import uuid
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from store import list_reports, add_report

app = FastAPI(title="Bindy API")

origins = [
    o.strip()
    for o in __import__("os").getenv(
        "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/api/v1/reports")
def get_reports():
    return {"reports": list_reports()}


@app.post("/api/v1/reports")
def create_report(body: ReportBody):
    report = add_report(body.model_dump())
    return {"report": report}


TYPES = ["plastic", "glass", "paper", "mixed", "organic"]
LABELS = {
    "plastic": "Plastic & PET",
    "glass": "Glass",
    "paper": "Paper & Cardboard",
    "mixed": "Mixed Recycling",
    "organic": "Organic Waste",
}


@app.post("/api/v1/analyze")
async def analyze(image: UploadFile = File(...)):
    data = await image.read()
    if len(data) < 8000 and random.random() > 0.2:
        return {"ok": False}

    category = "trash" if random.random() < 0.35 else "bin"
    if category == "trash":
        return {
            "ok": True,
            "category": "trash",
            "type": "mixed",
            "confidence": random.randint(82, 96),
            "label": "Noqonuniy musor joyi",
        }

    t = random.choice(TYPES)
    return {
        "ok": True,
        "category": "bin",
        "type": t,
        "confidence": random.randint(88, 98),
        "label": LABELS[t],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=int(__import__("os").getenv("PORT", "8000")), reload=True)
