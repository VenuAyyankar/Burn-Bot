def calculate_burnout(employee):

    score = (
        employee.overtime_hours * 2 +
        employee.meeting_hours +
        (50 - employee.performance_score * 10)
    )

    if score < 0:
        score = 0
    if score > 100:
        score = 100

    return round(score, 2)