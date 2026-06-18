import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  BarChart3, 
  Loader2, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface CategoryBreakdown {
  category: string;
  amount: number;
  percentage: number;
}

interface MonthlySummary {
  month: string;
  income: number;
  expense: number;
}

interface Insight {
  type: string;
  message: string;
  category?: string;
  difference_percentage?: number;
}

const COLORS = [
  '#6366f1', // Indigo (Food)
  '#f43f5e', // Rose (Health)
  '#10b981', // Emerald (Bills)
  '#f59e0b', // Amber (Shopping)
  '#8b5cf6', // Violet (Travel)
  '#ec4899', // Fuchsia (Entertainment)
  '#06b6d4', // Cyan (Education)
  '#64748b'  // Slate (Other)
];

const Analytics: React.FC = () => {
  const [categories, setCategories] = useState<CategoryBreakdown[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySummary[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [catRes, monRes, insRes] = await Promise.all([
        api.get<CategoryBreakdown[]>('/api/analytics/category-breakdown'),
        api.get<MonthlySummary[]>('/api/analytics/monthly-summary'),
        api.get<Insight[]>('/api/analytics/insights')
      ]);

      setCategories(catRes.data);
      setMonthlyData(monRes.data);
      setInsights(insRes.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatMonth = (monthStr: any) => {
    if (typeof monthStr !== 'string') return '';
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-sm text-slate-500 mt-3 font-medium">Assembling visual statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-slide">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <BarChart3 className="text-indigo-600 dark:text-indigo-400" />
          <span>Analytics Dashboard</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Deep dive insights and trends into your cash flow</p>
      </div>

      {/* MoM Insights Banner */}
      {insights.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-indigo-500">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 mb-3">
            <Sparkles size={16} className="text-indigo-500" />
            <span>Monthly Spending Highlights</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.filter(ins => ins.type !== 'info').map((insight, idx) => {
              const isWarning = insight.type === 'warning';
              const isSuccess = insight.type === 'success';
              return (
                <div 
                  key={idx} 
                  className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs leading-relaxed ${
                    isWarning 
                      ? 'bg-rose-50/50 border-rose-100/50 text-rose-700 dark:bg-rose-950/10 dark:border-rose-950/20 dark:text-rose-400' 
                      : isSuccess 
                      ? 'bg-emerald-50/50 border-emerald-100/50 text-emerald-700 dark:bg-emerald-950/10 dark:border-emerald-950/20 dark:text-emerald-400' 
                      : 'bg-indigo-50/50 border-indigo-100/50 text-indigo-700 dark:bg-indigo-950/10 dark:border-indigo-950/20 dark:text-indigo-400'
                  }`}
                >
                  <span className="shrink-0 mt-0.5">
                    {isWarning ? <AlertTriangle size={14} /> : isSuccess ? <CheckCircle size={14} /> : <Info size={14} />}
                  </span>
                  <span>{insight.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Comparison Chart */}
        <div className="glass-card p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-emerald-500" />
              <span>Income vs. Expenses Trend</span>
            </h2>
            <p className="text-[11px] text-slate-400">Cash inflow compared to expenditures over time</p>
          </div>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  labelFormatter={formatMonth}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="expense" name="Expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Spending Bar Chart */}
        <div className="glass-card p-6">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <TrendingDown size={16} className="text-rose-500" />
              <span>Monthly Spend Volume</span>
            </h2>
            <p className="text-[11px] text-slate-400">Total volume of monthly payouts</p>
          </div>
          <div className="h-72 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" tickFormatter={formatMonth} stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  labelFormatter={formatMonth}
                  contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', borderColor: '#e2e8f0' }}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="expense" name="Monthly Outlay" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie Chart */}
        <div className="glass-card p-6 lg:col-span-2 grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
          <div className="md:col-span-2">
            <h2 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-violet-500" />
              <span>Category Breakdown</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Visual share of category spend for the current month
            </p>
            {categories.length === 0 ? (
              <p className="text-xs text-slate-400">No expense records found to generate share breakdown.</p>
            ) : (
              <div className="space-y-2.5">
                {categories.map((cat, idx) => (
                  <div key={cat.category} className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat.category}</span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      <span className="font-bold">{formatCurrency(cat.amount)}</span>
                      <span className="ml-1.5 opacity-60">({cat.percentage}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-3 h-72 w-full flex items-center justify-center">
            {categories.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-10">No visual data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={55}
                    paddingAngle={3}
                  >
                    {categories.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), '']}
                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: '12px', borderColor: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
