import { Settings, User, Bell, Shield, Palette } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your account preferences</p>
      </div>

      {/* Profile section */}
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <User size={16} className="text-indigo-400" /> Profile
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center text-white text-lg font-bold shadow-lg">
            {user?.name?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <p className="text-white font-medium">{user?.name ?? 'User'}</p>
            <p className="text-slate-400 text-sm">{user?.email ?? ''}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500/15 text-indigo-400
                             border border-indigo-500/30 rounded-lg text-xs capitalize">
              {user?.role ?? 'student'}
            </span>
          </div>
        </div>
      </div>

      {/* Notification settings */}
      <div className="glass rounded-2xl p-6 border border-white/8">
        <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
          <Bell size={16} className="text-indigo-400" /> Notifications
        </h2>
        {[
          { label: 'Email notifications', sub: 'Course updates and announcements' },
          { label: 'Assignment reminders', sub: 'Get reminded about pending assignments' },
          { label: 'AI tutor replies', sub: 'Notifications when AI responds' },
        ].map(({ label, sub }) => (
          <div key={label} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm text-white">{label}</p>
              <p className="text-xs text-slate-500">{sub}</p>
            </div>
            <button className="w-10 h-5 bg-indigo-600 rounded-full relative">
              <span className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
