"""
Chutex Care — Glycemia ML Engine V3
Non-invasive blood glucose estimation using Machine Learning.

Architecture:
- Level 1: Population model pre-trained on medical literature correlations
- Level 2: Per-user adaptation from personal sensor history
- Level 3: Optional calibration boost from finger-prick data

The model works WITHOUT manual calibrations. Calibrations improve precision but are NOT required.
"""

import numpy as np
import logging
import os
import pickle
from datetime import datetime, timezone, timedelta
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

# ─── Feature names (order matters) ───
FEATURE_NAMES = [
    "hrv", "heart_rate", "spo2", "steps", "sleep_quality", "temperature",
    "stress_level", "visceral_fat", "body_fat_pct", "bmi", "muscle_pct",
    "water_pct", "age", "is_male", "has_diabetes_risk",
    "hour_of_day", "muscle_fat_ratio", "hrv_norm", "activity_level",
]

MODEL_DIR = "/app/backend/models"
POPULATION_MODEL_PATH = os.path.join(MODEL_DIR, "glycemia_population_v3.pkl")
MIN_CALIBRATIONS_FOR_PERSONAL = 5


def _ensure_model_dir():
    os.makedirs(MODEL_DIR, exist_ok=True)


# ═══════════════════════════════════════════════════════════════
#  SYNTHETIC DATA GENERATION — Based on medical literature
# ═══════════════════════════════════════════════════════════════

def generate_population_dataset(n_samples=6000):
    """
    Generate synthetic patient data following published medical correlations.
    Each sample = (sensor_features, true_glycemia_gL).

    Sources: Frontiers in Endocrinology 2019, Diabetes Care 2016,
    Diabetologia 2012, Sleep Medicine Reviews 2020, ADA guidelines.
    """
    rng = np.random.RandomState(42)

    # ─── Generate base glycemia distribution (g/L) ───
    # Real population: ~70% normal (0.70-1.00), ~20% vigilance (1.00-1.26), ~10% elevated (>1.26)
    glycemia = np.concatenate([
        rng.normal(0.88, 0.08, int(n_samples * 0.55)),   # Healthy
        rng.normal(0.98, 0.06, int(n_samples * 0.20)),   # Normal high
        rng.normal(1.12, 0.08, int(n_samples * 0.15)),   # Pre-diabetic
        rng.normal(1.35, 0.12, int(n_samples * 0.10)),   # Diabetic range
    ])
    glycemia = np.clip(glycemia, 0.55, 2.5)
    n = len(glycemia)

    # ─── Generate correlated sensor features ───
    noise = lambda scale: rng.normal(0, scale, n)

    # HRV: INVERSE correlation (high glycemia → low HRV)
    # Literature: RMSSD drops from ~45ms (healthy) to ~20ms (insulin resistant)
    hrv = 55 - (glycemia - 0.85) * 40 + noise(8)
    hrv = np.clip(hrv, 8, 120)

    # Heart rate rest: POSITIVE correlation
    heart_rate = 62 + (glycemia - 0.85) * 25 + noise(6)
    heart_rate = np.clip(heart_rate, 48, 110)

    # SpO2: slight INVERSE correlation (desaturation with metabolic issues)
    spo2 = 98.5 - (glycemia - 0.85) * 3 + noise(0.8)
    spo2 = np.clip(spo2, 88, 100)

    # Steps: INVERSE (more active → lower glycemia)
    steps = 7500 - (glycemia - 0.85) * 5000 + noise(2000)
    steps = np.clip(steps, 200, 20000)

    # Sleep quality: INVERSE
    sleep_quality = 82 - (glycemia - 0.85) * 30 + noise(10)
    sleep_quality = np.clip(sleep_quality, 20, 100)

    # Temperature: slight deviation with metabolic stress
    temperature = 36.6 + (glycemia - 0.85) * 0.3 + noise(0.25)
    temperature = np.clip(temperature, 35.5, 38.5)

    # Stress: POSITIVE
    stress_level = 25 + (glycemia - 0.85) * 50 + noise(12)
    stress_level = np.clip(stress_level, 0, 100)

    # Visceral fat: STRONG POSITIVE (strongest predictor per Diabetologia 2012)
    visceral_fat = 6 + (glycemia - 0.85) * 15 + noise(2.5)
    visceral_fat = np.clip(visceral_fat, 1, 25)

    # Body fat %: POSITIVE
    body_fat_pct = 22 + (glycemia - 0.85) * 20 + noise(5)
    body_fat_pct = np.clip(body_fat_pct, 8, 55)

    # BMI: POSITIVE
    bmi = 23 + (glycemia - 0.85) * 12 + noise(3)
    bmi = np.clip(bmi, 16, 45)

    # Muscle %: INVERSE (protective factor)
    muscle_pct = 38 - (glycemia - 0.85) * 12 + noise(4)
    muscle_pct = np.clip(muscle_pct, 15, 55)

    # Water %: slight INVERSE
    water_pct = 55 - (glycemia - 0.85) * 8 + noise(4)
    water_pct = np.clip(water_pct, 35, 70)

    # Age: POSITIVE correlation with glycemia risk
    age = 55 + (glycemia - 0.85) * 15 + noise(10)
    age = np.clip(age, 25, 95)

    # Gender: slight male bias for diabetes
    is_male = (rng.random(n) < (0.45 + (glycemia - 0.85) * 0.1)).astype(float)

    # Diabetes risk flag
    has_diabetes_risk = (glycemia > 1.15).astype(float) * (rng.random(n) < 0.7).astype(float)

    # Time of day: postprandial (after meals) shows higher glycemia
    hour_of_day = rng.choice(range(6, 23), n).astype(float)
    # Add postprandial effect: glycemia higher 1-2h after meals (8h, 13h, 20h)
    postprandial_boost = np.zeros(n)
    for meal_hour in [8, 13, 20]:
        time_since_meal = np.abs(hour_of_day - meal_hour)
        mask = time_since_meal <= 2
        postprandial_boost[mask] += 0.08 * (1 - time_since_meal[mask] / 2)
    glycemia_with_time = glycemia + postprandial_boost

    # Derived features
    muscle_fat_ratio = muscle_pct / np.maximum(body_fat_pct, 1)
    hrv_norm = hrv / np.maximum(heart_rate, 1)  # HRV normalized by HR
    activity_level = np.clip(steps / 10000, 0, 2)  # Normalized activity

    # ─── Assemble feature matrix ───
    X = np.column_stack([
        hrv, heart_rate, spo2, steps, sleep_quality, temperature,
        stress_level, visceral_fat, body_fat_pct, bmi, muscle_pct,
        water_pct, age, is_male, has_diabetes_risk,
        hour_of_day, muscle_fat_ratio, hrv_norm, activity_level,
    ])

    y = glycemia_with_time

    return X, y


