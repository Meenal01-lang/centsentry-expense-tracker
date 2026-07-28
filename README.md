# 💰 CentSentry – Full Stack Expense Tracker with Power BI Analytics

CentSentry is a modern Full Stack Expense Tracker that helps users manage personal finances through secure expense tracking, budget management, and interactive analytics. The application is built using React, FastAPI, PostgreSQL, and JWT Authentication, and now includes Power BI dashboards for advanced financial insights.

---

## 🚀 Features

### 🔐 Authentication
- Secure JWT-based Authentication
- User Registration & Login
- Protected Routes
- Password Encryption

### 💳 Expense Management
- Add, Edit, and Delete Transactions
- Track Income and Expenses
- Categorize Transactions
- Payment Method Support
- Transaction History

### 📊 Dashboard & Analytics
- Current Balance
- Total Income
- Total Expenses
- Monthly Financial Summary
- Interactive Charts using Recharts
- Category-wise Spending Analysis

### 📈 Power BI Dashboard
- Export Transactions to CSV
- Interactive Power BI Dashboard
- Executive Financial Summary
- Monthly Expense Trends
- Category-wise Expense Distribution
- Top Spending Categories
- Income vs Expense Analysis

---

# 🛠️ Tech Stack

## Frontend
- React
- TypeScript
- Tailwind CSS
- React Router
- Recharts

## Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- JWT Authentication
- Pydantic

## Data Analytics
- Power BI
- Power Query
- CSV Export

## Tools
- Git
- GitHub
- VS Code

---

# 📂 Project Structure

```
centsentry-expense-tracker/
│
├── frontend/
├── backend/
├── powerbi/
│   └── dashboard_preview.png
├── README.md
└── ...
```

---

# ⚙️ Installation

## 1. Clone Repository

```bash
git clone https://github.com/Meenal01-lang/centsentry-expense-tracker.git

cd centsentry-expense-tracker
```

---

## 2. Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend runs at:

```
http://localhost:8000
```

---

## 3. Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 4. PostgreSQL Configuration

Create a PostgreSQL database and update your database connection settings in the backend configuration file or `.env`.

Example:

```
DATABASE_URL=postgresql://username:password@localhost:5432/centsentry
JWT_SECRET_KEY=your_secret_key
```

---

# 📊 Power BI Dashboard

The project includes a Power BI dashboard built using exported transaction data.

### Dashboard Highlights

- Executive Summary
- Total Income
- Total Expenses
- Current Balance
- Monthly Expense Trend
- Category-wise Expense Distribution
- Income vs Expense Comparison
- Top Spending Categories

### Dashboard Preview

![Power BI Dashboard](powerbi/dashboard_preview.png)

---

# 📁 Using Power BI

1. Export transactions from the application using the **Export CSV** feature.
2. Open Power BI Desktop.
3. Import the generated CSV file.
4. Refresh the dashboard to visualize the latest financial data.

---

# 🔒 Security Features

- JWT Authentication
- Password Hashing
- Protected API Routes
- Secure User Sessions

---

# 📈 Future Improvements

- Direct PostgreSQL Integration with Power BI
- Budget Alerts
- Recurring Transactions
- AI-powered Spending Insights
- Financial Forecasting
- Email Notifications
- Dark Mode

---

# 📸 Screenshots

### Dashboard

(Add your application dashboard screenshot here.)

### Power BI Dashboard

Included above.

---

# 👩‍💻 Author

**Meenal Rao**

GitHub:
https://github.com/Meenal01-lang

---

## ⭐ If you found this project useful, consider giving it a star!

