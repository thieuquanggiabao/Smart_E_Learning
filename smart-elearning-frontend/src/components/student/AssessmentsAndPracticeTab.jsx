import { useState, useEffect } from 'react';
import { BookOpen, Sparkles, BrainCircuit, Play, History, Trash2, Clock, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { Spinner } from '../ui';
import QuizTakingModal from './QuizTakingModal';
import SelfStudyModal from './SelfStudyModal';

export default function AssessmentsAndPracticeTab({ courseId }) {
  const [quizzes, setQuizzes] = useState([]);
  const [studySets, setStudySets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedStudySet, setSelectedStudySet] = useState(null);
  const [generatingType, setGeneratingType] = useState(null); // 'flashcard' | 'quiz' | null

  const loadData = async () => {
    setLoading(true);
    try {
      const [quizRes, studySetRes] = await Promise.all([
        api.get(`/courses/${courseId}/quizzes`),
        api.get(`/courses/${courseId}/study-sets`)
      ]);
      setQuizzes(quizRes.data);
      setStudySets(studySetRes.data);
    } catch (err) {
      console.error('Lỗi tải dữ liệu đánh giá:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId]);

  const handleGenerateAI = async (type) => {
    setGeneratingType(type);
    try {
      await api.post(`/courses/${courseId}/study-sets/generate`, { type, amount: 5 });
      await loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi tạo bộ ôn tập!');
    } finally {
      setGeneratingType(null);
    }
  };

  const handleDeleteStudySet = async (setId) => {
    if (!confirm('Xóa bộ ôn tập này?')) return;
    try {
      await api.delete(`/courses/${courseId}/study-sets/${setId}`);
      setStudySets(prev => prev.filter(s => s.id !== setId));
    } catch (err) {
      alert('Lỗi xóa bộ ôn tập!');
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center"><Spinner /></div>;
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-8 bg-[#0a0a14] custom-scrollbar">
      {/* ─── BÀI KIỂM TRA (GIẢNG VIÊN) ─── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="text-indigo-400" size={20} />
          <h2 className="text-lg font-bold text-white">Bài Kiểm Tra (Từ Giảng Viên)</h2>
        </div>
        
        {quizzes.length === 0 ? (
          <div className="text-center p-8 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <p className="text-slate-400 text-sm">Chưa có bài kiểm tra nào.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {quizzes.map(quiz => (
              <div key={quiz.id} className="p-5 bg-black/40 border border-white/5 hover:border-indigo-500/30 rounded-2xl transition-colors cursor-pointer group"
                   onClick={() => setSelectedQuiz(quiz)}>
                <h3 className="text-white font-medium mb-1 group-hover:text-indigo-300 transition-colors">{quiz.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3 h-8">{quiz.description || 'Không có mô tả'}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Clock size={14}/> {quiz.timeLimit} phút</span>
                  <span className="flex items-center gap-1"><CheckCircle size={14}/> {quiz.questions?.length || 0} câu</span>
                  {quiz.maxAttempts > 0 && (
                    <span className="flex items-center gap-1 text-orange-400/80"><History size={14}/> Tối đa {quiz.maxAttempts} lần</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ─── GÓC ÔN TẬP (AI) ─── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BrainCircuit className="text-emerald-400" size={20} />
            <h2 className="text-lg font-bold text-white">Góc Tự Luyện (AI)</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleGenerateAI('flashcard')}
              disabled={generatingType !== null}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium transition-colors"
            >
              {generatingType === 'flashcard' ? <Spinner size="sm" /> : <Sparkles size={14} />} Flashcard
            </button>
            <button
              onClick={() => handleGenerateAI('quiz')}
              disabled={generatingType !== null}
              className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-lg text-xs font-medium transition-colors"
            >
              {generatingType === 'quiz' ? <Spinner size="sm" /> : <Sparkles size={14} />} Quiz
            </button>
          </div>
        </div>

        {studySets.length === 0 ? (
          <div className="text-center p-8 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 border-dashed">
            <Sparkles className="mx-auto mb-2 text-emerald-500/40" size={24} />
            <p className="text-slate-400 text-sm">Dùng AI sinh Flashcard hoặc Quiz để tự ôn tập!</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {studySets.map(set => (
              <div key={set.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl relative group flex items-start gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                   onClick={() => setSelectedStudySet(set)}>
                <div className={`p-3 rounded-xl ${set.type === 'flashcard' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-violet-500/10 text-violet-400'}`}>
                  {set.type === 'flashcard' ? <BookOpen size={20} /> : <BrainCircuit size={20} />}
                </div>
                <div className="flex-1">
                  <h3 className="text-white text-sm font-medium mb-1 group-hover:text-emerald-300">{set.title}</h3>
                  <p className="text-xs text-slate-500">{set.content?.length || 0} mục</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteStudySet(set.id); }}
                  className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modals */}
      {selectedQuiz && (
        <QuizTakingModal 
          courseId={courseId} 
          quiz={selectedQuiz} 
          onClose={() => setSelectedQuiz(null)} 
        />
      )}

      {selectedStudySet && (
        <SelfStudyModal 
          studySet={selectedStudySet} 
          onClose={() => setSelectedStudySet(null)} 
        />
      )}
    </div>
  );
}
