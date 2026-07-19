import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib

# ---- GENERATE SYNTHETIC DATASET ----
np.random.seed(42)
data_size = 5000

df = pd.DataFrame({
    "pain": np.random.randint(0, 10, data_size),
    "symptom_score": np.random.randint(0, 100, data_size),
    "wound_status": np.random.choice([0, 1, 2, 3, 4], data_size),  # encoded
})

# Target variables
df["recovery_rate"] = 100 - (df["pain"] * 8) - (df["symptom_score"] * 0.4) - (df["wound_status"] * 5)
df["recovery_rate"] = df["recovery_rate"].clip(0, 100)

df["risk_rate"] = (df["pain"] * 7) + (df["symptom_score"] * 0.6) + (df["wound_status"] * 8)
df["risk_rate"] = df["risk_rate"].clip(0, 100)

# ---- TRAIN MODELS ----
X = df[["pain", "symptom_score", "wound_status"]]

risk_model = RandomForestRegressor()
risk_model.fit(X, df["risk_rate"])

recovery_model = RandomForestRegressor()
recovery_model.fit(X, df["recovery_rate"])

# ---- SAVE MODELS ----
joblib.dump(risk_model, "risk_model.pkl")
joblib.dump(recovery_model, "recovery_model.pkl")

print("✔ Training completed!")
print("✔ risk_model.pkl and recovery_model.pkl created.")
