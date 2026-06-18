# CentSentry - Full-Stack Personal Expense Tracker

CentSentry is a production-ready, interview-grade full-stack Personal Expense Tracker. It features a modern, mobile-responsive user interface with glassmorphism styling, clean architecture, robust user authentication (JWT), category budgets, and deep data analytics.

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS (Dark Mode supported), React Router v6, Axios, Recharts
- **Backend**: FastAPI (Python), SQLAlchemy ORM, SQLite (Local Dev fallback) / PostgreSQL (Production)
- **Database**: PostgreSQL (Production), SQLite (Local Dev)
- **Security**: JWT tokens, bcrypt password hashing

---

## Folder Structure

```text
expense-tracker/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── analytics.py       # Summaries, breakdown, MoM insights
│   │   │   ├── auth.py            # User registration & token generation
│   │   │   ├── budgets.py         # Set and fetch budget limits
│   │   │   ├── expenses.py        # Expense CRUD with filtering & search
│   │   │   ├── incomes.py         # Income CRUD with filtering & search
│   │   │   └── users.py           # Profile details & password modifications
│   │   ├── __init__.py
│   │   ├── auth.py                # JWT tokens & hashing configs
│   │   ├── database.py            # Engine, session, and local db fallback
│   │   ├── main.py                # FastAPI app & CORS rules initialization
│   │   ├── models.py              # SQLAlchemy database tables
│   │   └── schemas.py             # Pydantic validation schemas
│   ├── .env                       # Local environment variables
│   ├── .env.example               # Environment variables template
│   ├── requirements.txt           # Backend package dependencies
│   └── schema.sql                 # PostgreSQL DDL table creations script
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Sidebar.tsx        # Navigation sidebar, theme & auth actions
│   │   ├── context/
│   │   │   ├── AuthContext.tsx    # Auth handlers (login, register, logout)
│   │   │   └── ThemeContext.tsx   # Light/dark mode toggle & local persistence
│   │   ├── pages/
│   │   │   ├── Analytics.tsx      # Recharts visualizations & insights
│   │   │   ├── Dashboard.tsx      # Main dashboard with summaries & recent list
│   │   │   ├── Expenses.tsx       # Expense list, CSV export & CRUD modals
│   │   │   ├── Income.tsx         # Income list, CSV export & CRUD modals
│   │   │   ├── Login.tsx          # Credentials login card
│   │   │   ├── Profile.tsx        # Name updates & password settings
│   │   │   └── Register.tsx       # Signup registration card
│   │   ├── utils/
│   │   │   └── api.ts             # Axios client with JWT headers injection
│   │   ├── App.css
│   │   ├── App.tsx                # Layouts, routing, and provider hooks
│   │   ├── index.css              # Custom base variables and scrollbars
│   │   └── main.tsx               # Render DOM binder
│   ├── postcss.config.js          # PostCSS configuration
│   ├── tailwind.config.js         # Tailwind configuration (animations & dark class)
│   ├── tsconfig.json              # TypeScript compilation specifications
│   └── package.json               # Frontend package scripts
├── deployment.md                  # Vercel & Render deployment guide
└── README.md                      # This setup guide
```

---

## Setup Instructions

### Backend Setup (FastAPI)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - **Windows**: `venv\Scripts\activate`
   - **macOS/Linux**: `source venv/bin/activate`

4. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Setup environment variables:
   - Copy `.env.example` to `.env`.
   - By default, it will fall back to SQLite (`sqlite:///./expense_tracker.db`), creating the database automatically. If you have a local PostgreSQL running, modify the `DATABASE_URL` line.

6. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   - The server will run at `http://127.0.0.1:8000`.
   - Access Swagger interactive API docs at `http://127.0.0.1:8000/docs`.

---

### Frontend Setup (React SPA)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node packages:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   - The React app will start at `http://localhost:5173`.
   - The frontend is preconfigured to route requests to the default local port (`8000`) of the backend.

---

## API Documentation

CentSentry provides standard JSON REST APIs. Access tokens are passed via header: `Authorization: Bearer <TOKEN>`.

### Authentication

- `POST /api/auth/register`: Create a new user. Expects JSON body `UserCreate`. Returns user info.
- `POST /api/auth/login`: Log in and get JWT token. Expects JSON body `UserLogin`. Returns `{ access_token, token_type }`.
- `GET /api/auth/me`: Get profile detail of the current logged-in user. (Protected)

### Expenses (Protected)

- `GET /api/expenses`: Retrieve expenses. Supports query filters: `search`, `category`, `start_date`, `end_date`, `sort_by` (date/amount), `sort_order` (asc/desc).
- `POST /api/expenses`: Add a new expense. Expects JSON body `ExpenseCreate`.
- `GET /api/expenses/{expense_id}`: Retrieve details of a specific expense record.
- `PUT /api/expenses/{expense_id}`: Update an expense. Expects JSON body `ExpenseUpdate`.
- `DELETE /api/expenses/{expense_id}`: Delete an expense.

### Income (Protected)

- `GET /api/incomes`: Retrieve incomes. Supports query filters: `search`, `start_date`, `end_date`, `sort_by` (date/amount), `sort_order` (asc/desc).
- `POST /api/incomes`: Add new income. Expects JSON body `IncomeCreate`.
- `GET /api/incomes/{income_id}`: Retrieve details of a specific income record.
- `PUT /api/incomes/{income_id}`: Update income. Expects JSON body `IncomeUpdate`.
- `DELETE /api/incomes/{income_id}`: Delete income.

### Budget (Protected)

- `GET /api/budget`: Fetch current user's monthly budget threshold. (Auto-creates 0.0 default if not set).
- `PUT /api/budget`: Configure/Update monthly budget. Expects JSON body `{ monthly_budget: float }`.

### Analytics & Insights (Protected)

- `GET /api/analytics/dashboard-summary`: Returns metrics of the current month (Total Income, Total Expenses, Balance, Budget, Remaining Budget, Used Percentage, Exceeded Flag).
- `GET /api/analytics/category-breakdown`: Grouped sums and percentages per category for the current month's expenses.
- `GET /api/analytics/monthly-summary`: Monthly aggregated Income vs Expenses for the last 6 months (perfect for comparison bar/line charts).
- `GET /api/analytics/insights`: Generates MoM category spending shifts and budget warnings.
