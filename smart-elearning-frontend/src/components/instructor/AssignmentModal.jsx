import { Spinner } from '../ui';

export function AssignmentModal({
  show,
  onClose,
  onSubmit,
  form,
  setForm,
  saving,
  editingId,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <h2 className="text-lg font-semibold text-white mb-5">
          {editingId ? 'Cập nhật bài tập AI' : 'Tạo bài tập tự luận AI'}
        </h2>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Đề bài tập *</label>
            <input
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Mô tả / Yêu cầu chi tiết</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Tiêu chí chấm – Rubric (Dành cho AI) *</label>
            <textarea
              required
              value={form.rubric}
              onChange={e => setForm({ ...form, rubric: e.target.value })}
              placeholder="VD: Logic (4 điểm), Văn phong (3 điểm), Ví dụ (3 điểm)"
              rows={3}
              className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Điểm tối đa *</label>
            <input
              required
              type="number"
              min="1"
              max="100"
              value={form.maxScore}
              onChange={e => setForm({ ...form, maxScore: e.target.value })}
              className="w-full bg-white/5 border border-violet-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
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
              className="flex-1 py-2 text-sm bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-lg transition-colors flex justify-center"
            >
              {saving ? <Spinner size="sm" /> : (editingId ? 'Cập nhật' : 'Lưu bài tập')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
