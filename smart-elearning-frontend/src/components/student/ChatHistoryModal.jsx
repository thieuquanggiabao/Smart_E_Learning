import { useState, useEffect } from 'react';
import { X, MessageSquare, Bot, User, Clock } from 'lucide-react';
import api from '../../services/api';
import { Spinner } from '../ui';

export default function ChatHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/chat/history')
      .then(res => {
        setHistory(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => console.error('Lỗi lấy lịch sử chat:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-3xl border border-white/10 shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <MessageSquare size={18} className="text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Lịch sử Hỏi đáp AI</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 pr-2 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner size="md" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MessageSquare size={36} className="mx-auto mb-3 opacity-40" />
              <p>Bạn chưa có lịch sử trò chuyện nào với AI Gia sư.</p>
            </div>
          ) : (
            history.map((item) => (
              <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 pb-2 border-b border-white/5">
                  <Clock size={12} />
                  <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                  {/* Có thể bổ sung tên course/lesson nếu fetch thêm info, tạm thời hiển thị ID hoặc ẩn */}
                </div>

                <div className="space-y-4">
                  {/* User Question */}
                  <div className="flex gap-3 flex-row-reverse">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0">
                      <User size={14} className="text-white" />
                    </div>
                    <div className="bg-indigo-600/20 border border-indigo-500/20 text-slate-200 px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
                      {item.question}
                    </div>
                  </div>

                  {/* AI Answer */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
                      <Bot size={14} className="text-white" />
                    </div>
                    <div className="bg-white/5 border border-white/5 text-slate-300 px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
