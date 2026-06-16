import { FileQuestion, Edit, Trash2, Plus, Clock } from 'lucide-react';

export default function QuizManagementTab({ quizzes, setQuizzes, onOpenQuizModal, onDeleteQuiz }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Quản lý Trắc nghiệm (Quiz)</h2>
          <p className="text-slate-400 text-sm">Tạo bài kiểm tra trắc nghiệm để đánh giá học viên định kỳ.</p>
        </div>
        <button
          onClick={() => onOpenQuizModal(null)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Tạo Quiz mới
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quizzes?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 glass rounded-2xl">
            <FileQuestion size={40} className="mx-auto mb-3 opacity-30" />
            <p>Khóa học chưa có bài kiểm tra trắc nghiệm nào.</p>
          </div>
        ) : (
          quizzes?.map((quiz) => (
            <div key={quiz.id} className="glass rounded-2xl p-5 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-semibold line-clamp-1">{quiz.title}</h3>
                </div>
                <p className="text-slate-400 text-sm line-clamp-2 mb-4">{quiz.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5"><FileQuestion size={14} /> {quiz.questions?.length || 0} câu</span>
                  <span className="flex items-center gap-1.5"><Clock size={14} /> {quiz.timeLimit} phút</span>
                </div>
              </div>
              <div className="flex gap-2 mt-5 pt-4 border-t border-white/5">
                <button
                  onClick={() => onOpenQuizModal(quiz)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs transition-colors"
                >
                  <Edit size={14} /> Sửa
                </button>
                <button
                  onClick={() => onDeleteQuiz(quiz.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs transition-colors"
                >
                  <Trash2 size={14} /> Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
