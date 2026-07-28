import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight,
  Plus,
  Coins,
  Settings,
  X,
  Loader2,
  CheckCircle,
  Info,
  Download
} from 'lucide-react';

interface DashboardSummary {
  total_income: number;
  total_expenses: number;
  current_balance: number;
  monthly_budget: number;
  budget_used_percentage: number;
  budget_remaining: number;
  exceeded_budget: boolean;
}

interface Insight {
  type: string;
  message: string;
  category?: string;
  difference_percentage?: number;
}

interface Transaction {
  id: number;
  type: 'income' | 'expense';
  title: string;
  amount: number;
  categoryOrSource: string;
  date: string;
}

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Budget configure modal
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState('');
  const [budgetSubmitting, setBudgetSubmitting] = useState(false);
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch summary metrics
      const summaryRes = await api.get<DashboardSummary>('/api/analytics/dashboard-summary');
      setSummary(summaryRes.data);
      setNewBudget(summaryRes.data.monthly_budget.toString());

      // Fetch insights
      const insightsRes = await api.get<Insight[]>('/api/analytics/insights');
      setInsights(insightsRes.data);

      // Fetch recent expenses and incomes for combined widget
      const [expensesRes, incomesRes] = await Promise.all([
        api.get<any[]>('/api/expenses?sort_by=date&sort_order=desc'),
        api.get<any[]>('/api/incomes?sort_by=date&sort_order=desc')
      ]);

      // Map and merge
      const expensesMapped: Transaction[] = expensesRes.data.map(exp => ({
        id: exp.id,
        type: 'expense',
        title: exp.title,
        amount: exp.amount,
        categoryOrSource: exp.category,
        date: exp.date
      }));

      const incomesMapped: Transaction[] = incomesRes.data.map(inc => ({
        id: inc.id,
        type: 'income',
        title: inc.source,
        amount: inc.amount,
        categoryOrSource: 'Income Source',
        date: inc.date
      }));

      // Combine and sort by date descending, take top 5
      const combined = [...expensesMapped, ...incomesMapped]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
        
      setTransactions(combined);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportTransactionsCSV = async () => {
    try {
      setExporting(true);
      
      // Fetch ALL expenses and incomes
      const [expensesRes, incomesRes] = await Promise.all([
        api.get<any[]>('/api/expenses?sort_by=date&sort_order=desc'),
        api.get<any[]>('/api/incomes?sort_by=date&sort_order=desc')
      ]);

      const headers = ['Date', 'Category', 'Amount', 'Transaction Type', 'Payment Method', 'Description'];

      // Function to deterministically generate a payment method for Power BI visualizations
      const getPaymentMethod = (type: 'Income' | 'Expense', categoryOrSource: string, amount: number, id: number): string => {
        if (type === 'Income') {
          if (amount >= 1500) return 'Bank Transfer';
          return id % 2 === 0 ? 'Bank Transfer' : 'Direct Deposit';
        } else {
          if (categoryOrSource === 'Bills') return 'Bank Transfer';
          if (amount >= 500) return 'Credit Card';
          const methods = ['Credit Card', 'Debit Card', 'Cash', 'UPI'];
          return methods[id % methods.length];
        }
      };

      const rows: any[][] = [];

      // Add Expenses
      expensesRes.data.forEach(exp => {
        rows.push([
          exp.date,
          exp.category,
          exp.amount,
          'Expense',
          getPaymentMethod('Expense', exp.category, exp.amount, exp.id),
          `"${(exp.title + (exp.notes ? ` - ${exp.notes}` : '')).replace(/"/g, '""')}"`
        ]);
      });

      // Add Incomes
      incomesRes.data.forEach(inc => {
        rows.push([
          inc.date,
          inc.source, // Map Income source as Category (e.g. Salary, Freelance)
          inc.amount,
          'Income',
          getPaymentMethod('Income', inc.source, inc.amount, inc.id),
          `"${(inc.source + (inc.notes ? ` - ${inc.notes}` : '')).replace(/"/g, '""')}"`
        ]);
      });

      // Sort combined rows by date descending
      rows.sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());

      // Prepare CSV content
      const csvRows = [headers.join(','), ...rows.map(r => r.join(','))];
      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `centsentry_transactions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export transactions:', error);
      alert('Failed to export transactions. Please check database connectivity and try again.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setBudgetError(null);
    setBudgetSubmitting(true);

    const budgetVal = parseFloat(newBudget);
    if (isNaN(budgetVal) || budgetVal < 0) {
      setBudgetError('Budget must be a valid positive number');
      setBudgetSubmitting(false);
      return;
    }

    try {
      await api.put('/api/budget', { monthly_budget: budgetVal });
      setIsBudgetModalOpen(false);
      // Refresh summary
      const summaryRes = await api.get<DashboardSummary>('/api/analytics/dashboard-summary');
      setSummary(summaryRes.data);
      
      // Refresh insights (which depend on budget)
      const insightsRes = await api.get<Insight[]>('/api/analytics/insights');
      setInsights(insightsRes.data);
    } catch (error) {
      setBudgetError('Failed to update budget. Please try again.');
    } finally {
      setBudgetSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 font-medium">Crunching your numbers...</p>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  return (
    <div className="space-y-8 animate-slide">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome to your financial command center</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExportTransactionsCSV}
            disabled={exporting}
            className="btn-secondary flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            <span>Export CSV</span>
          </button>
          <Link to="/expenses" className="btn-secondary flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm">
            <Plus size={16} />
            <span>Add Expense</span>
          </Link>
          <Link to="/income" className="btn-primary grad-primary flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm">
            <Plus size={16} />
            <span>Add Income</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Row */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Income Card */}
          <div className="glass-card p-6 glass-card-hover flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 shrink-0">
              <TrendingUp size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Income (This Month)
              </span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block">
                {formatCurrency(summary.total_income)}
              </span>
            </div>
          </div>

          {/* Expenses Card */}
          <div className="glass-card p-6 glass-card-hover flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400 shrink-0">
              <TrendingDown size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Expenses (This Month)
              </span>
              <span className="text-2xl font-bold text-slate-800 dark:text-slate-100 block">
                {formatCurrency(summary.total_expenses)}
              </span>
            </div>
          </div>

          {/* Net Balance Card */}
          <div className="glass-card p-6 glass-card-hover flex items-start gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 shrink-0">
              <Wallet size={24} />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                Total Balance
              </span>
              <span className={`text-2xl font-bold block ${summary.current_balance >= 0 ? 'text-slate-800 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatCurrency(summary.current_balance)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Budget & Progress Segment */}
      {summary && (
        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Coins size={18} className="text-amber-500" />
                <span>Budget Tracking</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Track and adjust monthly limit boundaries</p>
            </div>
            <button
              onClick={() => setIsBudgetModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors"
            >
              <Settings size={14} />
              <span>Configure</span>
            </button>
          </div>

          {summary.monthly_budget === 0 ? (
            <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No budget configured for this month.</p>
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="btn-secondary py-2 px-4 text-xs font-medium"
              >
                Set Monthly Budget
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress Bar Container */}
              <div>
                <div className="flex justify-between items-end mb-2 text-xs font-semibold">
                  <span className="text-slate-500 dark:text-slate-400">
                    Used: {summary.budget_used_percentage}% ({formatCurrency(summary.total_expenses)})
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Budget: {formatCurrency(summary.monthly_budget)}
                  </span>
                </div>
                {/* Gauge bar */}
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.exceeded_budget 
                        ? 'bg-rose-500' 
                        : summary.budget_used_percentage >= 80 
                        ? 'bg-amber-500' 
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(100, summary.budget_used_percentage)}%` }}
                  />
                </div>
              </div>

              {/* Status Details */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Remaining Budget: </span>
                  <span className={`font-bold ${summary.exceeded_budget ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {summary.exceeded_budget ? '- ' : ''}{formatCurrency(summary.budget_remaining)}
                  </span>
                </div>

                {summary.exceeded_budget && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 font-medium animate-pulse">
                    <AlertTriangle size={14} />
                    <span>Spending exceeds budget by {formatCurrency(summary.total_expenses - summary.monthly_budget)}!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Transactions & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Widget */}
        <div className="glass-card p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-white">Recent Activity</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Latest earnings and expenditures</p>
            </div>
            <Link 
              to="/expenses" 
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm text-slate-500 dark:text-slate-400">No transactions recorded yet.</p>
              <p className="text-xs text-slate-400 dark:text-slate-600 mt-1">Add expenses or income to view recent activities here.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-800/40">
              {transactions.map((tx) => (
                <div key={`${tx.type}-${tx.id}`} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-9 h-9 rounded-lg shrink-0 ${
                      tx.type === 'income' 
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' 
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400'
                    }`}>
                      {tx.type === 'income' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{tx.title}</p>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        {tx.categoryOrSource} • {new Date(tx.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${
                    tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Insights Widget */}
        <div className="glass-card p-6 flex flex-col">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles size={18} className="text-violet-500" />
              <span>Smart Insights</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Automated spending recommendations</p>
          </div>

          <div className="space-y-4 flex-1">
            {insights.map((insight, index) => {
              const isWarning = insight.type === 'warning';
              const isSuccess = insight.type === 'success';
              return (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs leading-relaxed ${
                    isWarning 
                      ? 'bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/15 dark:border-rose-950/30 dark:text-rose-400' 
                      : isSuccess 
                      ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/15 dark:border-emerald-950/30 dark:text-emerald-400' 
                      : 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/15 dark:border-indigo-950/30 dark:text-indigo-400'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {isWarning ? <AlertTriangle size={15} /> : isSuccess ? <CheckCircle size={15} /> : <Info size={15} />}
                  </span>
                  <span>{insight.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Configure Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade">
          <div className="glass-card w-full max-w-md p-6 shadow-2xl animate-slide relative bg-white dark:bg-slate-900">
            <button
              onClick={() => setIsBudgetModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Configure Monthly Budget</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">Set your target spending limit for this month.</p>

            <form onSubmit={handleUpdateBudget} className="space-y-4">
              {budgetError && (
                <div className="flex items-start gap-2 p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{budgetError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Budget Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1500.00"
                  className="input-field"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="flex-1 btn-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={budgetSubmitting}
                  className="flex-1 btn-primary grad-primary flex items-center justify-center py-2"
                >
                  {budgetSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    'Save Budget'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
