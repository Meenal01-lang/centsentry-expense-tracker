import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  LayoutDashboard, 
  TrendingDown, 
  TrendingUp, 
  BarChart3, 
  User, 
  LogOut, 
  Sun, 
  Moon,
  Wallet
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Dashboard', to: '/', icon: LayoutDashboard },
    { name: 'Expenses', to: '/expenses', icon: TrendingDown },
    { name: 'Income', to: '/income', icon: TrendingUp },
    { name: 'Analytics', to: '/analytics', icon: BarChart3 },
    { name: 'Profile', to: '/profile', icon: User },
  ];

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-transform duration-300 lg:translate-x-0 lg:static ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl grad-primary text-white shadow-md shadow-indigo-500/10">
            <Wallet size={20} />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-800 dark:text-white">CentSentry</h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Expense Guard</p>
          </div>
        </div>

        {/* User Card */}
        {user && (
          <div className="px-4 py-4 border-b border-slate-100/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 font-semibold text-sm ring-2 ring-white dark:ring-slate-900 shadow-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'grad-primary text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/40'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-1">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <>
                  <Sun size={18} className="text-amber-500" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon size={18} className="text-indigo-500" />
                  <span>Dark Mode</span>
                </>
              )}
            </div>
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
              {theme}
            </span>
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-rose-500 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/20 transition-colors"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
