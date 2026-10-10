import json
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
from io import BytesIO

from fastapi import APIRouter, UploadFile, File, HTTPException
from PIL import Image, UnidentifiedImageError

from app.services.classifier import classify_waste


router = APIRouter(prefix="/api/waste", tags=["Waste"])

# Store scan history in backend/data/waste_events.jsonl
DATA_DIR = Path(__file__).resolve().parents[2] / "data"
EVENTS_FILE = DATA_DIR / "waste_events.jsonl"


def save_scan_event(event: dict) -> None:
    """Append one scan event to the local history file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with EVENTS_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(event, ensure_ascii=False) + "\n")


@router.post("/analyze")
async def analyze_waste(file: UploadFile = File(...)):
    # Validate the uploaded file type.
    if file.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=415,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    # Limit uploads to 10 MB.
    image_data = await file.read()

    if not image_data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(image_data) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail="Image is too large. Maximum allowed size is 10 MB.",
        )

    try:
        image = Image.open(BytesIO(image_data)).convert("RGB")
    except (UnidentifiedImageError, OSError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image.",
        )

    # Run the existing waste classifier.
    result = classify_waste(image)

    # Create an event for the future campus waste analytics dashboard.
    event = {
        "event_id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "filename": Path(file.filename or "upload").name,
        "category": result.get("category", "Uncertain"),
        "confidence": result.get("confidence", 0.0),
        "model_label": result.get("model_label"),
    }

    try:
        save_scan_event(event)
    except OSError:
        raise HTTPException(
            status_code=500,
            detail="The scan completed, but its history could not be saved.",
        )

    return {
        "filename": event["filename"],
        "content_type": file.content_type,
        "result": result,
        "event_id": event["event_id"],
        "recorded_at": event["timestamp"],
        "history_saved": True,
    }


@router.get("/history")
def get_scan_history():
    """Return recent scan events for the dashboard."""
    if not EVENTS_FILE.exists():
        return {"total": 0, "events": []}

    try:
        with EVENTS_FILE.open("r", encoding="utf-8") as file:
            events = [
                json.loads(line)
                for line in file
                if line.strip()
            ]
    except (OSError, json.JSONDecodeError):
        raise HTTPException(
            status_code=500,
            detail="Could not read scan history.",
        )

    # Return newest events first.
    events.reverse()

    return {
        "total": len(events),
        "events": events[:100],
    }