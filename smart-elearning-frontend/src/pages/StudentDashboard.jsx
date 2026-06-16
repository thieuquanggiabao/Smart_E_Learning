import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, TrendingUp, Star, Play, Award,
  ChevronRight, Sparkles, Clock, CheckCircle2
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatCard, ProgressBar, SkeletonCard, Badge } from '../components/ui';

// ──────────────────────────────────────────────
// Dữ liệu từ API: dashboard[] mỗi phần tử gồm:
//   courseId, courseTitle, progress, averageScore,
//   status, completedLessonsCount, enrolledAt
// ──────────────────────────────────────────────
function CourseCard({ item }) {
  const {
    courseId,
    courseTitle,
    progress = 0,
    averageScore = 0,
    status = 'learning',
    completedLessonsCount = 0,
  } = item;

  const isCompleted = status === 'completed' || progress >= 100;
  const progressColor = isCompleted ? 'emerald' : progress >= 50 ? 'indigo' : 'amber';

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/8
                    hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1
                    hover:shadow-xl hover:shadow-indigo-500/10 group flex flex-col">
      {/* Thumbnail */}
      <div className="relative h-36 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-slate-900
                      flex items-center justify-center overflow-hidden">
        <BookOpen size={36} className="text-indigo-300/40 relative z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a]/80 to-transparent" />

        {isCompleted && (
          <div className="absolute top-2 right-2 z-20">
            <Badge color="emerald">✓ Hoàn thành</Badge>
          </div>
        )}

        {/* Hover play button */}
        <Link
          to={`/courses/${courseId}/lessons`}
          className="absolute inset-0 flex items-center justify-center z-20
                     opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center
                          shadow-xl shadow-indigo-500/40 scale-90 group-hover:scale-100 transition-transform">
            <Play size={20} className="text-white ml-1" />
          </div>
        </Link>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Title */}
        <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-2">
          {courseTitle}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <CheckCircle2 size={11} className="text-emerald-400" />
          <span>{completedLessonsCount} bài đã học</span>
        </div>

        {/* Progress bar */}
        <ProgressBar value={progress} color={progressColor} />

        {/* AI Score */}
        {averageScore > 0 && (
          <div className="mt-3 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20
                          rounded-xl px-3 py-2">
            <Sparkles size={13} className="text-emerald-400 flex-shrink-0" />
            <span className="text-xs text-emerald-300 font-medium">Điểm AI trung bình:</span>
            <span className="text-xs text-emerald-400 font-bold ml-auto">{averageScore}/10</span>
          </div>
        )}

        {/* CTA */}
        <Link
          to={`/courses/${courseId}/lessons`}
          className="mt-4 flex items-center justify-between text-xs font-medium
                     text-indigo-400 hover:text-indigo-300 transition-colors group/link"
        >
          <span>{isCompleted ? 'Xem lại' : progress > 0 ? 'Tiếp tục học' : 'Bắt đầu học'}</span>
          <ChevronRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);   // { totalCourses, dashboard: [] }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users/dashboard')
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Không tải được dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  // Lấy đúng field từ response backend
  const courses    = data?.dashboard ?? [];
  const total      = data?.totalCourses ?? 0;
  const completed  = courses.filter(c => c.status === 'completed').length;
  const avgProg    = courses.length
    ? Math.round(courses.reduce((s, c) => s + (c.progress ?? 0), 0) / courses.length)
    : 0;
  const aiGraded   = courses.filter(c => (c.averageScore ?? 0) > 0).length;

  // Lấy tên hiển thị — backend trả 'fullName'
  const displayName = user?.name || user?.fullName || 'Bạn';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Xin chào, <span className="text-indigo-400">{displayName.split(' ').pop()}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Tiếp tục hành trình học tập của bạn hôm nay.</p>
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
          <StatCard icon={BookOpen}   label="Khóa đã đăng ký"  value={total}        color="indigo"  sub="Tổng số khóa học" />
          <StatCard icon={TrendingUp} label="Tiến độ trung bình" value={`${avgProg}%`} color="emerald" sub="Trên tất cả khóa học" />
          <StatCard icon={Award}      label="Hoàn thành"        value={completed}    color="violet"  sub="Khóa học đã xong" />
          <StatCard icon={Sparkles}   label="Được AI chấm"      value={aiGraded}     color="amber"   sub="Bài tập có điểm" />
        </div>
      )}

      {/* Course grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Khóa học của tôi</h2>
          <Link to="/courses" className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
            Khám phá thêm <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : error ? (
          <div className="text-center py-16 text-slate-500">
            <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
            <p>{error}</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-white font-semibold mb-2">Chưa có khóa học nào</h3>
            <p className="text-slate-400 text-sm mb-4">Hãy đăng ký khóa học đầu tiên của bạn!</p>
            <Link to="/courses"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500
                         text-white text-sm font-medium rounded-xl transition-colors">
              Duyệt khóa học <ChevronRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {courses.map((item) => (
              <CourseCard key={item.courseId} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
