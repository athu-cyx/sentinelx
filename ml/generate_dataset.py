import random
import pandas as pd
from pathlib import Path


random.seed(42)

ROWS = 1000

data = []

for _ in range(ROWS):
    # Normal login behavior
    failed_login_count = random.randint(0, 3)
    login_hour = random.randint(8, 20)
    new_device = random.choice([0, 0, 0, 1])
    new_ip = random.choice([0, 0, 0, 1])
    unique_locations = random.choice([1, 1, 1, 2])
    request_frequency = random.randint(1, 10)

    anomaly = 0

    # Suspicious behavior
    if random.random() < 0.25:
        failed_login_count = random.randint(5, 30)
        login_hour = random.choice(
            [0, 1, 2, 3, 4, 5, 23]
        )
        new_device = random.choice([0, 1])
        new_ip = random.choice([0, 1])
        unique_locations = random.randint(2, 5)
        request_frequency = random.randint(20, 100)

        anomaly = 1

    data.append(
        {
            "failed_login_count": failed_login_count,
            "login_hour": login_hour,
            "new_device": new_device,
            "new_ip": new_ip,
            "unique_locations": unique_locations,
            "request_frequency": request_frequency,
            "anomaly": anomaly,
        }
    )


df = pd.DataFrame(data)

output_path = (
    Path(__file__).parent
    / "data"
    / "security_events.csv"
)

df.to_csv(output_path, index=False)

print("SentinelX ML dataset generated successfully.")
print(f"Dataset location: {output_path}")
print(f"Total records: {len(df)}")
print(f"Normal records: {(df['anomaly'] == 0).sum()}")
print(f"Anomalous records: {(df['anomaly'] == 1).sum()}")