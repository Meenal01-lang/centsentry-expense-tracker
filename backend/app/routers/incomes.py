from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/incomes", tags=["Income Management"])

@router.post("", response_model=schemas.IncomeResponse, status_code=status.HTTP_201_CREATED)
def create_income(
    income_data: schemas.IncomeCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    new_income = models.Income(
        user_id=current_user.id,
        source=income_data.source,
        amount=income_data.amount,
        date=income_data.date,
        notes=income_data.notes
    )
    db.add(new_income)
    db.commit()
    db.refresh(new_income)
    return new_income

@router.get("", response_model=List[schemas.IncomeResponse])
def read_incomes(
    search: Optional[str] = Query(None, description="Search source or notes"),
    start_date: Optional[date] = Query(None, description="Filter from date"),
    end_date: Optional[date] = Query(None, description="Filter to date"),
    sort_by: Optional[str] = Query("date", description="Field to sort by (date or amount)"),
    sort_order: Optional[str] = Query("desc", description="Sort order (asc or desc)"),
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(models.Income).filter(models.Income.user_id == current_user.id)
    
    # Filtering
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                models.Income.source.ilike(search_filter),
                models.Income.notes.ilike(search_filter)
            )
        )
    if start_date:
        query = query.filter(models.Income.date >= start_date)
    if end_date:
        query = query.filter(models.Income.date <= end_date)
        
    # Sorting
    sort_field = models.Income.date if sort_by == "date" else models.Income.amount
    if sort_order == "desc":
        query = query.order_by(desc(sort_field))
    else:
        query = query.order_by(asc(sort_field))
        
    return query.all()

@router.get("/{income_id}", response_model=schemas.IncomeResponse)
def read_income(
    income_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found"
        )
    return income

@router.put("/{income_id}", response_model=schemas.IncomeResponse)
def update_income(
    income_id: int,
    income_data: schemas.IncomeUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found"
        )
    
    # Update fields if provided
    for field, value in income_data.model_dump(exclude_unset=True).items():
        setattr(income, field, value)
        
    db.commit()
    db.refresh(income)
    return income

@router.delete("/{income_id}", status_code=status.HTTP_200_OK)
def delete_income(
    income_id: int,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id
    ).first()
    if not income:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Income record not found"
        )
    
    db.delete(income)
    db.commit()
    return {"message": "Income record deleted successfully"}
