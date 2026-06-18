import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { 
  TrendingDown, 
  Search, 
  Filter, 
  Plus, 
  Edit2, 
  Trash2, 
  Download, 
  Loader2, 
  X, 
  Calendar,
  AlertTriangle,
  ArrowUpDown
} from 'lucide-react';

interface Expense {
  id: number;
  user_id: number;
  title: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
}

const CATEGORIES = ["Food", "Shopping", "Travel", "Entertainment", "Education", "Health", "Bills", "Other"];

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filters state
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentExpenseId, setCurrentExpenseId] = useState<number | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      let url = `/api/expenses?sort_by=${sortBy}&sort_order=${sortOrder}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (startDate) url += `&start_date=${startDate}`;
      if (endDate) url += `&end_date=${endDate}`;
      
      const response = await api.get<Expense[]>(url);
      setExpenses(response.data);
    } catch (error) {
      console.error('Failed to load expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search and filters reload
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchExpenses();
    }, 300);
    return () => clearTimeout(handler);
  }, [search, category, startDate, endDate, sortBy, sortOrder]);

  const openAddModal = () => {
    setModalMode('add');
    setTitle('');
    setAmount('');
    setExpenseCategory('Food');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setModalMode('edit');
    setCurrentExpenseId(expense.id);
    setTitle(expense.title);
    setAmount(expense.amount.toString());
    setExpenseCategory(expense.category);
    setDate(expense.date);
    setNotes(expense.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      setExpenses(expenses.filter(exp => exp.id !== id));
    } catch (error) {
      alert('Failed to delete expense record');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSubmitting(true);

    const amtVal = parseFloat(amount);
    if (isNaN(amtVal) || amtVal <= 0) {
      setFormError('Amount must be a positive number');
      setFormSubmitting(false);
      return;
    }

    const payload = {
      title,
      amount: amtVal,
      category: expenseCategory,
      date,
      notes: notes || null
    };

    try {
      if (modalMode === 'add') {
        const response = await api.post<Expense>('/api/expenses', payload);
        setExpenses([response.data, ...expenses]);
      } else if (modalMode === 'edit' && currentExpenseId) {
        const response = await api.put<Expense>(`/api/expenses/${currentExpenseId}`, payload);
        setExpenses(expenses.map(exp => exp.id === currentExpenseId ? response.data : exp));
      }
      setIsModalOpen(false);
    } catch (error: any) {
      setFormError(error.response?.data?.detail || 'Something went wrong. Please check inputs.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (expenses.length === 0) return;
    const headers = ['ID', 'Title', 'Amount', 'Category', 'Date', 'Notes'];
    const rows = expenses.map(exp => [
      exp.id,
      `"${exp.title.replace(/"/g, '""')}"`,
      exp.amount,
      exp.category,
      exp.date,
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div className="space-y-6 animate-slide">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <TrendingDown className="text-rose-500" />
            <span>Manage Expenses</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and manage your spending habits</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={expenses.length === 0}
            className="flex-1 sm:flex-initial btn-secondary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex-1 sm:flex-initial btn-primary grad-primary flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm"
          >
            <Plus size={16} />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            type="text"
            placeholder="Search details..."
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Filter size={16} />
          </span>
          <select
            className="input-field pl-9 appearance-none"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Start Date */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Calendar size={16} />
          </span>
          <input
            type="date"
            className="input-field pl-9 text-slate-500"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        {/* End Date */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Calendar size={16} />
          </span>
          <input
            type="date"
            className="input-field pl-9 text-slate-500"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        {/* Reset Filters */}
        <button
          onClick={() => {
            setSearch('');
            setCategory('');
            setStartDate('');
            setEndDate('');
          }}
          className="btn-secondary w-full"
        >
          Clear Filters
        </button>
      </div>

      {/* Expenses Table/List */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs text-slate-500 mt-2">Loading transactions...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-slate-500 dark:text-slate-400">No expenses found matching the criteria.</p>
            <button
              onClick={openAddModal}
              className="btn-secondary py-2 px-4 mt-3 text-xs font-semibold"
            >
              Add First Expense
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/35">
                  <th className="px-6 py-4">Title</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('amount')}>
                    <div className="flex items-center gap-1">
                      <span>Amount</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" onClick={() => toggleSort('date')}>
                    <div className="flex items-center gap-1">
                      <span>Date</span>
                      <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-6 py-4 hidden md:table-cell">Notes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/40 text-sm">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                      {expense.title}
                    </td>
                    <td className="px-6 py-4 text-rose-600 dark:text-rose-400 font-bold">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-medium">
                      {new Date(expense.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-[200px] truncate hidden md:table-cell">
                      {expense.notes || '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(expense)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400 transition-colors"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade">
          <div className="glass-card w-full max-w-md p-6 shadow-2xl animate-slide bg-white dark:bg-slate-900 relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
              {modalMode === 'add' ? 'Add Expense' : 'Edit Expense'}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-5">
              Enter expense transaction details below.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="flex items-start gap-2 p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grocery Store"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="25.50"
                    className="input-field"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Category
                  </label>
                  <select
                    className="input-field"
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  required
                  className="input-field"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Notes (Optional)
                </label>
                <textarea
                  placeholder="Add details, receipt comments..."
                  rows={2}
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 btn-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="flex-1 btn-primary grad-primary flex items-center justify-center py-2"
                >
                  {formSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    'Save Transaction'
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

export default Expenses;
