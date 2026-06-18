import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from .. import models, schemas, auth

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Insights"])

@router.get("/dashboard-summary", response_model=schemas.DashboardSummary)
def get_dashboard_summary(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Calculate overall balance (all-time income - all-time expenses)
    total_income_all = db.query(func.sum(models.Income.amount)).filter(
        models.Income.user_id == current_user.id
    ).scalar() or 0.0

    total_expense_all = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id
    ).scalar() or 0.0

    current_balance = total_income_all - total_expense_all

    # Current month's boundaries
    today = datetime.date.today()
    start_of_month = datetime.date(today.year, today.month, 1)
    if today.month == 12:
        end_of_month = datetime.date(today.year, 12, 31)
    else:
        end_of_month = datetime.date(today.year, today.month + 1, 1) - datetime.timedelta(days=1)

    # Current month's income
    total_income_month = db.query(func.sum(models.Income.amount)).filter(
        models.Income.user_id == current_user.id,
        models.Income.date >= start_of_month,
        models.Income.date <= today
    ).scalar() or 0.0

    # Current month's expenses
    total_expense_month = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.date >= start_of_month,
        models.Expense.date <= today
    ).scalar() or 0.0

    # Get budget
    budget_record = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first()
    monthly_budget = budget_record.monthly_budget if budget_record else 0.0

    # Budget computations
    budget_remaining = max(0.0, monthly_budget - total_expense_month)
    budget_used_percentage = 0.0
    if monthly_budget > 0:
        budget_used_percentage = round((total_expense_month / monthly_budget) * 100, 2)
    
    exceeded_budget = total_expense_month > monthly_budget if monthly_budget > 0 else False

    return {
        "total_income": total_income_month,
        "total_expenses": total_expense_month,
        "current_balance": current_balance,
        "monthly_budget": monthly_budget,
        "budget_used_percentage": budget_used_percentage,
        "budget_remaining": budget_remaining,
        "exceeded_budget": exceeded_budget
    }


@router.get("/category-breakdown", response_model=List[schemas.CategoryBreakdownItem])
def get_category_breakdown(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Total expenses for the current month
    today = datetime.date.today()
    start_of_month = datetime.date(today.year, today.month, 1)
    
    total_expenses = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.date >= start_of_month
    ).scalar() or 0.0

    # Grouped expenses
    category_expenses = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.date >= start_of_month
    ).group_by(models.Expense.category).all()

    breakdown = []
    for cat, amt in category_expenses:
        percentage = 0.0
        if total_expenses > 0:
            percentage = round((amt / total_expenses) * 100, 2)
        breakdown.append({
            "category": cat,
            "amount": amt,
            "percentage": percentage
        })
    
    # Sort by amount descending
    breakdown.sort(key=lambda x: x["amount"], reverse=True)
    return breakdown


@router.get("/monthly-summary", response_model=List[schemas.MonthlySummaryItem])
def get_monthly_summary(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Return last 6 months of spending
    today = datetime.date.today()
    months_list = []
    
    # Generate last 6 months keys
    for i in range(5, -1, -1):
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        months_list.append((year, month))

    summary = []
    for yr, mn in months_list:
        month_str = f"{yr}-{mn:02d}"
        start_date = datetime.date(yr, mn, 1)
        if mn == 12:
            end_date = datetime.date(yr, 12, 31)
        else:
            end_date = datetime.date(yr, mn + 1, 1) - datetime.timedelta(days=1)

        inc_total = db.query(func.sum(models.Income.amount)).filter(
            models.Income.user_id == current_user.id,
            models.Income.date >= start_date,
            models.Income.date <= end_date
        ).scalar() or 0.0

        exp_total = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.date >= start_date,
            models.Expense.date <= end_date
        ).scalar() or 0.0

        summary.append({
            "month": month_str,
            "income": inc_total,
            "expense": exp_total
        })

    return summary


