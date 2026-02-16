import joblib
import numpy as np

model = joblib.load("burnout_model.pkl")

def calculate_burnout(employee):

    features = np.array([[
        employee.weekly_work_hours,
        employee.overtime_hours,
        employee.meeting_hours,
        employee.performance_score
    ]])

    probability = model.predict_proba(features)[0][1]

    return round(probability * 100, 2)


def generate_explanation(employee, score):

    if score > 70:
        return "High overtime and work hours indicate elevated burnout risk."
    elif score > 40:
        return "Moderate workload suggests medium burnout risk."
    else:
        return "Workload appears balanced with low burnout risk."