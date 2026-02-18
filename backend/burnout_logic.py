import joblib
import numpy as np

model = joblib.load("burnout_model.pkl")

def calculate_burnout(employee):
    # The ML model was trained with performance_score in 2.0-5.0 range.
    # The DB stores scores on a 0-100 scale, so we need to normalize.
    perf = employee.performance_score
    if perf > 5:
        # Map 0-100 scale to 2.0-5.0 scale (model's training range)
        perf = 2.0 + (perf / 100.0) * 3.0

    features = np.array([[
        employee.weekly_work_hours,
        employee.overtime_hours,
        employee.meeting_hours,
        perf
    ]])

    try:
        probability = model.predict_proba(features)[0][1]
        return round(probability * 100, 2)
    except Exception:
        # Fallback: rule-based calculation if model fails
        score = 0
        if employee.weekly_work_hours > 50:
            score += 30
        if employee.overtime_hours > 10:
            score += 25
        if employee.meeting_hours > 15:
            score += 15
        if perf < 3:
            score += 20
        return min(score, 100)


def generate_explanation(employee, score):

    if score > 70:
        return "High overtime and work hours indicate elevated burnout risk."
    elif score > 40:
        return "Moderate workload suggests medium burnout risk."
    else:
        return "Workload appears balanced with low burnout risk."