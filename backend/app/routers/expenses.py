from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/expenses", tags=["Expense Management"])

# Valid Categories list: Food, Shopping, Travel, Entertainment, Education, Health, Bills, Other
VALID_CATEGORIES = ["Food", "Shopping", "Travel", "Entertainment", "Education", "Health", "Bills", "Other"]

@router.post("", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_data: schemas.ExpenseCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if expense_data.category not in VALID_CATEGORIES:
        # Default to 'Other' if category is invalid
        expense_data.category = "Other"

    new_expense = models.Expense(
        user_id=current_user.id,
        title=expense_data.title,
        amount=expense_data.amount,
        category=expense_data.category,
        date=expense_data.date,
        notes=expense_data.notes
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("", response_model=List[schemas.ExpenseResponse])
def read_expenses(
    search: Optional[str] = Query(None, description="Search title or notes"),
    category: Optional[str] = Query(None, description="Filter by category"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    sort_by: Optional[str] = Query("date", description="Field to sort by (date or amount)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Expense).filter(models.Expense.user_id == current_user.id)
    
    # Filtering
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Expense.title.ilike(search_filter),
                models.Expense.notes.ilike(search_filter)
            )
        )
    if category:
        query = query.filter(models.Expense.category == category)
    if start_date:
        query = query.filter(models.Expense.date >= start_date)
    if end_date:
        query = query.filter(models.Expense.date <= end_date)
        
    # Sorting
    sort_field = models.Expense.date if sort_by == "date" else models.Expense.amount
    if sort_order == "desc":
        query = query.order_by(desc(sort_field))
    else:
        query = query.order_by(asc(sort_field))
        
    return query.all()

@router.get("/{expense_id}", response_model=schemas.ExpenseResponse)
def read_expense(
    expense_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found"
        )
    return expense

@router.put("/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_data: schemas.ExpenseUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found"
        )
        
    # Update fields if provided
    update_dict = expense_data.model_dump(exclude_unset=True)
    if "category" in update_dict and update_dict["category"] not in VALID_CATEGORIES:
        update_dict["category"] = "Other"

    for field, value in update_dict.items():
        setattr(expense, field, value)
        
    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense record not found"
        )
    
    db.delete(expense)
    db.commit()
    return {"message": "Expense record deleted successfully"}
