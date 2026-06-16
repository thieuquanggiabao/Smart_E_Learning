import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Play, Clock, Star, Users, ChevronRight,
  CheckCircle2, Lock, Tag, BarChart2, Award, ArrowLeft,
  Sparkles, Globe, Shield, Zap
} from 'lucide-react';
import api from '../services/api';
import { Spinner, Badge, ProgressBar } from '../components/ui';
import { useAuth } from '../context/AuthContext';

// ════════════════════════════════════════════════
//  Backend APIs used:
//  GET  /api/courses/:id          → course object
//  GET  /api/courses/:courseId/lessons → lesson[]
//  POST /api/courses/:courseId/enroll  → enrollment
// ════════════════════════════════════════════════

const levelConfig = {
  beginner:     { label: 'Cơ bản',   color: 'emerald' },
  intermediate: { label: 'Trung cấp', color: 'amber'   },
  advanced:     { label: 'Nâng cao',  color: 'violet'  },
};

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [course,    setCourse]    = useState(null);
  const [lessons,   setLessons]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled,  setEnrolled]  = useState(false);
  const [enrollErr, setEnrollErr] = useState('');

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    Promise.all([
      api.get(`/courses/${courseId}`),
      api.get(`/courses/${courseId}/lessons`),
    ])
      .then(([courseRes, lessonsRes]) => {
        // GET /courses/:id → course object trực tiếp
        setCourse(courseRes.data);
        // GET /courses/:courseId/lessons → lesson[]
        const ls = Array.isArray(lessonsRes.data) ? lessonsRes.data : [];
        setLessons(ls);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setEnrollErr('');
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setEnrolled(true);
      // Chuyển sang trang xem bài học đầu tiên
      if (lessons.length > 0) {
        const first = lessons[0];
        navigate(`/courses/${courseId}/lessons/${first.lessonId}`);
      } else {
        navigate(`/courses/${courseId}/lessons`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại.';
      // "Bạn đã đăng ký khóa học này rồi!" → điều hướng
      if (err.response?.status === 400) {
        navigate(`/courses/${courseId}/lessons`);
      } else {
        setEnrollErr(msg);
      }
    } finally {
      setEnrolling(false);
    }
  };

  const level  = course?.level || 'beginner';
  const lvlCfg = levelConfig[level] || levelConfig.beginner;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-24">
        <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
        <p className="text-slate-400">Không tìm thấy khóa học.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ArrowLeft size={16} />
        Quay lại
      </button>

      {/* Hero */}
      <div className="glass rounded-3xl overflow-hidden border border-white/8">
        {/* Banner */}
        <div className="relative h-48 sm:h-64 bg-gradient-to-br from-indigo-900/80 via-violet-900/60 to-slate-900
                        flex items-center justify-center overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
          ) : null}
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/15 rounded-full blur-3xl" />

          {/* Level badge */}
          <div className="absolute top-4 left-4 z-10">
            <Badge color={lvlCfg.color}>{lvlCfg.label}</Badge>
          </div>

          {/* Category */}
          {course.category && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5
                            text-xs text-white/60 bg-white/10 rounded-lg px-2.5 py-1">
              <Tag size={11} />
              {course.category}
            </div>
          )}

          {/* Big play icon center */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full bg-indigo-500/20 backdrop-blur-sm
                            border border-indigo-500/30 flex items-center justify-center">
              <BookOpen size={36} className="text-indigo-300" />
            </div>
          </div>
        </div>

        {/* Info section */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left — title + desc */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">
                {course.title}
              </h1>
              {course.description && (
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  {course.description}
                </p>
              )}

              {/* Course stats row */}
              <div className="flex flex-wrap gap-5 text-sm">
                <div className="flex items-center gap-2 text-slate-300">
                  <BookOpen size={15} className="text-indigo-400" />
                  <span>{course.totalLessons ?? lessons.length} bài giảng</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <BarChart2 size={15} className="text-amber-400" />
                  <span>{lvlCfg.label}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Sparkles size={15} className="text-violet-400" />
                  <span>AI chấm bài tự động</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Award size={15} className="text-emerald-400" />
                  <span>Chứng chỉ hoàn thành</span>
                </div>
              </div>

              {/* What you'll learn */}
              <div className="mt-6 p-4 bg-indigo-500/8 border border-indigo-500/20 rounded-2xl">
                <h3 className="text-white font-semibold mb-3 text-sm">Bạn sẽ học được gì?</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    'Kiến thức nền tảng toàn diện',
                    'Thực hành qua bài tập thực tế',
                    'Phản hồi tức thời từ AI gia sư',
                    'Chứng chỉ sau khi hoàn thành',
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — Enroll card */}
            <div className="lg:w-72 flex-shrink-0">
              <div className="glass rounded-2xl border border-white/10 p-5 sticky top-4">
                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Globe size={12} /> <span>Học trực tuyến, theo tiến độ riêng</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Shield size={12} /> <span>Truy cập mãi mãi sau khi đăng ký</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Zap size={12} /> <span>AI gia sư hỗ trợ 24/7</span>
                  </div>
                </div>

                {enrollErr && (
                  <p className="text-red-400 text-xs mb-3 text-center">{enrollErr}</p>
                )}

                <button
                  id="enroll-btn"
                  onClick={handleEnroll}
                  disabled={enrolling || enrolled}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600
                             hover:from-indigo-500 hover:to-violet-500
                             text-white font-semibold rounded-xl text-sm
                             shadow-lg shadow-indigo-500/30
                             flex items-center justify-center gap-2
                             disabled:opacity-60 disabled:cursor-not-allowed
                             transition-all duration-200 active:scale-[0.98] mb-3"
                >
                  {enrolling ? <Spinner size="sm" /> : <Play size={16} />}
                  {enrolling ? 'Đang đăng ký...' : enrolled ? 'Đã đăng ký!' : 'Đăng ký & Học ngay'}
                </button>

                <Link
                  to={`/courses/${courseId}/lessons`}
                  className="w-full py-2.5 flex items-center justify-center gap-2
                             border border-white/10 text-slate-300 hover:text-white
                             text-sm rounded-xl transition-colors"
                >
                  Xem nội dung khóa học
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lesson list */}
      <div className="glass rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" />
            <h2 className="text-white font-semibold">Nội dung khóa học</h2>
            <span className="text-xs text-slate-500 ml-1">({lessons.length} bài)</span>
          </div>
        </div>

        {lessons.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Clock size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Khóa học đang được cập nhật nội dung...</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {lessons.map((lesson, idx) => (
              <Link
                key={lesson.lessonId}
                to={`/courses/${courseId}/lessons/${lesson.lessonId}`}
                id={`lesson-item-${lesson.lessonId}`}
                className="flex items-center gap-4 px-6 py-4
                           hover:bg-white/3 transition-colors group"
              >
                {/* Order circle */}
                <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-indigo-500/10
                                border border-indigo-500/20 flex items-center justify-center
                                group-hover:bg-indigo-500/20 transition-colors">
                  <span className="text-xs font-bold text-indigo-400">{lesson.order ?? idx + 1}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium group-hover:text-indigo-300
                                transition-colors truncate">
                    {lesson.title || `Bài ${idx + 1}`}
                  </p>
                  {lesson.description && (
                    <p className="text-slate-500 text-xs mt-0.5 truncate">{lesson.description}</p>
                  )}
                </div>

                {/* Video indicator */}
                <div className="flex-shrink-0 flex items-center gap-2">
                  {lesson.videoUrl
                    ? <Play size={13} className="text-indigo-400" />
                    : <Lock size={13} className="text-slate-600" />
                  }
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400
                                                      transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
