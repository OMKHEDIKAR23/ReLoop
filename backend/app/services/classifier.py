from PIL import Image
from transformers import pipeline


classifier = pipeline(
    "image-classification",
    model="watersplash/waste-classification",
)


DISPOSAL_GUIDE = {
    "battery": {
        "category": "Battery",
        "action": (
            "Take batteries to a designated battery or e-waste collection "
            "point. Do not place them in regular waste."
        ),
    },
    "biological": {
        "category": "Biological Waste",
        "action": (
            "Place biological/organic waste in the designated "
            "organic waste collection bin."
        ),
    },
    "brown-glass": {
        "category": "Brown Glass",
        "action": (
            "Place clean glass in the designated glass recycling "
            "collection point."
        ),
    },
    "cardboard": {
        "category": "Cardboard",
        "action": (
            "Flatten clean cardboard and place it in the "
            "paper/cardboard recycling collection."
        ),
    },
    "clothes": {
        "category": "Clothes",
        "action": (
            "Place usable or unwanted clothing in the designated "
            "textile donation or collection point."
        ),
    },
    "green-glass": {
        "category": "Green Glass",
        "action": (
            "Place clean glass in the designated glass recycling "
            "collection point."
        ),
    },
    "metal": {
        "category": "Metal",
        "action": (
            "Place metal items in the designated metal recycling collection."
        ),
    },
    "paper": {
        "category": "Paper",
        "action": (
            "Place clean, dry paper in the paper recycling collection."
        ),
    },
    "plastic": {
        "category": "Plastic",
        "action": (
            "Check the item's recycling symbol and local rules, "
            "then use the appropriate plastic recycling collection."
        ),
    },
    "shoes": {
        "category": "Shoes",
        "action": (
            "Place unwanted shoes in the designated textile/shoe "
            "collection point."
        ),
    },
    "trash": {
        "category": "General Waste",
        "action": (
            "Place this item in the designated general-waste collection bin."
        ),
    },
    "white-glass": {
        "category": "White Glass",
        "action": (
            "Place clean glass in the designated glass recycling "
            "collection point."
        ),
    },
}


def classify_waste(image: Image.Image) -> dict:
    predictions = classifier(image, top_k=3)

    if not predictions:
        return {
            "category": "Uncertain",
            "confidence": 0.0,
            "action": (
                "No usable prediction was returned. "
                "Try uploading a clearer image."
            ),
            "model_label": None,
            "alternatives": [],
        }

    best = predictions[0]
    label = best["label"].lower()
    confidence = round(best["score"] * 100, 2)

    alternatives = [
        {
            "category": prediction["label"].replace("-", " ").title(),
            "confidence": round(prediction["score"] * 100, 2),
        }
        for prediction in predictions
    ]

    # A low score means the result should be treated as uncertain.
    # This threshold does not guarantee that higher-scoring predictions
    # are correct.
    if confidence < 75:
        return {
            "category": "Uncertain",
            "confidence": confidence,
            "action": (
                "The model is not confident enough to recommend a disposal "
                "route. Try a clearer photo and check local waste guidance."
            ),
            "model_label": label,
            "alternatives": alternatives,
        }

    guide = DISPOSAL_GUIDE.get(
        label,
        {
            "category": label.replace("-", " ").title(),
            "action": (
                "Check the appropriate campus waste collection point "
                "and local disposal guidance."
            ),
        },
    )

    return {
        "category": guide["category"],
        "confidence": confidence,
        "action": guide["action"],
        "model_label": label,
        "alternatives": alternatives,
    }