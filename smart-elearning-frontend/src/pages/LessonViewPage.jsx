import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Play, CheckCircle2, ChevronLeft, ChevronRight,
  MessageSquare, FileText, Send, Sparkles, Bot, User,
  ThumbsUp, RotateCcw, AlertCircle, BookOpen, Star,
  Volume2, Maximize2, List, X, Menu, CheckCheck,
  Loader2, History, Lock
} from 'lucide-react';
import api from '../services/api';
import { Spinner, ProgressBar, Badge } from '../components/ui';
import ReviewModal from '../components/ReviewModal';
import ChatHistoryModal from '../components/student/ChatHistoryModal';
import AssessmentsAndPracticeTab from '../components/student/AssessmentsAndPracticeTab';

// ════════════════════════════════════════════════════════════════
//  BACKEND MAPPING:
//  GET  /api/courses/:courseId/lessons
//       → [{ lessonId, title, description, videoUrl, order, createdAt }]
//
//  POST /api/courses/:courseId/lessons/:lessonId/complete
//       → { message, progress, status, completedLessons }
//
//  POST /api/chat/ask
//       body: { courseId, lessonId, question }
//       → { message, answer }
//
//  POST /api/assignments/:assignmentId/submit
//       body: { answerText }
//       → { message, submissionId, gradingResult: { aiScore, aiFeedback, improvements } }
// ════════════════════════════════════════════════════════════════