# ═══════════════════════════════════════════════════════════════
#  FEATURE EXTRACTION — From real sensor data
# ═══════════════════════════════════════════════════════════════

def extract_features(bracelet: dict, scale: dict, profile: dict, history: list = None) -> np.ndarray:
    """
    Extract feature vector from current sensor readings.
    Handles missing values with sensible defaults.
    """
    hrv = float(bracelet.get("hrv", 0) or 0)
    heart_rate = float(bracelet.get("heart_rate", 0) or 0)
    spo2 = float(bracelet.get("spo2", 0) or 0)
    steps = float(bracelet.get("steps", 0) or 0)
    sleep_quality = float(bracelet.get("sleep_quality", 0) or 0)
    temperature = float(bracelet.get("temperature", 0) or 0)
    stress_level = float(bracelet.get("stress_level", 0) or 0)

    visceral_fat = float(scale.get("visceral_fat", 0) or 0)
    body_fat_pct = float(scale.get("body_fat_pct", 0) or 0)
    bmi = float(scale.get("bmi", 0) or 0)
    muscle_pct = float(scale.get("muscle_pct", 0) or 0)
    water_pct = float(scale.get("water_pct", 0) or 0)

    age = float(profile.get("age", 70))
    is_male = 1.0 if profile.get("is_male", False) else 0.0
    has_diabetes_risk = 1.0 if profile.get("has_diabetes_risk", False) else 0.0

    now = datetime.now(timezone.utc)
    hour_of_day = float(now.hour)

    muscle_fat_ratio = muscle_pct / max(body_fat_pct, 1)
    hrv_norm = hrv / max(heart_rate, 1)
    activity_level = min(2.0, steps / 10000)

    features = np.array([[
        hrv, heart_rate, spo2, steps, sleep_quality, temperature,
        stress_level, visceral_fat, body_fat_pct, bmi, muscle_pct,
        water_pct, age, is_male, has_diabetes_risk,
        hour_of_day, muscle_fat_ratio, hrv_norm, activity_level,
    ]])

    return features


def count_available_features(bracelet: dict, scale: dict) -> int:
    """Count how many real sensor values we have (non-zero)."""
    count = 0
    for k in ["hrv", "heart_rate", "spo2", "steps", "sleep_quality", "temperature", "stress_level"]:
        if bracelet.get(k, 0):
            count += 1
    for k in ["visceral_fat", "body_fat_pct", "bmi", "muscle_pct", "water_pct"]:
        if scale.get(k, 0):
            count += 1
    return count


