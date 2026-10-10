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


# Category-specific recovery recommendations.
RECOVERY_GUIDANCE = {
    "battery": {
        "route": "Battery collection or authorized e-waste facility",
        "why": (
            "Batteries may contain materials requiring specialized handling "
            "and should not automatically be mixed with ordinary waste."
        ),
        "next_step": (
            "Keep the battery separate from ordinary waste. Find a suitable "
            "collection facility and confirm that it accepts your battery type."
        ),
        "facility_keywords": ["battery", "e-waste"],
        "handling_note": (
            "If the battery is swollen, leaking, unusually hot, or damaged, "
            "avoid handling or transporting it yourself. Seek guidance from "
            "an appropriate local waste authority or qualified professional."
        ),
    },
    "biological": {
        "route": "Appropriate organic-waste collection",
        "why": (
            "Suitable food and garden waste may be composted or processed "
            "separately from recyclable materials."
        ),
        "next_step": (
            "Check local organic-waste rules. Do not assume medical or "
            "hazardous biological waste is suitable for composting."
        ),
        "facility_keywords": ["organic", "compost"],
        "handling_note": (
            "The image classifier cannot determine whether biological material "
            "is infectious or hazardous."
        ),
    },
    "cardboard": {
        "route": "Paper and cardboard recycling",
        "why": (
            "Clean, dry cardboard can often be recovered through paper recycling."
        ),
        "next_step": (
            "Keep cardboard dry and check whether your local recycling service "
            "accepts it."
        ),
        "facility_keywords": ["paper", "recycling"],
        "handling_note": (
            "Greasy, contaminated, or wet cardboard may not be accepted."
        ),
    },
    "paper": {
        "route": "Paper recycling",
        "why": (
            "Separating suitable paper helps keep recyclable material out of "
            "mixed waste."
        ),
        "next_step": (
            "Keep paper clean and dry and check local recycling rules."
        ),
        "facility_keywords": ["paper", "recycling"],
        "handling_note": (
            "Coated, laminated, or contaminated paper may not be accepted."
        ),
    },
    "metal": {
        "route": "Metal recycling collection",
        "why": (
            "Many metal items can be recovered and processed into reusable material."
        ),
        "next_step": (
            "Keep the item separate from mixed waste and check whether a local "
            "recycler accepts that type of metal."
        ),
        "facility_keywords": ["metal", "recycling"],
        "handling_note": (
            "Avoid handling sharp or contaminated metal unnecessarily."
        ),
    },
    "clothes": {
        "route": "Textile reuse or collection",
        "why": (
            "Wearable textiles may be reused, while some damaged textiles can "
            "be accepted by specialist recycling programs."
        ),
        "next_step": (
            "Consider donating usable clothing or finding a textile collection "
            "program for other items."
        ),
        "facility_keywords": ["textile", "reuse", "donation"],
        "handling_note": (
            "Acceptance depends on the condition and material of the textile."
        ),
    },
    "green-glass": {
        "route": "Glass recycling collection",
        "why": (
            "Suitable glass containers may be recycled where a local collection "
            "program is available."
        ),
        "next_step": (
            "Check local glass recycling rules and separate the item carefully."
        ),
        "facility_keywords": ["glass", "recycling"],
        "handling_note": (
            "Do not place broken glass loose in a collection container unless "
            "local instructions specifically allow it."
        ),
    },
    "brown-glass": {
        "route": "Glass recycling collection",
        "why": (
            "Suitable brown glass containers can be recyclable, depending on "
            "the local collection program."
        ),
        "next_step": (
            "Check whether your local service accepts brown glass separately "
            "or with other container glass."
        ),
        "facility_keywords": ["glass", "recycling"],
        "handling_note": (
            "Handle broken glass carefully and follow local packaging instructions."
        ),
    },
    "white-glass": {
        "route": "Glass recycling collection",
        "why": (
            "Suitable clear glass containers may be recovered through glass "
            "recycling programs."
        ),
        "next_step": (
            "Confirm local acceptance rules and keep glass separate as required."
        ),
        "facility_keywords": ["glass", "recycling"],
        "handling_note": (
            "Not every type of glass is accepted by ordinary glass recyclers."
        ),
    },
    "trash": {
        "route": "Local municipal waste service",
        "why": (
            "Mixed or non-recyclable waste may require disposal through the "
            "local municipal waste system."
        ),
        "next_step": (
            "Check whether the item contains recyclable, electronic, chemical, "
            "or other specially managed materials before treating it as ordinary waste."
        ),
        "facility_keywords": ["municipal", "waste"],
        "handling_note": (
            "The general trash category does not prove that an item is safe "
            "for ordinary household disposal."
        ),
    },
}


DEFAULT_GUIDANCE = {
    "route": "Verify the correct disposal route",
    "why": (
        "ReLoop does not yet have a specific recovery guide for this category."
    ),
    "next_step": (
        "Consult local waste authority guidance or a suitable collection "
        "service before disposing of the item."
    ),
    "facility_keywords": [],
    "handling_note": (
        "AI image classification can be incorrect. Verify the item and its "
        "material before acting on the recommendation."
    ),
}


def get_recovery_guidance(category: str) -> dict:
    """Return recovery guidance for the predicted waste category."""
    key = category.strip().lower().replace("_", "-").replace(" ", "-")
    guidance = RECOVERY_GUIDANCE.get(key, DEFAULT_GUIDANCE)

    return {
        "route": guidance["route"],
        "why": guidance["why"],
        "next_step": guidance["next_step"],
        "facility_keywords": guidance["facility_keywords"],
        "handling_note": guidance["handling_note"],
    }


def save_scan_event(event: dict) -> None:
    """Append one scan event to the local history file."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with EVENTS_FILE.open("a", encoding="utf-8") as file:
        file.write(json.dumps(event, ensure_ascii=False) + "\n")


@router.post("/analyze")
async def analyze_waste(file: UploadFile = File(...)):
    """Classify an image and provide recovery guidance."""

    if file.content_type not in {
        "image/jpeg",
        "image/png",
        "image/webp",
    }:
        raise HTTPException(
            status_code=415,
            detail="Please upload a JPG, PNG, or WEBP image.",
        )

    image_data = await file.read()

    if not image_data:
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty.",
        )

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

    try:
        result = classify_waste(image)
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Waste classification failed. Please try another image.",
        )

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=500,
            detail="The classifier returned an unexpected result.",
        )

    category = str(result.get("category") or "Uncertain")
    recovery = get_recovery_guidance(category)

    event = {
        "event_id": str(uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "filename": Path(file.filename or "upload").name,
        "category": category,
        "confidence": result.get("confidence", 0.0),
        "model_label": result.get("model_label"),
        "recovery_route": recovery["route"],
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
        "recovery": recovery,
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

    events.reverse()

    return {
        "total": len(events),
        "events": events[:100],
    }