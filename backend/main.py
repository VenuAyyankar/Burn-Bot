from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends, File, UploadFile, HTTPException, Form, Query
from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
import crud
import schemas
from burnout_logic import calculate_burnout, generate_explanation
from sample_data import insert_sample_data
import pandas as pd
import io
from typing import Optional

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ========== Dataset Endpoints ==========

@app.post("/datasets")
def create_dataset(dataset: schemas.DatasetCreate, db: Session = Depends(get_db)):
    existing = crud.get_dataset_by_name(db, dataset.name)
    if existing:
        raise HTTPException(status_code=400, detail="A dataset with this name already exists")
    ds = crud.create_dataset(db, dataset.name)
    return {"id": ds.id, "name": ds.name, "created_at": ds.created_at, "employee_count": 0}

@app.get("/datasets")
def get_datasets(db: Session = Depends(get_db)):
    datasets = crud.get_all_datasets(db)
    result = []
    for ds in datasets:
        count = len(ds.employees)
        result.append({
            "id": ds.id,
            "name": ds.name,
            "created_at": ds.created_at,
            "employee_count": count
        })
    return result

@app.delete("/datasets/{dataset_id}")
def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    if crud.delete_dataset(db, dataset_id):
        return {"message": f"Dataset {dataset_id} and all its employees deleted"}
    return {"error": "Dataset not found"}

@app.put("/datasets/{dataset_id}")
def rename_dataset(dataset_id: int, dataset: schemas.DatasetCreate, db: Session = Depends(get_db)):
    updated = crud.rename_dataset(db, dataset_id, dataset.name)
    if updated:
        return {"id": updated.id, "name": updated.name, "created_at": updated.created_at}
    return {"error": "Dataset not found"}

# ========== Employee Endpoints ==========

@app.post("/employees", response_model=schemas.EmployeeResponse)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    return crud.create_employee(db, employee)

