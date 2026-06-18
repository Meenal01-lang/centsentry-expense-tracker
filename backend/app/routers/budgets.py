from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/budget", tags=["Budget Tracking"])

@router.get("", response_model=schemas.BudgetResponse)
def get_budget(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first()
    if not budget:
        # Create a default budget if none exists
        budget = models.Budget(user_id=current_user.id, monthly_budget=0.0)
        db.add(budget)
        db.commit()
        db.refresh(budget)
    return budget

@router.put("", response_model=schemas.BudgetResponse)
def set_budget(
    budget_data: schemas.BudgetCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    budget = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first()
    if not budget:
        budget = models.Budget(user_id=current_user.id, monthly_budget=budget_data.monthly_budget)
        db.add(budget)
    else:
        budget.monthly_budget = budget_data.monthly_budget
        
    db.commit()
    db.refresh(budget)
    return budget
