from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import date, datetime

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None

# User schemas
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)

class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

# Income schemas
class IncomeCreate(BaseModel):
    source: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    date: date
    notes: Optional[str] = None

class IncomeUpdate(BaseModel):
    source: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    date: Optional[date] = None
    notes: Optional[str] = None

class IncomeResponse(BaseModel):
    id: int
    user_id: int
    source: str
    amount: float
    date: date
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Expense schemas
class ExpenseCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    amount: float = Field(..., gt=0)
    category: str = Field(..., min_length=1, max_length=50) # e.g. Food, Bills, etc.
    date: date
    notes: Optional[str] = None

class ExpenseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=100)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[str] = Field(None, min_length=1, max_length=50)
    date: Optional[date] = None
    notes: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    title: str
    amount: float
    category: str
    date: date
    notes: Optional[str] = None

    class Config:
        from_attributes = True

# Budget schemas
class BudgetCreate(BaseModel):
    monthly_budget: float = Field(..., ge=0)

class BudgetResponse(BaseModel):
    id: int
    user_id: int
    monthly_budget: float

    class Config:
        from_attributes = True

# Analytics and Dashboards schemas
class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    current_balance: float
    monthly_budget: float
    budget_used_percentage: float
    budget_remaining: float
    exceeded_budget: bool

class CategoryBreakdownItem(BaseModel):
    category: str
    amount: float
    percentage: float

class MonthlySummaryItem(BaseModel):
    month: str # e.g. "2026-06"
    income: float
    expense: float

class SpendingInsightItem(BaseModel):
    type: str # "warning", "info", "success"
    message: str
    category: Optional[str] = None
    difference_percentage: Optional[float] = None
