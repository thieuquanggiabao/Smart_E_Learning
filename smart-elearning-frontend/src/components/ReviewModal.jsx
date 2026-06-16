import { useState } from 'react';
import { Star, X, Send, CheckCircle2 } from 'lucide-react';
import api from '../services/api';
import { Spinner } from './ui';

// ══════════════════════════════════════════════════════════
// Backend: POST /api/reviews/:courseId/reviews
//   body     → { rating, comment }
//   response → { message, review: { courseId, studentId, rating, comment, createdAt } }
//   Lưu ý: Học viên phải đã enroll mới review được (backend check)
// ══════════════════════════════════════════════════════════
export default function ReviewModal({ courseId, onClose, onSuccess }) {
  const [rating, setRating]   = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Vui lòng chọn số sao đánh giá.'); return; }
    setLoading(true);
    setError('');
    try {
      // body: { rating, comment }
      await api.post(`/reviews/${courseId}/reviews`, { rating, comment });
      setDone(true);
      onSuccess?.();
      setTimeout(() => onClose(), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Gửi đánh giá thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const labels = ['', 'Tệ', 'Không tốt', 'Bình thường', 'Rất tốt', 'Xuất sắc! ⭐'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold text-lg">Đánh giá khóa học</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Success state */}
        {done ? (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <CheckCircle2 size={32} className="text-emerald-400" />
            </div>
            <p className="text-emerald-400 font-medium">Cảm ơn bạn đã đánh giá!</p>
          </div>
        ) : (
          <>
            {/* Stars — 1–5 */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  id={`star-${star}`}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="transition-transform hover:scale-110 active:scale-95"
                >
                  <Star
                    size={38}
                    fill={star <= (hovered || rating) ? '#f59e0b' : 'transparent'}
                    className={`transition-colors duration-150 ${
                      star <= (hovered || rating) ? 'text-amber-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-slate-400 mb-5 h-5">
              {labels[hovered || rating]}
            </p>

            {error && <p className="text-red-400 text-xs mb-3 text-center">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                id="review-comment"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn... (không bắt buộc)"
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                           text-sm text-white placeholder-slate-500 resize-none
                           focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
              />
              <button
                id="review-submit"
                type="submit"
                disabled={loading || rating === 0}
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600
                           hover:from-indigo-500 hover:to-violet-500
                           text-white font-medium rounded-xl text-sm
                           disabled:opacity-50 disabled:cursor-not-allowed
                           flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <Spinner size="sm" /> : <Send size={15} />}
                {loading ? 'Đang gửi...' : 'Gửi đánh giá'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
