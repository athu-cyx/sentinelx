import pandas as pd
import joblib

from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report


# Paths
BASE_DIR = Path(__file__).parent
DATA_PATH = BASE_DIR / "data" / "security_events.csv"
MODEL_PATH = BASE_DIR / "models" / "sentinelx_anomaly_model.joblib"


# Load dataset
df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully.")
print(f"Total records: {len(df)}")


# Features used by the ML model
features = [
    "failed_login_count",
    "login_hour",
    "new_device",
    "new_ip",
    "unique_locations",
    "request_frequency",
]

X = df[features]
y = df["anomaly"]


# Split data into training and testing sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)


# Create ML model
model = RandomForestClassifier(
    n_estimators=200,
    random_state=42,
    class_weight="balanced",
)


# Train model
print("Training SentinelX ML model...")
model.fit(X_train, y_train)


# Test model
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print(f"Model Accuracy: {accuracy * 100:.2f}%")

print("\nClassification Report:")
print(classification_report(y_test, predictions))


# Save trained model
joblib.dump(model, MODEL_PATH)

print("\nSentinelX ML model trained successfully.")
print(f"Model saved at: {MODEL_PATH}")