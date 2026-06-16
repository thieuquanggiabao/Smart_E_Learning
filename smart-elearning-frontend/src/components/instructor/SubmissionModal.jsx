import { Spinner } from '../ui';

export function SubmissionModal({
  show,
  onClose,
  submission,
  reviewForm,
  setReviewForm,
  onSubmit,
  saving,
}) {
  if (!show || !submission) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-2xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
        <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-4">
          Chi tiết bài nộp của {submission.studentName}
        </h2>

        <div className="overflow-y-auto flex-1 pr-1 space-y-4">
          {/* Student answer */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Bài làm của học viên:</h3>
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-300 whitespace-pre-wrap">
              {submission.answerText}
            </div>
          </div>

          {/* AI feedback */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">Nhận xét của AI:</h3>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-100 space-y-1">
              <div className="font-bold text-emerald-400">
                Điểm AI: {submission.aiScore}/{submission.maxScore}
              </div>
              <p>{submission.aiFeedback}</p>
              {submission.improvements && (
                <p className="text-emerald-200">
                  <strong>Gợi ý cải thiện: </strong>{submission.improvements}
                </p>
              )}
            </div>
          </div>

          {/* Instructor override form */}
          <form onSubmit={onSubmit} className="border-t border-white/10 pt-4 space-y-4">
            <h3 className="text-sm font-medium text-indigo-300">
              Đánh giá của Giảng viên (Ghi đè điểm AI)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-1">
                <label className="block text-xs text-slate-400 mb-1">Điểm mới</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max={submission.maxScore}
                  required
                  value={reviewForm.instructorScore}
                  onChange={e => setReviewForm({ ...reviewForm, instructorScore: e.target.value })}
                  className="w-full bg-white/5 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-xs text-slate-400 mb-1">Nhận xét của Giảng viên</label>
                <textarea
                  value={reviewForm.instructorFeedback}
                  onChange={e => setReviewForm({ ...reviewForm, instructorFeedback: e.target.value })}
                  rows={2}
                  placeholder="Để lại lời nhắn cho học viên..."
                  className="w-full bg-white/5 border border-indigo-500/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-300 hover:bg-white/10 rounded-lg transition-colors"
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center justify-center min-w-[120px]"
              >
                {saving ? <Spinner size="sm" /> : 'Lưu đánh giá'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