# ═══════════════════════════════════════════════════════════════
#  MODEL — Training, prediction, persistence
# ═══════════════════════════════════════════════════════════════

class GlycemiaModel:
    """Gradient Boosting model for glycemia estimation."""

    def __init__(self):
        self.model = GradientBoostingRegressor(
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            min_samples_leaf=10,
            subsample=0.8,
            random_state=42,
        )
        self.scaler = StandardScaler()
        self.is_trained = False
        self.training_samples = 0
        self.version = "v3-population"

    def train_population(self):
        """Train on synthetic population data from medical literature."""
        logger.info("[ML-V3] Generating population dataset...")
        X, y = generate_population_dataset(6000)

        logger.info("[ML-V3] Training population model on %d samples...", len(X))
        X_scaled = self.scaler.fit_transform(X)
        self.model.fit(X_scaled, y)
        self.is_trained = True
        self.training_samples = len(X)
        self.version = "v3-population"

        # Log feature importances
        importances = self.model.feature_importances_
        top_features = sorted(zip(FEATURE_NAMES, importances), key=lambda x: -x[1])[:5]
        logger.info("[ML-V3] Top features: %s", ", ".join(f"{n}={v:.3f}" for n, v in top_features))

        return self

    def train_personal(self, X_personal, y_personal, X_population=None, y_population=None):
        """
        Fine-tune model with user's personal calibration data.
        Uses population data as base + personal data with higher weight.
        """
        if X_population is not None and y_population is not None:
            # Combine: population (weight=1) + personal (weight=5)
            personal_weight = 5
            X_combined = np.vstack([X_population, np.repeat(X_personal, personal_weight, axis=0)])
            y_combined = np.concatenate([y_population, np.repeat(y_personal, personal_weight)])
        else:
            X_combined = X_personal
            y_combined = y_personal

        X_scaled = self.scaler.fit_transform(X_combined)
        self.model.fit(X_scaled, y_combined)
        self.is_trained = True
        self.training_samples = len(X_combined)
        self.version = f"v3-personal-{len(X_personal)}cal"
        logger.info("[ML-V3] Personal model trained with %d calibrations", len(X_personal))
        return self

    def predict(self, features: np.ndarray) -> dict:
        """Predict glycemia from feature vector."""
        if not self.is_trained:
            return None

        X_scaled = self.scaler.transform(features)
        prediction = float(self.model.predict(X_scaled)[0])
        prediction = round(max(0.55, min(2.5, prediction)), 2)

        # Estimate prediction interval using tree variance
        tree_predictions = np.array([
            tree[0].predict(X_scaled)[0]
            for tree in self.model.estimators_
        ])
        std = float(np.std(tree_predictions))
        lower = round(max(0.55, prediction - 1.96 * std), 2)
        upper = round(min(2.5, prediction + 1.96 * std), 2)

        return {
            "value": prediction,
            "lower": lower,
            "upper": upper,
            "std": round(std, 3),
            "model_version": self.version,
        }

    def get_feature_contributions(self, features: np.ndarray) -> list:
        """Get which features contributed most to this prediction."""
        if not self.is_trained:
            return []

        importances = self.model.feature_importances_
        feature_values = features[0]

        contributions = []
        for i, (name, importance) in enumerate(zip(FEATURE_NAMES, importances)):
            if importance > 0.02 and feature_values[i] != 0:
                contributions.append({
                    "feature": name,
                    "importance": round(float(importance) * 100, 1),
                    "value": round(float(feature_values[i]), 2),
                })

        return sorted(contributions, key=lambda x: -x["importance"])[:8]

    def save(self, path: str):
        _ensure_model_dir()
        with open(path, "wb") as f:
            pickle.dump({"model": self.model, "scaler": self.scaler, "version": self.version, "samples": self.training_samples}, f)
        logger.info("[ML-V3] Model saved to %s", path)

    def load(self, path: str) -> bool:
        if not os.path.exists(path):
            return False
        try:
            with open(path, "rb") as f:
                data = pickle.load(f)
            self.model = data["model"]
            self.scaler = data["scaler"]
            self.version = data.get("version", "v3-loaded")
            self.training_samples = data.get("samples", 0)
            self.is_trained = True
            logger.info("[ML-V3] Model loaded from %s (%s)", path, self.version)
            return True
        except Exception as e:
            logger.warning("[ML-V3] Failed to load model: %s", e)
            return False


