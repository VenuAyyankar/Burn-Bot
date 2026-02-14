from sqlalchemy.orm import Session
from models import Employee

def create_employee(db: Session, employee):
    db_employee = Employee(**employee.dict())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee

def get_all_employees(db: Session):
    return db.query(Employee).all()

def get_employee(db: Session, employee_id: int):
    return db.query(Employee).filter(Employee.id == employee_id).first()