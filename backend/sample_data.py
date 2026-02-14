from models import Employee

def insert_sample_data(db):

    employees = [
        Employee(
            name="John",
            department="Engineering",
            weekly_work_hours=50,
            overtime_hours=15,
            tasks_completed=20,
            meeting_hours=12,
            leave_days_last_3_months=1,
            performance_score=3.2
        ),
        Employee(
            name="Anita",
            department="HR",
            weekly_work_hours=40,
            overtime_hours=5,
            tasks_completed=15,
            meeting_hours=8,
            leave_days_last_3_months=3,
            performance_score=4.5
        )
    ]

    for emp in employees:
        db.add(emp)

    db.commit()