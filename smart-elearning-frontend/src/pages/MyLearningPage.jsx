import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Play, ChevronRight,
  Clock, CheckCircle2, TrendingUp
} from 'lucide-react';
import api from '../services/api';
import { ProgressBar, SkeletonCard, Badge } from '../components/ui';

// ══════════════════════════════════════════════════════════
// Backend: GET /api/enrollments/my-courses
//   response → [ {
//     enrollmentId, progress, enrolledAt,
//     course: { courseId, title, description, thumbnailUrl,
//               category, level, totalLessons, createdAt, ... }
//   } ]
// ══════════════════════════════════════════════════════════
export default function MyLearningPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/enrollments/my-courses')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setEnrollments(data);
      })
      .catch(err => setError(err.response?.data?.message || 'Không tải được danh sách.'))
      .finally(() => setLoading(false));
  }, []);

  const inProgress = enrollments.filter(e => (e.progress ?? 0) < 100);
  const completed  = enrollments.filter(e => (e.progress ?? 0) >= 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Khóa học của tôi</h1>
        <p className="text-slate-400 text-sm mt-1">{enrollments.length} khóa học đã đăng ký</p>
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
      ) : enrollments.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={36} className="text-indigo-400" />
          </div>
          <h2 className="text-white font-semibold text-lg mb-2">Chưa có khóa học nào</h2>
          <p className="text-slate-400 text-sm mb-4">Đăng ký khóa học đầu tiên để bắt đầu học!</p>
          <Link to="/courses"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500
                       text-white text-sm font-medium rounded-xl transition-colors">
            Khám phá khóa học <ChevronRight size={14} />
          </Link>
        </div>
      ) : (
        <>
          {/* In progress */}
          {inProgress.length > 0 && (
            <Section title="Đang học" icon={TrendingUp} color="indigo">
              {inProgress.map(e => (
                <EnrollmentCard key={e.enrollmentId} enrollment={e} />
              ))}
            </Section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <Section title="Đã hoàn thành" icon={CheckCircle2} color="emerald">
              {completed.map(e => (
                <EnrollmentCard key={e.enrollmentId} enrollment={e} />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, color, children }) {
  const colors = { indigo: 'text-indigo-400', emerald: 'text-emerald-400' };
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className={colors[color]} />
        <h2 className="text-white font-semibold">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );
}

function EnrollmentCard({ enrollment }) {
  // enrollment: { enrollmentId, progress, enrolledAt,
  //   course: { courseId, title, description, thumbnailUrl, category, level, totalLessons } }
  const { progress = 0, enrolledAt, course } = enrollment;
  const {
    courseId, title, description,
    thumbnailUrl, category, level, totalLessons = 0
  } = course ?? {};

  const isComplete = (progress ?? 0) >= 100;

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/8
                    hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1
                    hover:shadow-xl hover:shadow-indigo-500/10 group flex flex-col">
      {/* Thumbnail */}
      <div className="h-36 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-slate-900
                      flex items-center justify-center relative overflow-hidden">
        {thumbnailUrl
          ? <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
          : <BookOpen size={32} className="text-indigo-300/40" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a]/80 to-transparent" />

        {isComplete && (
          <div className="absolute top-2 right-2 z-10">
            <Badge color="emerald">✓ Hoàn thành</Badge>
          </div>
        )}

        {/* Hover play */}
        {courseId && (
          <Link
            to={`/courses/${courseId}/lessons`}
            className="absolute inset-0 flex items-center justify-center z-20
                       opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center
                            shadow-xl shadow-indigo-500/40">
              <Play size={20} className="text-white ml-1" />
            </div>
          </Link>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1">
        {category && (
          <p className="text-xs text-indigo-400 mb-1">{category}</p>
        )}

        <h3 className="text-white font-semibold text-sm leading-snug mb-2 line-clamp-2">
          {title ?? 'Khóa học không có tên'}
        </h3>

        <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
          <BookOpen size={11} />
          <span>{totalLessons} bài giảng</span>
          {enrolledAt && (
            <>
              <span>·</span>
              <Clock size={11} />
              <span>{new Date(enrolledAt).toLocaleDateString('vi-VN')}</span>
            </>
          )}
        </div>

        {/* Progress */}
        <ProgressBar value={progress} color={isComplete ? 'emerald' : 'indigo'} />

        {/* CTA */}
        {courseId && (
          <Link
            to={`/courses/${courseId}/lessons`}
            className="mt-4 flex items-center justify-between text-xs font-medium
                       text-indigo-400 hover:text-indigo-300 transition-colors group/link"
          >
            <span>{isComplete ? 'Xem lại' : progress > 0 ? 'Tiếp tục' : 'Bắt đầu'}</span>
            <ChevronRight size={13} className="group-hover/link:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
    </div>
  );
}