// ─── ChatBot Panel ────────────────────────────────────────────
function ChatbotPanel({ courseId, lessonId, onOpenHistory }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: '👋 Xin chào! Tôi là trợ lý AI của bài học này.\n\nHãy hỏi bất cứ điều gì về nội dung bài học — tôi sẽ giải thích theo ngữ cảnh bài học hiện tại!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useCallback(async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      // body: { courseId, lessonId, question }  (backend yêu cầu đủ 3 field)
      const res = await api.post('/chat/ask', { courseId, lessonId, question: q });
      // response: { message, answer }
      setMessages(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Lỗi kết nối AI. Thử lại nhé!';
      setMessages(prev => [...prev, { role: 'ai', content: `⚠️ ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, courseId, lessonId]);

  const suggestedQuestions = [
    'Giải thích khái niệm chính trong bài',
    'Cho ví dụ thực tế',
    'Tóm tắt bài học này',
    'Bài này liên quan gì đến thực tế?',
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <span className="text-xs font-medium text-slate-400">Trợ lý AI</span>
        <button
          onClick={onOpenHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-indigo-300 transition-colors border border-white/5"
        >
          <History size={14} /> Lịch sử Hỏi đáp
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white
                             ${msg.role === 'ai'
                ? 'bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30'
                : 'bg-gradient-to-br from-slate-600 to-slate-700'}`}>
              {msg.role === 'ai' ? <Bot size={14} /> : <User size={14} />}
            </div>
            {/* Bubble */}
            <div className={`max-w-[84%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                            ${msg.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-white/6 border border-white/8 text-slate-200 rounded-tl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600
                            flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-white/6 border border-white/8 rounded-2xl rounded-tl-sm px-4 py-3
                            flex items-center gap-1.5">
              {[0, 150, 300].map(delay => (
                <span key={delay}
                  className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggested questions — only show when no conversation yet */}
      {messages.length === 1 && (
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          {suggestedQuestions.map(q => (
            <button
              key={q}
              onClick={() => { setInput(q); }}
              className="text-xs px-2.5 py-1.5 bg-indigo-500/10 border border-indigo-500/20
                         text-indigo-400 rounded-lg hover:bg-indigo-500/20 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-white/8">
        <div className="flex gap-2">
          <textarea
            id="chatbot-input"
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Hỏi AI về bài học... (Enter để gửi)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 resize-none
                       text-sm text-white placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
                       transition-all"
            style={{ minHeight: '42px', maxHeight: '100px' }}
          />
          <button
            id="chatbot-send"
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-[42px] h-[42px] flex-shrink-0 flex items-center justify-center
                       bg-gradient-to-br from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
                       text-white rounded-xl shadow-lg shadow-indigo-500/20
                       disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assignment Panel ─────────────────────────────────────────
function AssignmentPanel({ courseId, lessonId }) {
  const [assignmentId, setAssignmentId] = useState(null);
  const [assignmentInfo, setAssignmentInfo] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [result, setResult] = useState(null);   // gradingResult
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    if (!courseId || !lessonId) { setFetching(false); return; }
    setFetching(true);
    setResult(null);
    setAnswerText('');
    setError('');

    // Lấy bài tập của lesson này
    api.get(`/courses/${courseId}/assignments`)
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : [];
        const match = list.find(a => a.lessonId === lessonId);
        if (match) {
          setAssignmentId(match.assignmentId || match.id);
          setAssignmentInfo(match);
        }
      })
      .catch(() => { }) // Không có bài tập — bình thường
      .finally(() => setFetching(false));
  }, [courseId, lessonId]);

  const handleSubmit = async () => {
    if (!answerText.trim()) { setError('Vui lòng nhập bài làm của bạn.'); return; }
    if (!assignmentId) { setError('Bài học này chưa có bài tập.'); return; }
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // body: { answerText }  — đúng theo backend submitAndGrade
      const res = await api.post(`/assignments/${assignmentId}/submit`, { answerText });
      // response: { message, submissionId, gradingResult: { aiScore, aiFeedback, improvements, ... } }
      setResult(res.data.gradingResult);
    } catch (err) {
      setError(err.response?.data?.message || 'Nộp bài thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = s => s >= 8 ? 'text-emerald-400' : s >= 5 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = s => s >= 8 ? 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20'
    : s >= 5 ? 'from-amber-500/10 to-orange-500/5 border-amber-500/20'
      : 'from-red-500/10 to-rose-500/5 border-red-500/20';

  if (fetching) {
    return <div className="flex items-center justify-center h-32"><Spinner size="md" /></div>;
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-violet-500/15 flex items-center justify-center">
            <Sparkles size={15} className="text-violet-400" />
          </div>
          <div>
            <p className="text-white font-medium text-sm">Bài tập AI</p>
            <p className="text-slate-500 text-xs">Nộp bài — AI chấm điểm tức thì</p>
          </div>
        </div>

        {/* No assignment */}
        {!assignmentId && (
          <div className="text-center py-10">
            <div className="w-14 h-14 rounded-2xl bg-slate-500/10 flex items-center justify-center mx-auto mb-3">
              <FileText size={24} className="text-slate-500" />
            </div>
            <p className="text-slate-400 text-sm font-medium">Bài học này chưa có bài tập</p>
            <p className="text-slate-600 text-xs mt-1">Giảng viên chưa tạo bài tập cho bài học này.</p>
          </div>
        )}

        {assignmentId && (
          <>
            {/* Assignment info */}
            {assignmentInfo && (
              <div className="bg-gradient-to-br from-indigo-500/8 to-violet-500/5
                              border border-indigo-500/20 rounded-2xl p-4">
                <p className="text-white font-semibold text-sm mb-1">
                  📋 {assignmentInfo.title}
                </p>
                {assignmentInfo.description && (
                  <p className="text-slate-400 text-xs leading-relaxed">{assignmentInfo.description}</p>
                )}
                {assignmentInfo.rubric && (
                  <div className="mt-2 pt-2 border-t border-white/8">
                    <p className="text-xs text-slate-500">
                      <span className="text-slate-400 font-medium">Tiêu chí chấm: </span>
                      {assignmentInfo.rubric}
                    </p>
                  </div>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <Badge color="violet">Điểm tối đa: {assignmentInfo.maxScore ?? 10}</Badge>
                  {assignmentInfo.deadline && (
                    <Badge color="amber">Hạn: {new Date(assignmentInfo.deadline).toLocaleDateString('vi-VN')}</Badge>
                  )}
                </div>
              </div>
            )}

            {/* Text area */}
            {!result && (
              <>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block font-medium">
                    Bài làm của bạn
                  </label>
                  <div className="relative">
                    <textarea
                      id="assignment-answer"
                      value={answerText}
                      onChange={e => {
                        setAnswerText(e.target.value);
                        setCharCount(e.target.value.length);
                        setError('');
                      }}
                      placeholder={"Viết bài làm chi tiết của bạn tại đây...\n\nHãy nêu rõ ràng, có dẫn chứng và ví dụ cụ thể để được điểm cao."}
                      rows={10}
                      disabled={loading}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-3 resize-none
                                 text-sm text-white placeholder-slate-500/70
                                 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50
                                 disabled:opacity-60 transition-all leading-relaxed"
                    />
                    <span className="absolute bottom-2 right-3 text-xs text-slate-600">
                      {charCount} ký tự
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/8
                                  border border-red-500/20 rounded-xl px-3 py-2.5">
                    <AlertCircle size={13} />
                    {error}
                  </div>
                )}

                <button
                  id="assignment-submit-btn"
                  onClick={handleSubmit}
                  disabled={loading || !answerText.trim()}
                  className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600
                             hover:from-violet-500 hover:to-indigo-500
                             text-white font-semibold rounded-xl text-sm
                             shadow-lg shadow-violet-500/25
                             flex items-center justify-center gap-2
                             disabled:opacity-50 disabled:cursor-not-allowed
                             transition-all duration-200 active:scale-[0.98]"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> AI đang chấm bài...</>
                    : <><Sparkles size={16} /> Nộp bài để AI chấm</>
                  }
                </button>
              </>
            )}

            {/* AI grading loading */}
            {loading && (
              <div className="flex flex-col items-center py-6 gap-3">
                <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" />
                  <div className="relative w-16 h-16 rounded-full bg-violet-500/15
                                  flex items-center justify-center">
                    <Sparkles size={28} className="text-violet-400" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-white text-sm font-medium">AI đang phân tích bài làm...</p>
                  <p className="text-slate-500 text-xs mt-1">Thường mất 5–10 giây</p>
                </div>
              </div>
            )}

            {/* Result — gradingResult: { aiScore, aiFeedback, improvements } */}
            {result && !loading && (
              <div className="space-y-3">
                {/* Score card */}
                <div className={`bg-gradient-to-br ${scoreBg(result.aiScore)} border rounded-2xl p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-violet-400" />
                      <span className="text-white font-semibold text-sm">Kết quả chấm bài</span>
                    </div>
                    <button
                      id="retry-assignment"
                      onClick={() => { setResult(null); setAnswerText(''); setCharCount(0); }}
                      className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      <RotateCcw size={12} /> Làm lại
                    </button>
                  </div>

                  <div className="flex items-end gap-2 mb-3">
                    <span className={`text-5xl font-bold ${scoreColor(result.aiScore)}`}>
                      {result.aiScore}
                    </span>
                    <span className="text-2xl text-slate-500 pb-1">/ {assignmentInfo?.maxScore ?? 10}</span>
                  </div>

                  <ProgressBar
                    value={(result.aiScore / (assignmentInfo?.maxScore ?? 10)) * 100}
                    color={result.aiScore >= 8 ? 'emerald' : result.aiScore >= 5 ? 'indigo' : 'amber'}
                    showLabel={false}
                  />

                  <p className="text-xs text-slate-500 mt-2">
                    {result.aiScore >= 8 ? '🏆 Xuất sắc!'
                      : result.aiScore >= 6 ? '👍 Tốt, tiếp tục phát huy!'
                        : '💪 Cần cải thiện thêm'}
                  </p>
                </div>

                {/* aiFeedback */}
                {result.aiFeedback && (
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp size={14} className="text-indigo-400" />
                      <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wide">Nhận xét</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{result.aiFeedback}</p>
                  </div>
                )}

                {/* improvements */}
                {result.improvements && (
                  <div className="bg-emerald-500/6 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={14} className="text-emerald-400" />
                      <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Gợi ý cải thiện</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{result.improvements}</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main LessonViewPage ──────────────────────────────────────
export default function LessonViewPage() {
  const { courseId, lessonId: lessonIdParam } = useParams();
  const navigate = useNavigate();

  const [lessons, setLessons] = useState([]);
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [enrolled, setEnrolled] = useState(false);

  const [activeTab, setActiveTab] = useState('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load all lessons & Check enrollment
  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    api.get(`/courses/${courseId}/check-enrollment`)
      .then(res => setEnrolled(res.data.enrolled))
      .catch(() => setEnrolled(false));

    api.get(`/courses/${courseId}/lessons`)
      .then(res => {
        const ls = Array.isArray(res.data) ? res.data : [];
        setLessons(ls);
        const target = lessonIdParam
          ? ls.find(l => l.lessonId === lessonIdParam) ?? ls[0]
          : ls[0];
        setLesson(target ?? null);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [courseId, lessonIdParam]);

  // Khi URL param thay đổi (navigate giữa lessons)
  useEffect(() => {
    if (lessonIdParam && lessons.length > 0) {
      const found = lessons.find(l => l.lessonId === lessonIdParam);
      if (found) {
        setLesson(found);
        setCompleted(false);
        setProgress(0);
      }
    }
  }, [lessonIdParam, lessons]);

  const currentIndex = lessons.findIndex(l => l.lessonId === lesson?.lessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  const goToLesson = (l) => {
    navigate(`/courses/${courseId}/lessons/${l.lessonId}`);
    setSidebarOpen(false);
  };

  const handleMarkComplete = async () => {
    if (!lesson?.lessonId || completing || completed) return;
    setCompleting(true);
    try {
      // POST /courses/:courseId/lessons/:lessonId/complete
      const res = await api.post(`/courses/${courseId}/lessons/${lesson.lessonId}/complete`);
      // response: { message, progress, status, completedLessons }
      setCompleted(true);
      setProgress(res.data.progress ?? 0);
    } catch (err) {
      console.error('Lỗi đánh dấu hoàn thành:', err);
    } finally {
      setCompleting(false);
    }
  };

  const tabs = [
    { id: 'chat', label: 'AI Gia sư', icon: MessageSquare },
    { id: 'assignment', label: 'Bài tập', icon: FileText },
    { id: 'assessments', label: 'Đánh giá & Ôn tập', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-slate-500 text-sm">Đang tải bài học...</p>
        </div>
      </div>
    );
  }

  if (!lesson && lessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <BookOpen size={48} className="text-slate-600" />
        <div className="text-center">
          <p className="text-white font-medium">Khóa học chưa có bài giảng</p>
          <p className="text-slate-500 text-sm mt-1">Giảng viên đang cập nhật nội dung</p>
        </div>
        <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-indigo-300 text-sm">
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] -m-4 sm:-m-6 overflow-hidden relative">

      {/* ══ LEFT SIDEBAR — Lesson List ══ */}
      <aside className={`
        flex-shrink-0 w-72 border-r border-white/8 bg-[#0d0d1a]/90 backdrop-blur-sm
        flex flex-col overflow-hidden
        ${sidebarOpen ? 'fixed inset-y-0 left-0 z-50' : 'hidden'} lg:relative lg:flex
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/8 flex-shrink-0">
          <div className="flex items-center gap-2">
            <List size={15} className="text-indigo-400" />
            <span className="text-white text-sm font-semibold">Nội dung khóa học</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{lessons.length} bài</span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Progress overview */}
        {progress > 0 && (
          <div className="px-4 py-3 border-b border-white/5">
            <ProgressBar value={progress} color="emerald" />
          </div>
        )}

        {/* Lesson list */}
        <div className="flex-1 overflow-y-auto">
          {lessons.map((l, idx) => {
            const isActive = l.lessonId === lesson?.lessonId;
            return (
              <button
                key={l.lessonId}
                id={`sidebar-lesson-${l.lessonId}`}
                onClick={() => goToLesson(l)}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5
                             border-b border-white/4 transition-colors
                             ${isActive
                    ? 'bg-indigo-500/15 border-l-2 border-l-indigo-500'
                    : 'hover:bg-white/4 border-l-2 border-l-transparent'
                  }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5
                                 ${isActive ? 'bg-indigo-500/25 text-indigo-300' : 'bg-white/6 text-slate-500'}`}>
                  <span className="text-xs font-bold">{l.order ?? idx + 1}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-xs font-medium leading-snug line-clamp-2
                                 ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>
                    {l.title || `Bài ${idx + 1}`}
                  </p>
                  {l.videoUrl && (
                    <div className="flex items-center gap-1 mt-1">
                      <Play size={9} className="text-slate-500" />
                      <span className="text-xs text-slate-600">Video</span>
                    </div>
                  )}
                </div>
                {isActive && <Play size={12} className="text-indigo-400 flex-shrink-0 mt-1" />}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Overlay cho mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ══ MAIN AREA ══ */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8 flex-shrink-0 bg-[#0d0d1a]/60">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <Menu size={18} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm min-w-0 flex-1">
            <Link to={`/courses/${courseId}`} className="text-slate-500 hover:text-slate-300 transition-colors">
              Khóa học
            </Link>
            <ChevronRight size={12} className="text-slate-600 flex-shrink-0" />
            <span className="text-white font-medium truncate">
              {lesson?.title || 'Bài giảng'}
            </span>
          </div>

          {/* Lesson nav */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              disabled={!prevLesson}
              onClick={() => prevLesson && goToLesson(prevLesson)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-slate-500 px-1 select-none">
              {currentIndex + 1} / {lessons.length}
            </span>
            <button
              disabled={!nextLesson}
              onClick={() => nextLesson && goToLesson(nextLesson)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10
                         disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* Content area: Video + Right panel */}
        <div className="flex-1 flex overflow-hidden">

          {/* ─ Video + Info ─ */}
          {enrolled ? (
            <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
              {/* Video player */}
              <div className="bg-black flex-shrink-0">
                {lesson?.videoUrl ? (
                  <video
                    key={lesson.lessonId}
                    src={lesson.videoUrl}
                    controls
                    className="w-full aspect-video"
                  />
                ) : (
                  <div className="w-full aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
                    <p className="text-slate-700 text-xs">Bài học chưa có video</p>
                  </div>
                )}
              </div>

              {/* Lesson info */}
              <div className="p-4 sm:p-6 space-y-4">
                {/* Title + Complete button */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {lesson?.order && (
                      <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                        <BookOpen size={11} />
                        Bài {lesson.order} / {lessons.length}
                      </p>
                    )}
                    <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
                      {lesson?.title || 'Nội dung bài học'}
                    </h1>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      id="mark-complete-btn"
                      onClick={handleMarkComplete}
                      disabled={completing || completed}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold
                                  transition-all duration-200 shadow-md
                                  ${completed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                          : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                        } disabled:opacity-60`}
                    >
                      {completing
                        ? <Loader2 size={15} className="animate-spin" />
                        : completed
                          ? <CheckCheck size={15} />
                          : <CheckCircle2 size={15} />
                      }
                      {completed ? 'Đã hoàn thành' : completing ? 'Đang lưu...' : 'Đánh dấu xong'}
                    </button>

                    <button
                      id="rate-btn"
                      onClick={() => setShowReview(true)}
                      className="p-2.5 rounded-xl border border-amber-500/30 text-amber-400
                                 hover:bg-amber-500/15 transition-colors"
                      title="Đánh giá khóa học"
                    >
                      <Star size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress after completion */}
                {completed && progress > 0 && (
                  <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-2xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCheck size={15} className="text-emerald-400" />
                      <span className="text-emerald-400 text-sm font-medium">
                        Tiến độ tổng thể: {progress}%
                      </span>
                    </div>
                    <ProgressBar value={progress} color="emerald" showLabel={false} />
                    {progress >= 100 && (
                      <p className="text-emerald-300 text-xs mt-2">
                        🎉 Chúc mừng! Bạn đã hoàn thành khóa học!
                      </p>
                    )}
                  </div>
                )}

                {/* Description */}
                {lesson?.description && (
                  <div className="prose prose-sm max-w-none">
                    <p className="text-slate-400 text-sm leading-relaxed">{lesson.description}</p>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-2">
                  {prevLesson ? (
                    <button
                      onClick={() => goToLesson(prevLesson)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-white/10
                                 text-slate-300 hover:text-white hover:border-white/20
                                 rounded-xl text-sm transition-colors"
                    >
                      <ChevronLeft size={15} />
                      Bài trước
                    </button>
                  ) : <div />}

                  {nextLesson && (
                    <button
                      onClick={() => goToLesson(nextLesson)}
                      className="flex items-center gap-2 px-4 py-2.5
                                 bg-gradient-to-r from-indigo-600 to-violet-600
                                 hover:from-indigo-500 hover:to-violet-500
                                 text-white font-medium rounded-xl text-sm
                                 shadow-lg shadow-indigo-500/20 transition-all"
                    >
                      Bài tiếp theo
                      <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-[#0d0d1a] p-6 text-center">
              <Lock size={48} className="text-slate-500 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Nội dung bị khóa</h2>
              <p className="text-slate-400 mb-6 max-w-md">Bạn cần đăng ký hoặc mua khóa học này để có thể xem video bài giảng và làm bài tập.</p>
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
              >
                Trở lại trang khóa học
              </button>
            </div>
          )}

          {/* ─ Right panel: Chat + Assignment ─ */}
          {enrolled && (
            <div className="hidden xl:flex w-[400px] flex-shrink-0 flex-col
                            border-l border-white/8 bg-[#0d0d1a]/40">
              {/* Tabs */}
              <div className="flex border-b border-white/8 flex-shrink-0">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-medium
                                transition-all duration-200 border-b-2
                                ${activeTab === id
                        ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                        : 'text-slate-500 border-transparent hover:text-slate-300'}`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'chat' && <ChatbotPanel courseId={courseId} lessonId={lesson?.lessonId} onOpenHistory={() => setShowHistoryModal(true)} />}
                {activeTab === 'assignment' && <AssignmentPanel courseId={courseId} lessonId={lesson?.lessonId} />}
                {activeTab === 'assessments' && <AssessmentsAndPracticeTab courseId={courseId} />}
              </div>
            </div>
          )}
        </div>

        {/* ─ Mobile bottom tabs ─ */}
        <div className="xl:hidden border-t border-white/8 flex-shrink-0">
          <div className="flex">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id === activeTab ? '' : id)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium
                            transition-colors border-t-2
                            ${activeTab === id
                    ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5'
                    : 'text-slate-500 border-transparent'}`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          {/* Mobile panel */}
          {activeTab && enrolled && (
            <div className="h-96 border-t border-white/8 bg-[#0d0d1a]/90 overflow-hidden flex flex-col">
              {/* Content Panels */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-[#0d0d1a]/60">
                {activeTab === 'chat'
                  ? <ChatbotPanel courseId={courseId} lessonId={lesson?.lessonId} onOpenHistory={() => setShowHistoryModal(true)} />
                  : <AssignmentPanel courseId={courseId} lessonId={lesson?.lessonId} />
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review modal */}
      {showReview && (
        <ReviewModal
          courseId={courseId}
          onClose={() => setShowReview(false)}
          onSuccess={() => { }}
        />
      )}

      {/* Chat History Modal */}
      <ChatHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
      />
    </div>
  );
}