@router.get("/insights", response_model=List[schemas.SpendingInsightItem])
def get_spending_insights(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    insights = []
    today = datetime.date.today()
    
    # Current month dates
    cur_start = datetime.date(today.year, today.month, 1)
    
    # Previous month dates
    prev_month = today.month - 1
    prev_year = today.year
    if prev_month == 0:
        prev_month = 12
        prev_year -= 1
    prev_start = datetime.date(prev_year, prev_month, 1)
    prev_end = cur_start - datetime.timedelta(days=1)

    # 1. Budget Alerts
    budget_record = db.query(models.Budget).filter(models.Budget.user_id == current_user.id).first()
    monthly_budget = budget_record.monthly_budget if budget_record else 0.0

    cur_total_expenses = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.date >= cur_start
    ).scalar() or 0.0

    if monthly_budget > 0:
        pct_used = (cur_total_expenses / monthly_budget) * 100
        if pct_used > 100:
            insights.append({
                "type": "warning",
                "message": f"Budget Exceeded! You have spent {cur_total_expenses - monthly_budget:.2f} more than your monthly budget limit of {monthly_budget:.2f}."
            })
        elif pct_used >= 80:
            insights.append({
                "type": "warning",
                "message": f"Budget Warning: You have used {pct_used:.1f}% of your monthly budget ({cur_total_expenses:.2f} / {monthly_budget:.2f})."
            })
        elif pct_used > 0:
            insights.append({
                "type": "success",
                "message": f"Good job! You have {monthly_budget - cur_total_expenses:.2f} remaining in your budget."
            })

    # 2. MoM category spending changes
    cur_cat_expenses = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.date >= cur_start
    ).group_by(models.Expense.category).all()

    prev_cat_expenses = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label("total")
    ).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.date >= prev_start,
        models.Expense.date <= prev_end
    ).group_by(models.Expense.category).all()

    prev_cat_dict = {cat: tot for cat, tot in prev_cat_expenses}

    for cat, cur_tot in cur_cat_expenses:
        if cat in prev_cat_dict:
            prev_tot = prev_cat_dict[cat]
            if prev_tot > 0:
                diff_pct = ((cur_tot - prev_tot) / prev_tot) * 100
                if diff_pct >= 10:
                    insights.append({
                        "type": "warning",
                        "message": f"You spent {diff_pct:.1f}% more on {cat} this month compared to last month ({cur_tot:.2f} vs {prev_tot:.2f}).",
                        "category": cat,
                        "difference_percentage": round(diff_pct, 2)
                    })
                elif diff_pct <= -10:
                    insights.append({
                        "type": "success",
                        "message": f"Great! Your spending on {cat} decreased by {abs(diff_pct):.1f}% compared to last month ({cur_tot:.2f} vs {prev_tot:.2f}).",
                        "category": cat,
                        "difference_percentage": round(diff_pct, 2)
                    })

    # 3. Income vs Expense Comparison for this month
    cur_total_income = db.query(func.sum(models.Income.amount)).filter(
        models.Income.user_id == current_user.id,
        models.Income.date >= cur_start
    ).scalar() or 0.0

    if cur_total_income > 0 and cur_total_expenses > 0:
        if cur_total_expenses > cur_total_income:
            insights.append({
                "type": "warning",
                "message": f"This month, your expenses ({cur_total_expenses:.2f}) exceed your income ({cur_total_income:.2f}). Watch your savings!"
            })
        else:
            savings = cur_total_income - cur_total_expenses
            savings_pct = (savings / cur_total_income) * 100
            insights.append({
                "type": "success",
                "message": f"Healthy savings rate! You saved {savings_pct:.1f}% of your income this month ({savings:.2f} saved)."
            })

    # Fallback insight if empty
    if not insights:
        insights.append({
            "type": "info",
            "message": "Add transactions to generate custom spending insights and budget alerts."
        })

    return insights
