from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EmployeeCreate(BaseModel):
    name: str
    department: str
    weekly_work_hours: float
    overtime_hours: float
    tasks_completed: int
    meeting_hours: float
    leave_days_last_3_months: int
    performance_score: float
    dataset_id: Optional[int] = None

class EmployeeResponse(EmployeeCreate):
    id: int

    class Config:
        from_attributes = True

class DatasetCreate(BaseModel):
    name: str

class DatasetResponse(BaseModel):
    id: int
    name: str
    created_at: datetime
    employee_count: int = 0

    class Config:
        from_attributes = True