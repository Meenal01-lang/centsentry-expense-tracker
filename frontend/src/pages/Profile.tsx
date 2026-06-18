import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { User, ShieldAlert, Loader2, CheckCircle, Key } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // Profile update form
  const [name, setName] = useState(user?.name || '');
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  // Password update form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);

    if (name.trim() === '') {
      setProfileError('Name cannot be empty');
      setProfileLoading(false);
      return;
    }

    try {
      await api.put('/api/users/profile', { name });
      updateUser(name);
      setProfileSuccess(true);
    } catch (err: any) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordLoading(true);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    try {
      await api.put('/api/users/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <User className="text-indigo-600 dark:text-indigo-400" />
          <span>My Profile</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your profile details and settings</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Details Card */}
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <User size={18} className="text-indigo-500" />
            <span>Profile Information</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Update your visual name on the app dashboard</p>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            {profileSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-950/40 dark:text-emerald-400">
                <CheckCircle size={15} />
                <span>Profile updated successfully!</span>
              </div>
            )}
            {profileError && (
              <div className="flex items-start gap-2 p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-400">
                <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                className="input-field opacity-60 cursor-not-allowed bg-slate-100 dark:bg-slate-850"
                value={user?.email || ''}
              />
              <p className="text-[10px] text-slate-400 mt-1">Email address cannot be changed.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                required
                placeholder="Full Name"
                className="input-field"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="w-full btn-primary grad-primary flex items-center justify-center py-2.5"
            >
              {profileLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                  Updating...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="glass-card p-6">
          <h2 className="text-base font-bold text-slate-800 dark:text-white mb-1 flex items-center gap-2">
            <Key size={18} className="text-amber-500" />
            <span>Security Settings</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">Change your profile authentication password</p>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {passwordSuccess && (
              <div className="flex items-center gap-2 p-3 text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg dark:bg-emerald-950/20 dark:border-emerald-950/40 dark:text-emerald-400">
                <CheckCircle size={15} />
                <span>Password changed successfully!</span>
              </div>
            )}
            {passwordError && (
              <div className="flex items-start gap-2 p-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg dark:bg-rose-950/20 dark:border-rose-950/40 dark:text-rose-400">
                <ShieldAlert size={15} className="shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="•••••••• (Min 6 characters)"
                className="input-field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full btn-primary bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 flex items-center justify-center py-2.5"
            >
              {passwordLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-1.5" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
