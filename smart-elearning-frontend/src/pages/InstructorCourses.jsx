import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, ChevronRight, BarChart3, Sparkles } from 'lucide-react';
import api from '../services/api';
import { ProgressBar, Spinner } from '../components/ui';

export default function InstructorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/instructor/dashboard')
      .then(res => setCourses(res.data.dashboard || []))
      .catch(err => setError(err.response?.data?.message || 'Không tải được danh sách khóa học.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý khóa học</h1>
          <p className="text-slate-400 text-sm mt-1">
            Chọn một khóa học để chỉnh sửa bài giảng và thêm bài tập AI
          </p>
        </div>
        <Link 
          to="/instructor/courses/new" 
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 
                     text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={16} />
          Tạo khóa học mới
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">{error}</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-20 glass rounded-2xl border border-white/8">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-600" />
          <h2 className="text-white font-semibold mb-2">Bạn chưa có khóa học nào</h2>
          <p className="text-slate-400 text-sm mb-6">Hãy bắt đầu chia sẻ kiến thức của bạn ngay hôm nay.</p>
          <Link 
            to="/instructor/courses/new" 
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all"
          >
            <Plus size={16} />
            Tạo khóa học đầu tiên
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map(course => (
            <Link 
              key={course.courseId} 
              to={`/instructor/courses/${course.courseId}`}
              className="glass rounded-2xl p-5 border border-white/8 hover:border-indigo-500/30 hover:bg-white/5 transition-all group flex flex-col h-full"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-500/30 transition-colors">
                  <BookOpen size={20} className="text-indigo-400" />
                </div>
                {course.classAverageScore > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-xs font-medium rounded-lg border border-amber-500/20">
                    <Sparkles size={12} />
                    {course.classAverageScore}/10
                  </div>
                )}
              </div>
              
              <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-indigo-300 transition-colors line-clamp-1">{course.courseTitle}</h3>
              <p className="text-slate-400 text-sm mb-4">{course.totalStudents ?? 0} học viên</p>
              
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-sm font-medium text-indigo-400">Chỉnh sửa nội dung</span>
                <ChevronRight size={16} className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
