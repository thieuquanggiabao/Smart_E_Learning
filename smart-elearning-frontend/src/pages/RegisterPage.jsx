import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, Eye, EyeOff, User, AlertCircle, GraduationCap, BookOpen, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = e => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Backend expects: { email, password, fullName, role }
      const res = await api.post('/auth/register', {
        email: form.email,
        password: form.password,
        fullName: form.name,   // ← backend dùng 'fullName'
        role: form.role,
      });

      // Nếu backend trả token thì auto login
      if (res.data?.token) {
        login(res.data.user, res.data.token);
        navigate(res.data.user?.role === 'teacher' ? '/instructor/dashboard' : '/dashboard');
      } else {
        // Register thành công nhưng không có token → hiện thông báo → chuyển sang login
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      const msg = err.response?.data?.message
        || err.response?.data?.error
        || 'Đăng ký thất bại. Email có thể đã tồn tại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-80 h-80 bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600
                          flex items-center justify-center shadow-2xl shadow-indigo-500/30">
            <Zap size={24} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">Smart E-Learning</p>
            <p className="text-indigo-400 text-sm">AI-Powered Education</p>
          </div>
        </div>

        <div className="glass rounded-3xl p-8 shadow-2xl border border-white/10">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-slate-400 text-sm mb-7">Join thousands of learners today</p>

          {/* Success banner */}
          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30
                            text-emerald-400 text-sm px-4 py-3 rounded-xl mb-5">
              <CheckCircle2 size={16} className="flex-shrink-0" />
              Đăng ký thành công! Đang chuyển đến trang đăng nhập...
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30
                            text-red-400 text-sm px-4 py-3 rounded-xl mb-5">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3
                             text-sm text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-email"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3
                             text-sm text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                             transition-all duration-200"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  id="register-password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-11 py-3
                             text-sm text-white placeholder-slate-500
                             focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                             transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Role selector */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'student', icon: GraduationCap, label: 'Student' },
                  { value: 'teacher', icon: BookOpen, label: 'Instructor' },
                ].map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    id={`role-${value}`}
                    onClick={() => setForm(f => ({ ...f, role: value }))}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium
                                transition-all duration-200
                                ${form.role === value
                                  ? 'bg-indigo-500/20 border-indigo-500/60 text-indigo-300'
                                  : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                                }`}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              id="register-submit"
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600
                         hover:from-indigo-500 hover:to-violet-500
                         text-white font-semibold rounded-xl text-sm
                         shadow-lg shadow-indigo-500/25
                         transition-all duration-200 active:scale-[0.98]
                         disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {loading ? <Spinner size="sm" /> : null}
              {loading ? 'Đang tạo tài khoản...' : success ? 'Đã đăng ký!' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