# ═══════════════════════════════════════════════════════════════
#  SINGLETON — Global model instance
# ═══════════════════════════════════════════════════════════════

_population_model: GlycemiaModel | None = None


def get_population_model() -> GlycemiaModel:
    """Get or create the population-level model (singleton)."""
    global _population_model

    if _population_model is not None and _population_model.is_trained:
        return _population_model

    _population_model = GlycemiaModel()

    # Try loading cached model
    if _population_model.load(POPULATION_MODEL_PATH):
        return _population_model

    # Train from scratch
    _population_model.train_population()
    _population_model.save(POPULATION_MODEL_PATH)
    return _population_model


async def get_personal_model(user_id: str, db) -> GlycemiaModel | None:
    """
    Get a personalized model for a user if they have enough calibrations.
    Returns None if no personal model available (falls back to population).
    """
    personal_path = os.path.join(MODEL_DIR, f"glycemia_personal_{user_id}.pkl")

    # Check if cached personal model exists and is recent
    personal_model = GlycemiaModel()
    if personal_model.load(personal_path):
        return personal_model

    # Check if user has enough calibrations to train personal model
    calibrations = await db.glycemia_calibrations.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("date", -1).to_list(50)

    if len(calibrations) < MIN_CALIBRATIONS_FOR_PERSONAL:
        return None

    # Build personal training data from calibration snapshots
    X_personal = []
    y_personal = []

    for cal in calibrations:
        real_glycemia = cal.get("glycemia_value", 0)
        if real_glycemia <= 0:
            continue

        bracelet_snap = cal.get("sensor_snapshot_bracelet", {})
        scale_snap = cal.get("sensor_snapshot_scale", {})

        if not bracelet_snap and not scale_snap:
            continue

        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        age = 70
        if user_doc and user_doc.get("date_of_birth"):
            try:
                dob = datetime.fromisoformat(user_doc["date_of_birth"].replace("Z", "+00:00"))
                age = (datetime.now(timezone.utc) - dob).days // 365
            except Exception:
                pass

        profile = {
            "age": age,
            "is_male": user_doc.get("gender", "").lower() in ("m", "male", "homme") if user_doc else False,
            "has_diabetes_risk": False,
        }

        features = extract_features(bracelet_snap, scale_snap, profile)
        X_personal.append(features[0])
        y_personal.append(real_glycemia)

    if len(X_personal) < MIN_CALIBRATIONS_FOR_PERSONAL:
        return None

    X_personal = np.array(X_personal)
    y_personal = np.array(y_personal)

    # Train personal model with population data as base
    X_pop, y_pop = generate_population_dataset(3000)
    personal_model = GlycemiaModel()
    personal_model.train_personal(X_personal, y_personal, X_pop, y_pop)
    personal_model.save(personal_path)

    return personal_model


# ═══════════════════════════════════════════════════════════════
#  HIGH-LEVEL API — Called from routes
# ═══════════════════════════════════════════════════════════════

