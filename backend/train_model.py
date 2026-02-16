import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
import joblib

np.random.seed(42)

data_size = 500

data = pd.DataFrame({
    "weekly_work_hours": np.random.randint(35, 65, data_size),
    "overtime_hours": np.random.randint(0, 25, data_size),
    "meeting_hours": np.random.randint(2, 20, data_size),
    "performance_score": np.random.uniform(2.0, 5.0, data_size),
})

data["burnout"] = (
    (data["overtime_hours"] > 12) |
    (data["weekly_work_hours"] > 55) |
    (data["performance_score"] < 3)
).astype(int)

X = data.drop("burnout", axis=1)
y = data["burnout"]

model = LogisticRegression()
model.fit(X, y)

joblib.dump(model, "burnout_model.pkl")

print("Model trained and saved.")