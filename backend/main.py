from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import crud
import schemas
from burnout_logic import calculate_burnout, generate_explanation
from sample_data import insert_sample_data

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/employees", response_model=schemas.EmployeeResponse)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    return crud.create_employee(db, employee)

@app.get("/employees")
def get_employees(db: Session = Depends(get_db)):
    return crud.get_all_employees(db)

@app.get("/burnout/{employee_id}")
def get_burnout(employee_id: int, db: Session = Depends(get_db)):

    employee = crud.get_employee(db, employee_id)

    if not employee:
        return {"error": "Employee not found"}

    score = calculate_burnout(employee)
    explanation = generate_explanation(employee, score)

    return {
        "employee_id": employee_id,
        "burnout_score": score,
        "explanation": explanation
    }

@app.post("/load-sample-data")
def load_sample(db: Session = Depends(get_db)):
    insert_sample_data(db)
    return {"message": "Sample data inserted"}

@app.get("/analytics")
def analytics(db: Session = Depends(get_db)):

    employees = crud.get_all_employees(db)
    result = []

    for emp in employees:
        score = calculate_burnout(emp)

        result.append({
            "id": emp.id,
            "name": emp.name,
            "department": emp.department,
            "weekly_work_hours": emp.weekly_work_hours,
            "overtime_hours": emp.overtime_hours,
            "burnout_score": score
        })

    return result