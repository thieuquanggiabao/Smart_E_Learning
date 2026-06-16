import { FileText } from 'lucide-react';

export function SubmissionsTab({ submissions, onOpenDetail }) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      <div className="p-5 border-b border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText size={20} className="text-violet-400" />
          Danh sách nộp bài ({submissions.length})
        </h2>
      </div>

      <div className="divide-y divide-white/5">
        {submissions.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <FileText size={36} className="mx-auto mb-3 opacity-40" />
            <p>Chưa có bài nộp nào.</p>
          </div>
        ) : (
          submissions.map(sub => (
            <div
              key={sub.submissionId}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.03] transition-colors"
            >
              <div>
                <h3 className="text-white font-medium text-sm flex items-center gap-2">
                  {sub.studentName}
                  {sub.status === 'overridden' && (
                    <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] rounded border border-blue-500/30">
                      Đã sửa điểm
                    </span>
                  )}
                </h3>
                <div className="text-xs text-slate-400 mt-1">Bài tập: {sub.assignmentTitle}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Nộp lúc: {new Date(sub.submittedAt).toLocaleString('vi-VN')}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Điểm AI: {sub.aiScore}/{sub.maxScore}</div>
                  {sub.instructorScore !== undefined && (
                    <div className="text-sm font-bold text-emerald-400">
                      GV chấm: {sub.instructorScore}/{sub.maxScore}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => onOpenDetail(sub)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/10"
                >
                  Chi tiết
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
