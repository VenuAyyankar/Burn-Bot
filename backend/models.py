from sqlalchemy import Column, Integer, String, Float
from database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    department = Column(String)
    weekly_work_hours = Column(Float)
    overtime_hours = Column(Float)
    tasks_completed = Column(Integer)
    meeting_hours = Column(Float)
    leave_days_last_3_months = Column(Integer)
    performance_score = Column(Float)