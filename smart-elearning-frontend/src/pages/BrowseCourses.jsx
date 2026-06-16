import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, Star, Users, ChevronRight, Tag } from 'lucide-react';
import api from '../services/api';
import { SkeletonCard, Badge } from '../components/ui';

// ══════════════════════════════════════════════════════════
// Backend: GET /api/courses
//   response → [ {
//     courseId, title, description, teacherId,
//     thumbnailUrl, category, level, totalLessons, createdAt, updatedAt
//   } ]
// ══════════════════════════════════════════════════════════

// Backend: POST /api/courses/:courseId/enroll
//   response → { message, enrollment }
// ══════════════════════════════════════════════════════════

function CourseCard({ course }) {
  const {
    courseId,
    title,
    description,
    category,
    level,
    totalLessons = 0,
    thumbnailUrl,
  } = course;

  const levelColor = {
    beginner:     'emerald',
    intermediate: 'amber',
    advanced:     'violet',
  }[level] || 'slate';

  const levelLabel = {
    beginner:     'Cơ bản',
    intermediate: 'Trung cấp',
    advanced:     'Nâng cao',
  }[level] || level;

  return (
    <div className="glass rounded-2xl overflow-hidden border border-white/8
                    hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1
                    hover:shadow-xl hover:shadow-indigo-500/10 group flex flex-col">
      {/* Thumbnail / Gradient banner */}
      <div className="h-40 bg-gradient-to-br from-indigo-900/60 via-violet-900/40 to-slate-900
                      flex items-center justify-center relative overflow-hidden flex-shrink-0">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <BookOpen size={40} className="text-indigo-300/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a]/80 to-transparent" />

        {/* Level badge */}
        <div className="absolute bottom-2 left-2 z-10">
          <Badge color={levelColor}>{levelLabel}</Badge>
        </div>
      </div>

      <div className="p-5 flex flex-col flex-1">
        {/* Category */}
        {category && (
          <div className="flex items-center gap-1 text-xs text-indigo-400 mb-1.5">
            <Tag size={10} />
            <span>{category}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-white font-semibold text-sm leading-snug mb-1.5 line-clamp-2 flex-1">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-slate-400 text-xs mb-3 line-clamp-2">
            {description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <BookOpen size={11} /> {totalLessons} bài
          </span>
        </div>

        {/* CTA */}
        <Link
          to={`/courses/${courseId}`}
          className="flex items-center justify-between text-xs font-medium text-indigo-400
                     hover:text-indigo-300 transition-colors group/link"
        >
          <span>Xem chi tiết</span>
          <ChevronRight size={13} className="group-hover/link:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}

export default function BrowseCourses() {
  // backend trả mảng trực tiếp: GET /courses → Course[]
  const [courses, setCourses]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/courses')
      .then(res => {
        // Backend trả mảng trực tiếp (không bọc object)
        const data = Array.isArray(res.data) ? res.data : [];
        setCourses(data);
      })
      .catch(err => setError(err.response?.data?.message || 'Không tải được danh sách khóa học.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Duyệt khóa học</h1>
        <p className="text-slate-400 text-sm mt-1">Khám phá các khóa học được hỗ trợ bởi AI</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          id="course-search"
          placeholder="Tìm kiếm khóa học..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5
                     text-sm text-white placeholder-slate-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-slate-500">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-400">Không tìm thấy khóa học phù hợp.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(course => (
            <CourseCard key={course.courseId} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
