import { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, CheckCircle2, XCircle, ArrowRight, Save, History, BookOpen } from 'lucide-react';
import api from '../../services/api';
import { Spinner } from '../ui';

export default function QuizTakingModal({ courseId, quiz, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState('intro'); // 'intro' | 'playing' | 'result'
  
  // Playing state
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(quiz.timeLimit * 60);
  const [timerInterval, setTimerInterval] = useState(null);

  // Result state
  const [resultData, setResultData] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Tải lịch sử làm bài
    const fetchSubmissions = async () => {
      try {
        const res = await api.get(`/courses/${courseId}/quizzes/${quiz.id}/submissions`);
        setSubmissions(res.data);
      } catch (err) {
        console.error('Lỗi tải lịch sử:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [courseId, quiz.id]);

  useEffect(() => {
    if (step === 'playing' && timeLeft > 0) {
      const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
      setTimerInterval(interval);
      return () => clearInterval(interval);
    } else if (step === 'playing' && timeLeft === 0) {
      handleSubmit(); // Hết giờ tự nộp
    }
  }, [step, timeLeft]);

  const handleStart = () => {
    setAnswers(new Array(quiz.questions.length).fill(null));
    setTimeLeft(quiz.timeLimit * 60);
    setStep('playing');
  };

  const handleSelectAnswer = (qIdx, optIdx) => {
    const newAnswers = [...answers];
    newAnswers[qIdx] = optIdx;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (timerInterval) clearInterval(timerInterval);
    setSubmitting(true);
    try {
      const res = await api.post(`/courses/${courseId}/quizzes/${quiz.id}/submit`, { answers });
      setResultData(res.data);
      setStep('result');
      // Thêm vào danh sách submissions luôn để cập nhật UI nếu tắt modal mở lại
      setSubmissions(prev => [{
        id: res.data.submissionId,
        score: res.data.score,
        totalScore: res.data.totalScore,
        submittedAt: new Date().toISOString()
      }, ...prev]);
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi nộp bài!');
      setStep('intro');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const attemptsLeft = quiz.maxAttempts > 0 ? Math.max(0, quiz.maxAttempts - submissions.length) : Infinity;
  const canTakeQuiz = quiz.maxAttempts === 0 || submissions.length < quiz.maxAttempts;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass rounded-3xl w-full max-w-3xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh] bg-[#0d0d1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white">{quiz.title}</h2>
          {step === 'playing' && (
            <div className={`px-4 py-1.5 rounded-full font-mono font-bold flex items-center gap-2 ${timeLeft < 60 ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-white/10 text-white'}`}>
              <Clock size={16} />
              {formatTime(timeLeft)}
            </div>
          )}
          {step !== 'playing' && (
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* ─── INTRO STEP ─── */}
        {step === 'intro' && (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-6 flex-1">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-400 mb-2">
              <BookOpen size={40} />
            </div>
            <div>
              <p className="text-slate-300 mb-4">{quiz.description}</p>
              <div className="flex flex-wrap justify-center gap-4 text-sm">
                <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-slate-300">
                  <strong className="text-white block text-lg">{quiz.questions.length}</strong> Câu hỏi
                </span>
                <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-slate-300">
                  <strong className="text-white block text-lg">{quiz.timeLimit}</strong> Phút
                </span>
                <span className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-slate-300">
                  <strong className="text-white block text-lg">{quiz.maxAttempts === 0 ? '∞' : quiz.maxAttempts}</strong> Lượt làm tối đa
                </span>
              </div>
            </div>

            {submissions.length > 0 && (
              <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-2xl p-4 text-left">
                <h4 className="text-white font-medium mb-3 flex items-center gap-2"><History size={16}/> Lịch sử làm bài ({submissions.length})</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                  {submissions.map((sub, i) => (
                    <div key={sub.id} className="flex justify-between items-center text-sm p-2 bg-black/40 rounded-lg">
                      <span className="text-slate-400">Lần {submissions.length - i}</span>
                      <span className="text-emerald-400 font-bold">{sub.score} / {sub.totalScore} đ</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4">
              {!canTakeQuiz ? (
                <div className="flex items-center gap-2 text-rose-400 bg-rose-500/10 px-6 py-3 rounded-xl border border-rose-500/20">
                  <AlertTriangle size={20} />
                  <span>Bạn đã hết lượt làm bài!</span>
                </div>
              ) : (
                <button
                  onClick={handleStart}
                  className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                >
                  Bắt đầu làm bài <ArrowRight size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── PLAYING STEP ─── */}
        {step === 'playing' && (
          <div className="p-6 overflow-y-auto flex-1 space-y-8">
            {quiz.questions.map((q, qIdx) => (
              <div key={q.id} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  <span className="text-indigo-400 mr-2">Câu {qIdx + 1}:</span>
                  {q.questionText}
                </h3>
                <div className="space-y-3">
                  {q.options.map((opt, optIdx) => {
                    const isSelected = answers[qIdx] === optIdx;
                    return (
                      <label 
                        key={optIdx} 
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          isSelected 
                            ? 'bg-indigo-600/20 border-indigo-500 text-white' 
                            : 'bg-black/40 border-white/5 text-slate-300 hover:border-white/20'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={isSelected}
                          onChange={() => handleSelectAnswer(qIdx, optIdx)}
                          className="w-5 h-5 text-indigo-500 bg-black border-white/20 focus:ring-indigo-500 focus:ring-offset-black"
                        />
                        <span className="flex-1">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex justify-end pt-4 border-t border-white/10">
              <button
                onClick={() => {
                  if(confirm('Bạn có chắc chắn muốn nộp bài?')) handleSubmit();
                }}
                disabled={submitting}
                className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Spinner size="sm" /> : <Save size={18} />} Nộp Bài
              </button>
            </div>
          </div>
        )}

        {/* ─── RESULT STEP ─── */}
        {step === 'result' && resultData && (
          <div className="p-6 overflow-y-auto flex-1 space-y-6 text-center">
            <div className="py-8">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-500/20">
                <CheckCircle2 size={48} />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Hoàn Thành!</h2>
              <p className="text-slate-400 mb-6">Bạn đã nộp bài thành công.</p>
              
              <div className="inline-block bg-white/5 border border-white/10 rounded-2xl p-6 px-12">
                <div className="text-sm text-slate-400 mb-1">Điểm số của bạn</div>
                <div className="text-5xl font-black text-emerald-400">
                  {resultData.score} <span className="text-2xl text-slate-500">/ {resultData.totalScore}</span>
                </div>
              </div>
            </div>

            <div className="text-left space-y-4 max-w-2xl mx-auto">
              <h3 className="text-white font-medium border-b border-white/10 pb-2">Chi tiết đáp án:</h3>
              {resultData.results.map((r, i) => {
                const q = quiz.questions.find(x => x.id === r.questionId);
                return (
                  <div key={r.questionId} className={`p-4 rounded-xl border ${r.isCorrect ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                    <div className="flex gap-3">
                      <div className="mt-1">
                        {r.isCorrect ? <CheckCircle2 className="text-emerald-400" size={20}/> : <XCircle className="text-rose-400" size={20}/>}
                      </div>
                      <div>
                        <p className="text-white mb-2"><span className="text-slate-400">Câu {i+1}:</span> {q.questionText}</p>
                        <p className="text-sm text-emerald-400">Đáp án đúng: {q.options[r.correctOption]}</p>
                        {!r.isCorrect && (
                          <p className="text-sm text-rose-400">Bạn chọn: {r.selectedOption !== null ? q.options[r.selectedOption] : 'Chưa làm'}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-8">
              <button
                onClick={onClose}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
