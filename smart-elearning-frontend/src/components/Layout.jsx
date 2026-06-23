import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, GraduationCap, Award, Settings,
  ChevronLeft, ChevronRight, LogOut, Zap, Menu, X, Bell, User, Users, Server
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  let navItems = [];
  if (user?.role === 'admin') {
    navItems = [
      { to: '/admin',         icon: Server,          label: 'System Admin', end: true },
      { to: '/admin/users',   icon: Users,           label: 'Quản lý người dùng' },
      { to: '/admin/courses', icon: BookOpen,        label: 'Quản lý khóa học' },
      { to: '/settings',      icon: Settings,        label: 'Cài đặt' },
    ];
  } else if (user?.role === 'teacher') {
    navItems = [
      { to: '/instructor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/instructor/courses',   icon: BookOpen,        label: 'Quản lý khóa học' },
      { to: '/courses',              icon: GraduationCap,   label: 'Browse Courses' },
      { to: '/groups',               icon: Users,           label: 'Nhóm' },
      { to: '/settings',             icon: Settings,        label: 'Cài đặt' },
    ];
  } else {
    navItems = [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/courses',      icon: BookOpen,         label: 'Browse Courses' },
      { to: '/my-learning',  icon: GraduationCap,    label: 'My Learning' },
      { to: '/groups',       icon: Users,            label: 'Nhóm' },
      { to: '/certificates', icon: Award,             label: 'Certificates' },
      { to: '/settings',     icon: Settings,          label: 'Cài đặt' },
    ];
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="flex h-screen bg-[#0f0f1a] overflow-hidden">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside
        className={`
          fixed lg:relative z-30 flex flex-col h-full
          transition-all duration-300 ease-in-out
          bg-[#13131f] border-r border-white/5
          ${collapsed ? 'w-[70px]' : 'w-[240px]'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
          <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Zap size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm leading-tight">Smart</p>
              <p className="text-indigo-400 text-xs font-medium">E-Learning</p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                 transition-all duration-200 group relative
                 ${isActive
                   ? 'bg-indigo-500/15 text-indigo-400 border-l-[3px] border-indigo-500 pl-[9px]'
                   : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                 }`
              }
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
              {/* Tooltip when collapsed */}
              {collapsed && (
                <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded-lg
                                 opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap
                                 transition-opacity duration-200 z-50 shadow-xl">
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section & collapse toggle */}
        <div className="p-2 border-t border-white/5 space-y-1">
          <button
            onClick={handleLogout}
            className="sidebar-link flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                       text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-all duration-200"
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>

          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                       text-slate-500 hover:bg-white/5 hover:text-slate-300 w-full transition-all duration-200"
          >
            {collapsed
              ? <ChevronRight size={18} className="flex-shrink-0" />
              : <><ChevronLeft size={18} className="flex-shrink-0" /><span>Collapse</span></>
            }
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top App Bar */}
        <header className="flex items-center justify-between px-4 md:px-6 py-4
                           bg-[#13131f]/80 backdrop-blur-xl border-b border-white/5 flex-shrink-0">
          {/* Mobile menu toggle */}
          <button
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
            onClick={() => setMobileOpen(o => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden lg:block" /> {/* spacer */}

          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full"></span>
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600
                              flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-indigo-500/20">
                {initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-white leading-none">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role || 'student'}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto bg-[#0f0f1a] p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
