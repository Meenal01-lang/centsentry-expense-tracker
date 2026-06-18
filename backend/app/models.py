import datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    budget = relationship("Budget", back_populates="user", uselist=False, cascade="all, delete-orphan")


class Income(Base):
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    source = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False, index=True)
    notes = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="incomes")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True) # Food, Shopping, Travel, etc.
    date = Column(Date, nullable=False, index=True)
    notes = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="expenses")


class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    monthly_budget = Column(Float, nullable=False, default=0.0)

    # Relationships
    user = relationship("User", back_populates="budget")
