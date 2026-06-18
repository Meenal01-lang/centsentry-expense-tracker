from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import auth, users, incomes, expenses, budgets, analytics

# Initialize database tables on startup if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Personal Expense Tracker API",
    description="Backend API for managing expenses, income, budget constraints, and generating rich analytics.",
    version="1.0.0"
)

# CORS configuration to allow local development & production endpoints
# In production, configure origins to match the frontend domains on Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to allowed domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(incomes.router)
app.include_router(expenses.router)
app.include_router(budgets.router)
app.include_router(analytics.router)

@app.get("/")
def read_root():
    return {
        "status": "healthy",
        "app": "Personal Expense Tracker API",
        "documentation": "/docs"
    }
