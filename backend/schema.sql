-- PostgreSQL Schema for Personal Expense Tracker

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing user email for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Create Incomes Table
CREATE TABLE IF NOT EXISTS incomes (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    CONSTRAINT chk_income_amount CHECK (amount > 0)
);

-- Indexing user_id and dates for query optimizations
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_source ON incomes(source);

-- 3. Create Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    notes TEXT,
    CONSTRAINT chk_expense_amount CHECK (amount > 0)
);

-- Indexing user_id, category, and date for queries/aggregations
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_title ON expenses(title);

-- 4. Create Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monthly_budget DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    CONSTRAINT chk_budget_amount CHECK (monthly_budget >= 0)
);

-- Indexing user_id
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
