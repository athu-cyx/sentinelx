from pathlib import Path

import joblib
import pandas as pd


# ---------------------------------------------------------
# Locate trained SentinelX ML model
# ---------------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[3]

MODEL_PATH = (
    BASE_DIR
    / "ml"
    / "models"
    / "sentinelx_anomaly_model.joblib"
)


# ---------------------------------------------------------
# Load trained model
# ---------------------------------------------------------

model = joblib.load(MODEL_PATH)


# ---------------------------------------------------------
# Features expected by the ML model
# ---------------------------------------------------------

FEATURES = [
    "failed_login_count",
    "login_hour",
    "new_device",
    "new_ip",
    "unique_locations",
    "request_frequency",
]


# ---------------------------------------------------------
# ML Prediction
# ---------------------------------------------------------

def predict_anomaly(
    failed_login_count: int,
    login_hour: int,
    new_device: int,
    new_ip: int,
    unique_locations: int,
    request_frequency: int,
) -> dict:
    """
    Predict whether the supplied security behavior
    is anomalous.
    """

    input_data = pd.DataFrame(
        [[
            failed_login_count,
            login_hour,
            new_device,
            new_ip,
            unique_locations,
            request_frequency,
        ]],
        columns=FEATURES,
    )

    prediction = int(
        model.predict(input_data)[0]
    )

    if prediction == 1:
        return {
            "anomaly": True,
            "label": "anomalous",
            "message": (
                "Unusual security behavior detected "
                "by ML model."
            ),
        }

    return {
        "anomaly": False,
        "label": "normal",
        "message": (
            "Security behavior appears normal."
        ),
    }


# ---------------------------------------------------------
# Prepare ML feature information
# ---------------------------------------------------------

def calculate_event_features(
    failed_login_count: int,
    login_hour: int,
    new_device: int,
    new_ip: int,
    unique_locations: int,
    request_frequency: int,
) -> dict:
    """
    Prepare security behavior features
    and run ML prediction.
    """

    prediction = predict_anomaly(
        failed_login_count=failed_login_count,
        login_hour=login_hour,
        new_device=new_device,
        new_ip=new_ip,
        unique_locations=unique_locations,
        request_frequency=request_frequency,
    )

    return {
        "features": {
            "failed_login_count": failed_login_count,
            "login_hour": login_hour,
            "new_device": new_device,
            "new_ip": new_ip,
            "unique_locations": unique_locations,
            "request_frequency": request_frequency,
        },
        "prediction": prediction,
    }
    