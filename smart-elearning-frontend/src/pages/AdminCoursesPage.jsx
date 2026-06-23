import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock, Trash2, Link } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Spinner } from '../components/ui';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/courses');
      setCourses(res.data.courses);
    } catch (error) {
      console.error('Lỗi lấy danh sách khóa học:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleUpdateStatus = async (courseId, newStatus) => {
    try {
      await api.put(`/admin/courses/${courseId}/status`, { status: newStatus });
      setCourses(courses.map(c => c.id === courseId ? { ...c, status: newStatus } : c));
    } catch (error) {
      alert('Không thể cập nhật trạng thái: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khóa học này? Thao tác này sẽ xóa mọi bài học bên trong!')) return;
    
    try {
      await api.delete(`/admin/courses/${courseId}`);
      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      alert('Lỗi khi xóa khóa học: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="p-6 flex justify-center"><Spinner /></div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <BookOpen className="text-emerald-400" size={28} />
        <h1 className="text-2xl font-bold text-white">Quản lý khóa học</h1>
      </div>

      <div className="bg-[#13131f] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/20 text-slate-400 text-xs uppercase tracking-wider border-b border-white/5">
                <th className="px-6 py-4 font-medium">Khóa học</th>
                <th className="px-6 py-4 font-medium">Giảng viên</th>
                <th className="px-6 py-4 font-medium">Trạng thái</th>
                <th className="px-6 py-4 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {courses.map(course => (
                <tr key={course.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 rounded-lg bg-white/5 flex-shrink-0 overflow-hidden">
                        {course.thumbnailUrl ? (
                          <img src={course.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-500">
                            <BookOpen size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium line-clamp-1">{course.title || 'Chưa có tên'}</div>
                        <div className="text-slate-400 text-xs">{course.level} • {course.totalLessons} bài</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">
                    {course.teacherName}
                  </td>
                  <td className="px-6 py-4">
                    {course.status === 'approved' ? (
                      <span className="px-2.5 py-1 text-xs rounded-lg border font-medium inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <CheckCircle size={12} /> Đã duyệt
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs rounded-lg border font-medium inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-400 border-amber-500/30">
                        <Clock size={12} /> Chờ duyệt
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => navigate(`/courses/${course.id}`)}
                        className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-colors"
                        title="Xem trang khóa học"
                      >
                        <Link size={16} />
                      </button>

                      {course.status !== 'approved' ? (
                        <button 
                          onClick={() => handleUpdateStatus(course.id, 'approved')}
                          className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl transition-colors text-xs font-medium"
                        >
                          Duyệt
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateStatus(course.id, 'pending')}
                          className="px-3 py-1.5 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-xl transition-colors text-xs font-medium"
                        >
                          Hủy duyệt
                        </button>
                      )}

                      <button 
                        onClick={() => handleDeleteCourse(course.id)}
                        className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-colors"
                        title="Xóa khóa học"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                    Hệ thống chưa có khóa học nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