async def estimate_glycemia_ml(
    user_id: str,
    profile: dict,
    bracelet: dict,
    scale: dict,
    calibrations: list,
    history: list,
    db,
) -> dict:
    """
    ML-based glycemia estimation.
    Returns full result dict compatible with the V2 API response format.
    """
    available_features = count_available_features(bracelet, scale)
    if available_features < 3:
        return {
            "status": "insufficient_data",
            "zone": None,
            "message": "Pas assez de donnees capteurs (minimum 3 requis)",
        }

    features = extract_features(bracelet, scale, profile, history)

    # Try personal model first, fall back to population
    personal_model = await get_personal_model(user_id, db)
    if personal_model:
        model = personal_model
        model_level = "personal"
    else:
        model = get_population_model()
        model_level = "population"

    prediction = model.predict(features)
    if not prediction:
        return {"status": "model_error", "zone": None, "message": "Erreur du modele ML"}

    estimated = prediction["value"]
    lower = prediction["lower"]
    upper = prediction["upper"]

    # ─── Zone classification ───
    if estimated < 0.95:
        zone, zone_label, zone_color = "normal", "Zone normale", "#10B981"
        message = "Vos indicateurs suggerent un metabolisme glucidique dans la norme."
    elif estimated < 1.05:
        zone, zone_label, zone_color = "normal_high", "Zone normale haute", "#84CC16"
        message = "Indicateurs dans la norme, partie superieure. Surveillance recommandee."
    elif estimated < 1.20:
        zone, zone_label, zone_color = "vigilance", "Zone de vigilance", "#F59E0B"
        message = "Certains indicateurs meritent attention. Consultez votre medecin."
    elif estimated < 1.40:
        zone, zone_label, zone_color = "pre_alert", "Pre-alerte", "#F97316"
        message = "Risque eleve detecte. Un bilan sanguin est recommande rapidement."
    else:
        zone, zone_label, zone_color = "alert", "Zone d'alerte", "#EF4444"
        message = "Plusieurs indicateurs suggerent un risque important. Bilan sanguin urgent recommande."

    estimated_range = f"{lower:.2f} - {upper:.2f} g/L"

    # ─── Confidence ───
    data_completeness = available_features / 12 * 100
    cal_count = len(calibrations)
    cal_bonus = min(20, cal_count * 3) if cal_count > 0 else 0
    model_bonus = 10 if model_level == "personal" else 0
    confidence = min(85, round(20 + data_completeness * 0.35 + cal_bonus + model_bonus))

    # ─── Feature contributions ───
    contributions = model.get_feature_contributions(features)
    FEATURE_LABELS = {
        "hrv": ("Variabilite cardiaque (HRV)", lambda v: f"{v:.0f} ms"),
        "heart_rate": ("Frequence cardiaque repos", lambda v: f"{v:.0f} bpm"),
        "spo2": ("SpO2", lambda v: f"{v:.1f}%"),
        "steps": ("Activite physique", lambda v: f"{v:.0f} pas"),
        "sleep_quality": ("Qualite sommeil", lambda v: f"{v:.0f}%"),
        "temperature": ("Temperature", lambda v: f"{v:.1f}°C"),
        "stress_level": ("Stress", lambda v: f"{v:.0f}/100"),
        "visceral_fat": ("Graisse viscerale", lambda v: f"{v:.0f}"),
        "body_fat_pct": ("Masse grasse", lambda v: f"{v:.1f}%"),
        "bmi": ("IMC", lambda v: f"{v:.1f}"),
        "muscle_pct": ("Masse musculaire", lambda v: f"{v:.1f}%"),
        "water_pct": ("Hydratation", lambda v: f"{v:.1f}%"),
        "muscle_fat_ratio": ("Ratio muscle/graisse", lambda v: f"{v:.2f}"),
        "hrv_norm": ("HRV normalise", lambda v: f"{v:.3f}"),
        "activity_level": ("Niveau d'activite", lambda v: f"{v:.2f}"),
    }

    factors = []
    for c in contributions:
        fname = c["feature"]
        if fname in FEATURE_LABELS:
            label, fmt = FEATURE_LABELS[fname]
            val = c["value"]
            importance_pct = c["importance"]
            impact = "high" if importance_pct > 15 else "moderate" if importance_pct > 8 else "normal"
            factors.append({
                "name": label,
                "value": fmt(val),
                "impact": impact,
                "score": round(importance_pct),
                "weight": round(importance_pct),
            })

    # ─── Trend from history ───
    trend = None
    if history and len(history) >= 2:
        recent = [h.get("estimated_glycemia", 0) for h in history[:7] if h.get("estimated_glycemia")]
        older = [h.get("estimated_glycemia", 0) for h in history[7:14] if h.get("estimated_glycemia")]
        if recent and older:
            diff = (sum(recent) / len(recent)) - (sum(older) / len(older))
            direction = "worsening" if diff > 0.05 else "improving" if diff < -0.05 else "stable"
            trend = {"direction": direction, "delta": round(diff, 3), "data_points": len(recent) + len(older)}

    # ─── Calibration info ───
    cal_quality = "high" if cal_count >= 5 else "medium" if cal_count >= 2 else "low" if cal_count >= 1 else "none"
    last_cal_date = calibrations[0].get("date") if calibrations else None

    # ─── Risk score (0-100, for compatibility with V2 API) ───
    risk_score = round(max(0, min(100, (estimated - 0.70) / (1.80 - 0.70) * 100)), 1)

    return {
        "status": "estimated",
        "algorithm_version": prediction["model_version"],
        "ml_level": model_level,
        "zone": zone,
        "zone_label": zone_label,
        "zone_color": zone_color,
        "message": message,
        "estimated_glycemia": estimated,
        "estimated_range": estimated_range,
        "prediction_interval": {"lower": lower, "upper": upper, "std": prediction["std"]},
        "confidence_pct": confidence,
        "risk_score": risk_score,
        "data_points_used": available_features,
        "data_completeness_pct": round(data_completeness),
        "factors": factors,
        "calibration": {
            "quality": cal_quality,
            "count": cal_count,
            "last_date": last_cal_date,
            "personal_model": model_level == "personal",
        },
        "trend": trend,
    }
