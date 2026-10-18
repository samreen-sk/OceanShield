import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict

app = FastAPI(
    title="OceanShield AI Inference Microservice",
    description="Hazard text classification, image inference, and multimodal evidence fusion",
    version="1.0.0"
)

# Supported Ocean Hazard Classes
HAZARD_CLASSES = [
    "OIL_SPILL",
    "PLASTIC_POLLUTION",
    "DEAD_MARINE_LIFE",
    "FLOOD_HIGH_WATER",
    "CYCLONE_STORM",
    "HARMFUL_ALGAL_BLOOM",
    "SHIP_INCIDENT",
    "OTHER"
]

class TextPredictionRequest(BaseModel):
    text: str

class ImagePredictionRequest(BaseModel):
    imageUrl: str

class MultimodalPredictionRequest(BaseModel):
    text: str
    imageUrl: Optional[str] = None

class PredictionResponse(BaseModel):
    success: bool
    prediction: Dict

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "oceanshield-ai-service",
        "version": "1.0.0"
    }

@app.post("/predict/text", response_model=PredictionResponse)
def predict_text(req: TextPredictionRequest):
    if not req.text or len(req.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text field cannot be empty")

    text = req.text.lower()
    
    # Baseline TF-IDF / Keyword Probabilistic Distribution
    probs = {cls: 0.02 for cls in HAZARD_CLASSES}
    
    if any(k in text for k in ["oil", "sheen", "tarball", "slick", "crude", "petroleum"]):
        probs["OIL_SPILL"] = 0.92
    elif any(k in text for k in ["plastic", "debris", "garbage", "trash", "bottle", "net"]):
        probs["PLASTIC_POLLUTION"] = 0.89
    elif any(k in text for k in ["dead", "fish", "carcass", "whale", "turtle", "dolphin", "kill"]):
        probs["DEAD_MARINE_LIFE"] = 0.91
    elif any(k in text for k in ["flood", "high water", "inundation", "surge", "submerged"]):
        probs["FLOOD_HIGH_WATER"] = 0.88
    elif any(k in text for k in ["cyclone", "storm", "hurricane", "typhoon", "high waves", "gale"]):
        probs["CYCLONE_STORM"] = 0.90
    elif any(k in text for k in ["algae", "red tide", "bloom", "algal", "green scum", "discoloration"]):
        probs["HARMFUL_ALGAL_BLOOM"] = 0.87
    elif any(k in text for k in ["ship", "boat", "vessel", "grounded", "collision", "sinking"]):
        probs["SHIP_INCIDENT"] = 0.85
    else:
        probs["OTHER"] = 0.65

    # Normalize probabilities
    total = sum(probs.values())
    normalized = {k: round(v / total, 4) for k, v in probs.items()}
    best_hazard = max(normalized, key=normalized.get)
    confidence = normalized[best_hazard]

    return {
        "success": True,
        "prediction": {
            "hazard": best_hazard,
            "confidence": confidence,
            "probabilities": normalized
        }
    }

@app.post("/predict/image", response_model=PredictionResponse)
def predict_image(req: ImagePredictionRequest):
    if not req.imageUrl:
        raise HTTPException(status_code=400, detail="imageUrl is required")

    # In MVP, simulate CNN vision feature extraction / transfer learning inference
    # Baseline returns plausible vision distribution matching text inference scale
    probs = {cls: 0.02 for cls in HAZARD_CLASSES}
    lower_url = req.imageUrl.lower()
    
    if "oil" in lower_url:
        probs["OIL_SPILL"] = 0.92
    elif "plastic" in lower_url:
        probs["PLASTIC_POLLUTION"] = 0.89
    elif "fish" in lower_url or "dead" in lower_url:
        probs["DEAD_MARINE_LIFE"] = 0.91
    else:
        probs["OTHER"] = 0.65

    total = sum(probs.values())
    normalized = {k: round(v / total, 4) for k, v in probs.items()}
    best_hazard = max(normalized, key=normalized.get)

    return {
        "success": True,
        "prediction": {
            "hazard": best_hazard,
            "confidence": normalized[best_hazard],
            "probabilities": normalized
        }
    }

@app.post("/predict/multimodal", response_model=PredictionResponse)
def predict_multimodal(req: MultimodalPredictionRequest):
    text_res = predict_text(TextPredictionRequest(text=req.text))
    text_pred = text_res["prediction"]

    image_pred = None
    if req.imageUrl:
        image_res = predict_image(ImagePredictionRequest(imageUrl=req.imageUrl))
        image_pred = image_res["prediction"]

    if image_pred and image_pred["hazard"] == text_pred["hazard"]:
        # Documented fusion formula: 0.6*text + 0.4*image + 0.05, capped at 0.99
        fused = round((text_pred["confidence"] * 0.6) + (image_pred["confidence"] * 0.4) + 0.05, 4)
        # Corroborating evidence should never reduce confidence compared with text alone
        combined_conf = min(0.99, max(text_pred["confidence"], fused))
        chosen_hazard = text_pred["hazard"]
    else:
        # Conflicting text and image: text takes precedence
        chosen_hazard = text_pred["hazard"]
        combined_conf = text_pred["confidence"]

    return {
        "success": True,
        "prediction": {
            "hazard": chosen_hazard,
            "confidence": combined_conf,
            "textPrediction": text_pred,
            "imagePrediction": image_pred
        }
    }

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
