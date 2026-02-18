from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    employees = relationship("Employee", back_populates="dataset", cascade="all, delete-orphan")

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
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=True)

    dataset = relationship("Dataset", back_populates="employees")