import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, TrendingUp, Sparkles, BookOpen, ChevronRight, BarChart3, GraduationCap, Award } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard, ProgressBar } from '../components/ui';

// ──────────────────────────────────────────────────────────────────
// Backend response: GET /api/instructor/dashboard
// {
//   message, totalOwnCourses,
//   dashboard: [{
//     courseId, courseTitle,
//     totalStudents, completedStudents,
//     classAverageProgress, classAverageScore
//   }]
// }
// ──────────────────────────────────────────────────────────────────

export default function InstructorDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/instructor/dashboard')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Không tải được dữ liệu.'))
      .finally(() => setLoading(false));
  }, []);

  const courses         = data?.dashboard ?? [];
  const totalOwnCourses = data?.totalOwnCourses ?? 0;

  // Tổng học viên qua tất cả khóa học
  const totalStudents = courses.reduce((s, c) => s + (c.totalStudents ?? 0), 0);

  // Trung bình tiến độ lớp (bình quân của tất cả khóa)
  const overallAvgProgress = courses.length
    ? parseFloat((courses.reduce((s, c) => s + (c.classAverageProgress ?? 0), 0) / courses.length).toFixed(1))
    : 0;

  // Trung bình điểm AI lớp
  const overallAvgScore = courses.length
    ? parseFloat((courses.reduce((s, c) => s + (c.classAverageScore ?? 0), 0) / courses.length).toFixed(1))
    : 0;

  const displayName = user?.name || user?.fullName || 'Giảng viên';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bảng điều khiển Giảng viên</h1>
          <p className="text-slate-400 text-sm mt-1">
            Xin chào, <span className="text-indigo-400">{displayName}</span> — đây là tổng quan lớp học của bạn.
          </p>
        </div>
        <Link 
          to="/instructor/courses/new" 
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 
                     text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <BookOpen size={16} />
          Tạo khóa học mới
        </Link>
      </div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}   label="Khóa học của bạn"
            value={totalOwnCourses} color="indigo"
            sub="Tổng số đã tạo"
          />
          <StatCard
            icon={Users}      label="Tổng học viên"
            value={totalStudents}  color="violet"
            sub="Trên tất cả khóa học"
          />
          <StatCard
            icon={TrendingUp} label="Tiến độ TB lớp"
            value={`${overallAvgProgress}%`} color="emerald"
            sub="Bình quân hoàn thành"
          />
          <StatCard
            icon={Sparkles}   label="Điểm AI TB lớp"
            value={overallAvgScore > 0 ? `${overallAvgScore}/10` : '—'} color="amber"
            sub="Bình quân bài tập"
          />
        </div>
      )}

      {/* Per-course table */}
      {!loading && !error && courses.length > 0 && (
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-white/8">
            <BarChart3 size={18} className="text-indigo-400" />
            <h2 className="text-white font-semibold">Chi tiết từng khóa học</h2>
          </div>

          <div className="divide-y divide-white/5">
            {courses.map((course) => (
              <Link 
                key={course.courseId} 
                to={`/instructor/courses/${course.courseId}`}
                className="block px-6 py-4 hover:bg-white/3 transition-colors group cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/25 transition-colors">
                      <BookOpen size={16} className="text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate group-hover:text-indigo-300 transition-colors">{course.courseTitle}</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {course.totalStudents ?? 0} học viên
                        {course.completedStudents > 0 && ` · ${course.completedStudents} đã hoàn thành`}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-4">
                    {course.classAverageScore > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-400">
                        <Sparkles size={12} />
                        <span>{course.classAverageScore}/10</span>
                      </div>
                    )}
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">Tiến độ TB lớp</span>
                      <span className="text-white font-medium">{course.classAverageProgress ?? 0}%</span>
                    </div>
                    <ProgressBar value={course.classAverageProgress ?? 0} color="emerald" showLabel={false} />
                  </div>
                  {course.classAverageScore > 0 && (
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">Điểm AI TB</span>
                        <span className="text-white font-medium">{course.classAverageScore}/10</span>
                      </div>
                      {/* Điểm maxScore=10, quy về % */}
                      <ProgressBar value={(course.classAverageScore / 10) * 100} color="amber" showLabel={false} />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && courses.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={36} className="text-indigo-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Bạn chưa tạo khóa học nào</h2>
          <p className="text-slate-400 text-sm">Hãy tạo khóa học đầu tiên để bắt đầu dạy học.</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-slate-500">
          <BarChart3 size={40} className="mx-auto mb-3 opacity-40" />
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
