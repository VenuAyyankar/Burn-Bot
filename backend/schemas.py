from pydantic import BaseModel

class EmployeeCreate(BaseModel):
    name: str
    department: str
    weekly_work_hours: float
    overtime_hours: float
    tasks_completed: int
    meeting_hours: float
    leave_days_last_3_months: int
    performance_score: float

class EmployeeResponse(EmployeeCreate):
    id: int

    class Config:
        orm_mode = True