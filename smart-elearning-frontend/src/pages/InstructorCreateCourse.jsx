import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Tag, BarChart2, Image, Sparkles, ChevronLeft } from 'lucide-react';
import axios from 'axios';
import api from '../services/api';
import { Spinner } from '../components/ui';

export default function InstructorCreateCourse() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    thumbnailUrl: '',
    category: '',
    level: 'beginner'
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingImage(true);
    setError('');
    
    try {
      // Lấy Signed URL từ backend
      const res = await api.post('/upload/generate-url', {
        fileName: file.name,
        contentType: file.type
      });
      
      const { uploadUrl, publicFileUrl } = res.data;

      // Upload trực tiếp lên GCS bằng Signed URL (chú ý dùng axios mặc định không đính kèm header Authorization riêng của api)
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        }
      });

      // Cập nhật state form với public URL
      setFormData({ ...formData, thumbnailUrl: publicFileUrl });
    } catch (err) {
      console.error('Lỗi upload file:', err);
      setError('Lỗi khi tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title) { setError('Vui lòng nhập tên khóa học.'); return; }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await api.post('/courses', formData);
      navigate(`/instructor/courses/${res.data.course.courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi tạo khóa học.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/instructor/dashboard')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ChevronLeft size={16} />
        Quay lại Dashboard
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Tạo khóa học mới</h1>
        <p className="text-slate-400 text-sm mt-1">Thiết lập thông tin cơ bản cho khóa học của bạn</p>
      </div>

      <div className="glass rounded-2xl border border-white/8 p-6">
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Tên khóa học <span className="text-red-400">*</span></label>
            <div className="relative">
              <BookOpen size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="VD: ReactJS Thực Chiến..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 
                           text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Mô tả khóa học</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Giới thiệu về khóa học..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 
                         text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Ảnh bìa khóa học (Thumbnail)</label>
            <div className="relative">
              {formData.thumbnailUrl ? (
                <div className="relative w-full h-48 rounded-xl overflow-hidden group">
                  <img src={formData.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <label className="cursor-pointer px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors flex items-center gap-2">
                      <Image size={16} /> Đổi ảnh
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-indigo-500/50 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImage ? (
                      <Spinner size="md" />
                    ) : (
                      <>
                        <Image size={24} className="text-slate-500 mb-2" />
                        <p className="mb-1 text-sm text-slate-400"><span className="font-semibold text-indigo-400">Nhấn để tải lên</span> hoặc kéo thả</p>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF (Max. 5MB)</p>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={uploadingImage} />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Danh mục</label>
              <div className="relative">
                <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="VD: Lập trình, Thiết kế..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 
                             text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Cấp độ</label>
              <div className="relative">
                <BarChart2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 
                             text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                >
                  <option value="beginner" className="bg-slate-800">Cơ bản</option>
                  <option value="intermediate" className="bg-slate-800">Trung cấp</option>
                  <option value="advanced" className="bg-slate-800">Nâng cao</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 
                         hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl 
                         transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
            >
              {loading ? <Spinner size="sm" /> : <Sparkles size={16} />}
              Tạo khóa học
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
