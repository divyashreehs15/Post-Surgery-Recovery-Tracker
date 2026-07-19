from fastapi import FastAPI,UploadFile, File
from pydantic import BaseModel
import cv2
import joblib
import numpy as np

# Load models
risk_model = joblib.load("risk_model.pkl")
recovery_model = joblib.load("recovery_model.pkl")

# Map wound status text → numeric codes used during training
wound_map = {
    "healing-well": 0,
    "slightly-red": 1,
    "swollen": 2,
    "drainage": 3,
    "concerning": 4
}

app = FastAPI(title="Post-Surgery ML Service")

class DailyLog(BaseModel):
    pain: float
    symptom_score: float
    wound_status: str
    notes: str



@app.post("/analyze-image")
async def analyze_image(image: UploadFile = File(...)):
    data = await image.read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return {"error": "Invalid image"}

    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ----------------------------
    # 1. REDNESS (inflammation)
    # ----------------------------
    lower_red1 = np.array([0, 100, 80])
    upper_red1 = np.array([5, 255, 255])
    lower_red2 = np.array([175, 100, 80])
    upper_red2 = np.array([179, 255, 255])

    red_mask = cv2.inRange(hsv, lower_red1, upper_red1) + cv2.inRange(hsv, lower_red2, upper_red2)
    redness_score = float((red_mask > 0).mean())

    # ----------------------------
    # 2. YELLOW / PUS (slough)
    # ----------------------------
    lower_yellow = np.array([15, 70, 70])
    upper_yellow = np.array([45, 255, 255])
    yellow_mask = cv2.inRange(hsv, lower_yellow, upper_yellow)
    yellow_score = float((yellow_mask > 0).mean())

    # ----------------------------
    # 3. NECROSIS (black/dark tissue)
    # ----------------------------
    dark_mask = gray < 60
    necrosis_score = float(dark_mask.mean())

    # ----------------------------
    # 4. TEXTURE (roughness)
    # ----------------------------
    edges = cv2.Canny(gray, 50, 120)
    texture_score = float(edges.mean()) / 255.0  # NORMALIZED

    # ----------------------------
    # 5. WOUND SIZE (LARGE WOUNDS = HIGH RISK)
    # ----------------------------
    wound_area = redness_score + yellow_score + necrosis_score
    size_factor = min(1.0, wound_area * 2.5)  # scale 0–1

    # ----------------------------
    # WEIGHTED RISK MODEL
    # ----------------------------
    infection_raw = (
        redness_score * 0.25 +
        yellow_score * 0.35 +     # pus is major indication
        necrosis_score * 0.45 +   # dead tissue is most serious
        texture_score * 0.15 +
        size_factor * 0.25        # larger wounds = more serious
    )

    infection_prob = round(min(1.0, infection_raw * 1.8), 3)

    infected = infection_prob > 0.45  # LOWER threshold for realism

    # Severity classification
    if infection_prob > 0.75:
        severity = "high"
    elif infection_prob > 0.45:
        severity = "moderate"
    else:
        severity = "low"

    return {
        "infected": infected,
        "infectionProb": infection_prob,
        "severity": severity,
        "scores": {
            "redness": round(redness_score, 3),
            "yellow_discharge": round(yellow_score, 3),
            "necrosis": round(necrosis_score, 3),
            "texture": round(texture_score, 3),
            "size_factor": round(size_factor, 3)
        },
        "recommendation": "see_doctor" if severity != "low" else "normal"
    }

@app.get("/")
def root():
    return {"message": "ML Service Running!"}

@app.post("/predict")
def predict(data: DailyLog):
    wound_code = wound_map.get(data.wound_status.lower(), 1)

    X = np.array([[data.pain, data.symptom_score, wound_code]])

    recovery_pred = recovery_model.predict(X)[0]
    risk_pred = risk_model.predict(X)[0]

    sentiment = "neutral"
    text = data.notes.lower()

    if any(word in text for word in ["good", "better", "fine", "improving"]):
        sentiment = "positive"
    elif any(word in text for word in ["pain", "swelling", "bleeding", "dizzy"]):
        sentiment = "negetive"
    if any(word in text for word in ["severe", "worst", "can't", "emergency"]):
        sentiment = "critical"

    return {
        "recoveryRate": round(float(recovery_pred), 2),
        "riskRate": round(float(risk_pred), 2),
        "sentiment": sentiment
    }
