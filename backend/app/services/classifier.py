from PIL import Image
from transformers import pipeline


# Load the waste classification model.
classifier = pipeline(
    "image-classification",
    model="watersplash/waste-classification",
)


# Minimum score required before presenting a category as a prediction.
# This helps filter low-scoring predictions but cannot guarantee accuracy.
CONFIDENCE_THRESHOLD = 75.0


DISPOSAL_GUIDE = {
    "battery": {
        "category": "Battery",
        "action": (
            "Take batteries to a designated battery or e-waste "
            "collection point. Do not place them in regular waste."
        ),
    },
    "biological": {
        "category": "Biological Waste",
        "action": (
            "Place suitable organic waste in the designated "
            "organic waste collection bin."
        ),
    },
    "brown-glass": {
        "category": "Brown Glass",
        "action": (
            "Check local recycling rules and use an appropriate "
            "glass collection point."
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
            "Consider textile reuse or donation, or use a designated "
            "textile collection point."
        ),
    },
    "green-glass": {
        "category": "Green Glass",
        "action": (
            "Check local recycling rules and use an appropriate "
            "glass collection point."
        ),
    },
    "metal": {
        "category": "Metal",
        "action": (
            "Check local recycling rules and use a designated "
            "metal recycling collection."
        ),
    },
    "paper": {
        "category": "Paper",
        "action": (
            "Place clean, dry paper in the designated paper "
            "recycling collection."
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
            "Consider reuse or donation, or use a designated "
            "shoe/textile collection point."
        ),
    },
    "trash": {
        "category": "General Waste",
        "action": (
            "Check local disposal guidance for the item before "
            "placing it in general waste."
        ),
    },
    "white-glass": {
        "category": "White Glass",
        "action": (
            "Check local recycling rules and use an appropriate "
            "glass collection point."
        ),
    },
}


def uncertain_result(confidence, label, alternatives, reason):
    """Return a cautious result when the prediction should not be trusted."""

    return {
        "category": "Uncertain",
        "confidence": confidence,
        "action": (
            f"{reason} Photograph one item at a time, if possible, "
            "and check local waste disposal guidance."
        ),
        "model_label": label,
        "alternatives": alternatives,
    }


def classify_waste(image: Image.Image) -> dict:
    """
    Predict the most likely waste category.

    Important:
    This model predicts one main class for an image. It does not reliably
    identify every material in a mixed-waste image.
    """

    if image is None:
        return uncertain_result(
            0.0,
            None,
            [],
            "No image was provided.",
        )

    # Normalize the image before inference.
    image = image.convert("RGB")

    # Request several predictions so we can inspect the model's output.
    predictions = classifier(image, top_k=3)

    if not predictions:
        return uncertain_result(
            0.0,
            None,
            [],
            "The model did not return a usable prediction.",
        )

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

    # Reject predictions below the existing confidence threshold.
    if confidence < CONFIDENCE_THRESHOLD:
        return uncertain_result(
            confidence,
            label,
            alternatives,
            "The model's prediction score is below the configured threshold.",
        )

    # A strong top prediction alone does not prove the image contains
    # only one material or that the predicted category is correct.
    if len(predictions) > 1:
        second_confidence = predictions[1]["score"] * 100
        score_gap = confidence - second_confidence

        # Treat close competing predictions cautiously.
        if score_gap < 5:
            return uncertain_result(
                confidence,
                label,
                alternatives,
                (
                    "The model has similar scores for multiple categories, "
                    "so the result may be ambiguous."
                ),
            )

    guide = DISPOSAL_GUIDE.get(label)

    if guide is None:
        return uncertain_result(
            confidence,
            label,
            alternatives,
            "The predicted category has no verified disposal recommendation.",
        )

    return {
        "category": guide["category"],
        "confidence": confidence,
        "action": guide["action"],
        "model_label": label,
        "alternatives": alternatives,
    }