@app.get("/employees")
def get_employees(dataset_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    return crud.get_all_employees(db, dataset_id=dataset_id)

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

@app.delete("/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    if crud.delete_employee(db, employee_id):
        return {"message": f"Employee {employee_id} deleted"}
    return {"error": "Employee not found"}

@app.put("/employees/{employee_id}")
def update_employee(employee_id: int, employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    updated = crud.update_employee(db, employee_id, employee.dict())
    if updated:
        return updated
    return {"error": "Employee not found"}

@app.delete("/employees")
def delete_all_employees(dataset_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    if dataset_id is not None:
        emps = db.query(models.Employee).filter(models.Employee.dataset_id == dataset_id)
        count = emps.count()
        emps.delete()
    else:
        count = db.query(models.Employee).count()
        db.query(models.Employee).delete()
    db.commit()
    return {"message": f"Deleted {count} employees"}

@app.post("/load-sample-data")
def load_sample(db: Session = Depends(get_db)):
    insert_sample_data(db)
    return {"message": "Sample data inserted"}

@app.get("/analytics")
def analytics(dataset_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    employees = crud.get_all_employees(db, dataset_id=dataset_id)
    result = []
    for emp in employees:
        score = calculate_burnout(emp)
        result.append({
            "id": emp.id,
            "name": emp.name,
            "department": emp.department,
            "weekly_work_hours": emp.weekly_work_hours,
            "overtime_hours": emp.overtime_hours,
            "burnout_score": score,
            "dataset_id": emp.dataset_id
        })
    return result


@app.post("/upload-employees")
async def upload_employees(
    file: UploadFile = File(...),
    dataset_name: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Upload employees from CSV or Excel file, optionally into a named dataset."""
    filename = file.filename.lower()
    contents = await file.read()

    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xlsx", ".xls")):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload a .csv, .xlsx, or .xls file.")
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=400, detail=f"Could not parse file: {str(e)}")

    # Create or find the dataset
    dataset_id = None
    if dataset_name and dataset_name.strip():
        dataset_name = dataset_name.strip()
        ds = crud.get_dataset_by_name(db, dataset_name)
        if not ds:
            ds = crud.create_dataset(db, dataset_name)
        dataset_id = ds.id

    # Strip BOM and whitespace from column names
    df.columns = [str(col).strip().lstrip('\ufeff') for col in df.columns]

    # Map from NORMALIZED name to the expected model field name
    column_map = {
        "name": "name", "fullname": "name", "employeename": "name", "empname": "name", "employee": "name",
        "department": "department", "dept": "department",
        "weeklyworkhours": "weekly_work_hours", "weeklyhours": "weekly_work_hours", "workhours": "weekly_work_hours",
        "hoursperweek": "weekly_work_hours", "weeklyhoursworked": "weekly_work_hours", "workinghours": "weekly_work_hours",
        "hours": "weekly_work_hours", "weeklyhrs": "weekly_work_hours", "workhrs": "weekly_work_hours",
        "overtimehours": "overtime_hours", "overtime": "overtime_hours", "othours": "overtime_hours",
        "ot": "overtime_hours", "extrahours": "overtime_hours",
        "taskscompleted": "tasks_completed", "tasks": "tasks_completed", "completedtasks": "tasks_completed",
        "taskcount": "tasks_completed", "totaltasks": "tasks_completed", "notasks": "tasks_completed",
        "numberoftasks": "tasks_completed",
        "meetinghours": "meeting_hours", "meetings": "meeting_hours", "meetinghrs": "meeting_hours",
        "meetingtime": "meeting_hours",
        "leavedayslast3months": "leave_days_last_3_months", "leavedays": "leave_days_last_3_months",
        "leaves": "leave_days_last_3_months", "leavedays3months": "leave_days_last_3_months",
        "leavecount": "leave_days_last_3_months", "daysoff": "leave_days_last_3_months",
        "leavebalance": "leave_days_last_3_months", "leave": "leave_days_last_3_months",
        "leavedayslast3month": "leave_days_last_3_months",
        "performancescore": "performance_score", "performance": "performance_score",
        "performancerating": "performance_score", "rating": "performance_score",
        "perfscore": "performance_score", "score": "performance_score",
    }

    df_col_to_model = {}
    for col in df.columns:
        norm_col = ''.join(c for c in str(col).lower() if c.isalnum())
        if norm_col in column_map:
            df_col_to_model[col] = column_map[norm_col]

    required_fields = {
        "name", "department", "weekly_work_hours", "overtime_hours",
        "tasks_completed", "meeting_hours", "leave_days_last_3_months", "performance_score"
    }

    found_fields = set(df_col_to_model.values())
    missing = required_fields - found_fields

    if missing:
        detected = [str(c) for c in df.columns]
        raise HTTPException(
            status_code=400,
            detail=f"Missing required columns: {', '.join(sorted(missing))}. "
                   f"Your file has these columns: {detected}. "
                   f"Please rename them to match: Name, Department, Weekly Work Hours, "
                   f"Overtime Hours, Tasks Completed, Meeting Hours, Leave Days, Performance Score"
        )

    added = 0
    errors = []
    
    for idx, row in df.iterrows():
        try:
            def get_val(field):
                for col, f in df_col_to_model.items():
                    if f == field:
                        return row[col]
                return None

            emp = models.Employee(
                name=str(get_val("name")).strip(),
                department=str(get_val("department")).strip(),
                weekly_work_hours=float(get_val("weekly_work_hours")),
                overtime_hours=float(get_val("overtime_hours")),
                tasks_completed=int(get_val("tasks_completed")),
                meeting_hours=float(get_val("meeting_hours")),
                leave_days_last_3_months=int(get_val("leave_days_last_3_months")),
                performance_score=float(get_val("performance_score")),
                dataset_id=dataset_id,
            )
            db.add(emp)
            added += 1
        except Exception as e:
            errors.append(f"Row {idx + 2}: {str(e)}")

    db.commit()

    result = {"message": f"Successfully imported {added} employee(s).", "added": added}
    if dataset_id:
        result["dataset_id"] = dataset_id
        result["dataset_name"] = dataset_name
    if errors:
        result["warnings"] = errors[:10]
    return result