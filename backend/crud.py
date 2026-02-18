from sqlalchemy.orm import Session
from models import Employee, Dataset

# ========== Datasets ==========

def create_dataset(db: Session, name: str):
    ds = Dataset(name=name)
    db.add(ds)
    db.commit()
    db.refresh(ds)
    return ds

def get_all_datasets(db: Session):
    return db.query(Dataset).order_by(Dataset.created_at.desc()).all()

def get_dataset(db: Session, dataset_id: int):
    return db.query(Dataset).filter(Dataset.id == dataset_id).first()

def get_dataset_by_name(db: Session, name: str):
    return db.query(Dataset).filter(Dataset.name == name).first()

def delete_dataset(db: Session, dataset_id: int):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if ds:
        db.delete(ds)  # cascade deletes employees
        db.commit()
        return True
    return False

def rename_dataset(db: Session, dataset_id: int, new_name: str):
    ds = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if ds:
        ds.name = new_name
        db.commit()
        db.refresh(ds)
        return ds
    return None

# ========== Employees ==========

def create_employee(db: Session, employee):
    db_employee = Employee(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def get_all_employees(db: Session, dataset_id: int = None):
    q = db.query(Employee)
    if dataset_id is not None:
        q = q.filter(Employee.dataset_id == dataset_id)
    return q.all()

def get_employee(db: Session, employee_id: int):
    return db.query(Employee).filter(Employee.id == employee_id).first()

def delete_employee(db: Session, employee_id: int):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if emp:
        db.delete(emp)
        db.commit()
        return True
    return False

def update_employee(db: Session, employee_id: int, data: dict):
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        return None
    for key, value in data.items():
        if hasattr(emp, key):
            setattr(emp, key, value)
    db.commit()
    db.refresh(emp)
    return emp