import { Video } from 'lucide-react';
import { Spinner } from '../ui';

export function LessonModal({
  show,
  onClose,
  onSubmit,
  form,
  setForm,
  saving,
  uploading,
  onVideoUpload,
  editingId,
  lessonCount,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">
          {editingId ? 'Chỉnh sửa bài giảng' : 'Thêm bài giảng mới'}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Tiêu đề *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Video URL (hoặc tải lên)</label>
            <div className="flex gap-2">
              <input
                value={form.videoUrl}
                onChange={e => setForm({ ...form, videoUrl: e.target.value })}
                placeholder="https://..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <label className="flex items-center justify-center px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg cursor-pointer transition-colors shrink-0">
                {uploading ? <Spinner size="sm" /> : <Video size={16} className="text-white" />}
                <input type="file" accept="video/*" onChange={onVideoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {uploading && <p className="text-xs text-indigo-400 mt-1">Đang tải video lên...</p>}
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Thứ tự (Order)</label>
            <input
              type="number"
              value={form.order}
              onChange={e => setForm({ ...form, order: e.target.value })}
              placeholder={lessonCount + 1}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex justify-center"
            >
              {saving ? <Spinner size="sm" /> : (editingId ? 'Cập nhật' : 'Lưu bài giảng')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
