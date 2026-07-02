import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Play, CheckCircle2, MessageSquare, FileText,
  Send, Sparkles, ChevronDown, Volume2, Maximize2,
  Star, RotateCcw, ThumbsUp, AlertCircle, Bot, User, History
} from 'lucide-react';
import api from '../services/api';
import { Spinner, ProgressBar, Badge } from '../components/ui';
import ReviewModal from '../components/ReviewModal';
import ChatHistoryModal from '../components/student/ChatHistoryModal';

// ══════════════════════════════════════════════════════════
// Backend: POST /api/chat/ask
//   body   → { courseId, lessonId, question }
//   response → { message, answer }
// ══════════════════════════════════════════════════════════
function ChatTab({ courseId, lessonId, onOpenHistory }) {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: '👋 Xin chào! Tôi là trợ lý AI của bài học này. Hãy hỏi tôi bất cứ điều gì về nội dung bài học!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      // body đúng theo backend: courseId, lessonId, question
      const res = await api.post('/chat/ask', { courseId, lessonId, question: q });
      // response: { message, answer }
      setMessages(m => [...m, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      const msg = err.response?.data?.message || 'Lỗi kết nối AI. Vui lòng thử lại.';
      setMessages(m => [...m, { role: 'ai', content: `⚠️ ${msg}` }]);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center
                             ${msg.role === 'ai'
                               ? 'bg-gradient-to-br from-indigo-500 to-violet-600'
                               : 'bg-gradient-to-br from-slate-600 to-slate-700'
                             }`}>
              {msg.role === 'ai'
                ? <Bot size={14} className="text-white" />
                : <User size={14} className="text-white" />
              }
            </div>
            <div className={`max-w-[85%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap
                            ${msg.role === 'user'
                              ? 'chat-bubble-user text-white rounded-tr-sm'
                              : 'chat-bubble-ai text-slate-200 rounded-tl-sm'
                            }`}>
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
            <div className="chat-bubble-ai rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 p-3 border-t border-white/8">
        <div className="flex gap-2">
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Hỏi AI gia sư về bài học..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5
                       text-sm text-white placeholder-slate-500
                       focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50"
          />
          <button
            id="chat-send"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="w-10 h-10 flex-shrink-0 flex items-center justify-center
                       bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Backend: POST /api/assignments/:assignmentId/submit
//   body     → { answerText }
//   response → {
//     message, submissionId,
//     gradingResult: { assignmentId, courseId, studentId,
//                      answerText, aiScore, aiFeedback,
//                      improvements, status, submittedAt }
//   }
// ══════════════════════════════════════════════════════════
// Single assignment submission sub-component
function SingleAssignmentItem({ assignment, index, total }) {
  const [answerText, setAnswerText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(index === 0); // mở bài đầu tiên mặc định

  const assignmentId = assignment.assignmentId || assignment.id;

  const handleSubmit = async () => {
    if (!answerText.trim()) { setError('Vui lòng nhập bài làm trước khi nộp.'); return; }
    setLoading(true); setError(''); setResult(null);
    try {
      const res = await api.post(`/assignments/${assignmentId}/submit`, { answerText });
      setResult(res.data.gradingResult);
    } catch (err) {
      setError(err.response?.data?.message || 'Nộp bài thất bại. Vui lòng thử lại.');
    } finally { setLoading(false); }
  };

  const scoreColor = (s) => s >= 8 ? 'text-emerald-400' : s >= 5 ? 'text-amber-400' : 'text-red-400';

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      {/* Header - click để expand/collapse */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between p-3 bg-indigo-500/8 hover:bg-indigo-500/15 transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-violet-600/40 flex items-center justify-center text-violet-300 text-xs font-bold shrink-0">
            {index + 1}
          </div>
          <div className="min-w-0">
            <p className="text-white font-medium text-xs truncate">{assignment.title}</p>
            <p className="text-slate-500 text-[11px]">Tối đa: {assignment.maxScore || 10} điểm</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {result && <span className={`text-xs font-bold ${scoreColor(result.aiScore)}`}>{result.aiScore}/{assignment.maxScore || 10}</span>}
          <span className="text-slate-500 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="p-3 space-y-3 bg-black/20">
          {/* Đề bài */}
          <div className="bg-white/3 rounded-lg p-3">
            <p className="text-slate-300 text-xs leading-relaxed">{assignment.description}</p>
            {assignment.rubric && (
              <p className="text-slate-500 text-[11px] mt-2 pt-2 border-t border-white/5">Tiêu chí: {assignment.rubric}</p>
            )}
          </div>

          {/* Textarea */}
          {!result && (
            <>
              <textarea
                value={answerText}
                onChange={e => { setAnswerText(e.target.value); setError(''); }}
                placeholder="Viết bài làm của bạn tại đây..."
                rows={6}
                disabled={loading}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500/50 disabled:opacity-60"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                onClick={handleSubmit}
                disabled={loading || !answerText.trim()}
                className="w-full py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-medium rounded-xl text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? <><Spinner size="sm" /> AI đang chấm bài...</> : <><Sparkles size={14} /> Nộp bài để AI chấm</>}
              </button>
            </>
          )}

          {/* Kết quả */}
          {result && (
            <div className="space-y-2">
              <div className="bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-violet-300">Điểm AI</span>
                  <button onClick={() => { setResult(null); setAnswerText(''); }} className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
                    <RotateCcw size={11} /> Làm lại
                  </button>
                </div>
                <div className={`text-4xl font-bold ${scoreColor(result.aiScore)}`}>
                  {result.aiScore}<span className="text-xl text-slate-500">/{assignment.maxScore || 10}</span>
                </div>
              </div>
              {result.aiFeedback && (
                <div className="bg-white/5 border border-white/8 rounded-xl p-3">
                  <p className="text-xs font-medium text-indigo-400 mb-1">Nhận xét</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{result.aiFeedback}</p>
                </div>
              )}
              {result.improvements && (
                <div className="bg-emerald-500/8 border border-emerald-500/20 rounded-xl p-3">
                  <p className="text-xs font-medium text-emerald-400 mb-1">Gợi ý cải thiện</p>
                  <p className="text-slate-300 text-xs leading-relaxed">{result.improvements}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
function AssignmentTab({ courseId, lessonId }) {
  const [assignments, setAssignments] = useState([]);
  const [fetchingAssignment, setFetchingAssignment] = useState(true);

  // Lấy TẤT CẢ assignments gắn với lessonId này
  useEffect(() => {
    if (!courseId || !lessonId) return;
    setFetchingAssignment(true);
    api.get(`/courses/${courseId}/assignments?lessonId=${lessonId}`)
      .then(res => {
        console.log('[DEBUG frontend] raw API response:', res.data);
        const raw = Array.isArray(res.data) ? res.data : [res.data];
        const filtered = raw.filter(a => a && a.lessonId === lessonId);
        console.log('[DEBUG frontend] filtered assignments:', filtered.length, filtered.map(a => a.title));
        setAssignments(filtered);
      })
      .catch((err) => { console.error('[DEBUG frontend] fetch error:', err); setAssignments([]); })
      .finally(() => setFetchingAssignment(false));
  }, [courseId, lessonId]);

  if (fetchingAssignment) {
    return (
      <div className="flex items-center justify-center h-32">
        <Spinner size="md" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-violet-400" />
            <h3 className="text-white font-medium text-sm">Bài tập AI ({assignments.length})</h3>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="bg-slate-500/10 border border-slate-500/20 rounded-xl p-6 text-center">
            <p className="text-slate-400 text-sm">Bài học này chưa có bài tập.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((a, i) => (
              <SingleAssignmentItem key={a.id || a.assignmentId} assignment={a} index={i} total={assignments.length} />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// Backend: GET /api/courses/:courseId/lessons
//   response → [{ lessonId, title, description, videoUrl, order, createdAt }]
//
// Backend: POST /api/courses/:courseId/lessons/:lessonId/complete
//   response → { message, progress, status, completedLessons }
// ══════════════════════════════════════════════════════════
export default function LearningWorkspace() {
  const { courseId, lessonId } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [completionResult, setCompletionResult] = useState(null);  // { progress, status }
  const [activeTab, setActiveTab] = useState('chat');
  const [showReview, setShowReview] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (!courseId || !lessonId) return;
    setLoading(true);
    setCompleted(false);
    setCompletionResult(null);

    // GET /courses/:courseId/lessons → trả mảng lesson objects
    api.get(`/courses/${courseId}/lessons`)
      .then(res => {
        // Mỗi lesson: { lessonId, title, description, videoUrl, order, createdAt }
        const lessons = Array.isArray(res.data) ? res.data : [];
        const found = lessons.find(l => l.lessonId === lessonId);
        setLesson(found ?? null);
      })
      .catch(err => console.error('Không tải được bài học:', err))
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      const res = await api.post(`/courses/${courseId}/lessons/${lessonId}/complete`);
      // response: { message, progress, status, completedLessons }
      setCompleted(true);
      setCompletionResult(res.data);
    } catch (err) {
      console.error('Lỗi đánh dấu hoàn thành:', err);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const tabs = [
    { id: 'chat',       icon: MessageSquare, label: 'AI Gia sư' },
    { id: 'assignment', icon: FileText,       label: 'Bài tập' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full min-h-[calc(100vh-100px)]">
      {/* ── LEFT: Video + Lesson info ── */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">

        {/* Video player */}
        <div className="glass rounded-2xl border border-white/8 overflow-hidden">
          {lesson?.videoUrl ? (
            <video
              src={lesson.videoUrl}
              controls
              className="w-full aspect-video bg-black"
            />
          ) : (
            <div className="w-full aspect-video bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900
                            flex flex-col items-center justify-center gap-4 relative overflow-hidden">
              <div className="absolute w-64 h-64 rounded-full bg-indigo-600/10 blur-2xl" />
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-indigo-500/30 flex items-center justify-center">
                  <Play size={28} className="text-indigo-300 ml-1" />
                </div>
              </div>
              <div className="flex items-center gap-4 text-slate-500 text-sm">
                <span className="flex items-center gap-1.5"><Volume2 size={13} /> Audio</span>
                <span className="flex items-center gap-1.5"><Maximize2 size={13} /> Toàn màn hình</span>
              </div>
              <p className="text-slate-600 text-xs">Nội dung video bài học</p>
            </div>
          )}
        </div>

        {/* Lesson info */}
        <div className="glass rounded-2xl p-6 border border-white/8">
          <div className="mb-4">
            {completed && <Badge color="emerald">✓ Đã hoàn thành</Badge>}

            {/* lesson.title, lesson.description từ backend */}
            <h1 className="text-xl font-bold text-white mt-2">
              {lesson?.title ?? 'Nội dung bài học'}
            </h1>
            <p className="text-slate-400 text-sm mt-1 leading-relaxed">
              {lesson?.description ?? 'Theo dõi nội dung video bên trên.'}
            </p>

            {/* Bài học thứ mấy */}
            {lesson?.order && (
              <p className="text-xs text-slate-500 mt-2">Bài {lesson.order}</p>
            )}
          </div>

          {/* Kết quả sau khi mark complete */}
          {completionResult && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-emerald-400 text-sm font-medium">{completionResult.message}</p>
              <div className="mt-2">
                <ProgressBar value={completionResult.progress ?? 0} color="emerald" />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              id="mark-complete-btn"
              onClick={handleMarkComplete}
              disabled={completing || completed}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                          transition-all duration-200 shadow-lg
                          ${completed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/20'
                          } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {completing ? <Spinner size="sm" /> : <CheckCircle2 size={16} />}
              {completed ? 'Đã hoàn thành!' : completing ? 'Đang lưu...' : 'Đánh dấu hoàn thành'}
            </button>

            <button
              id="rate-course-btn"
              onClick={() => setShowReview(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                         bg-amber-500/15 hover:bg-amber-500/25 text-amber-400
                         border border-amber-500/30 transition-all duration-200"
            >
              <Star size={16} />
              Đánh giá khóa học
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT: AI Tabs panel ── */}
      <div className="w-full lg:w-96 xl:w-[420px] flex-shrink-0 flex flex-col glass rounded-2xl border border-white/8 overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-white/8 flex-shrink-0">
          {tabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              id={`tab-${id}`}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium
                          transition-all duration-200 border-b-2
                          ${activeTab === id
                            ? 'text-indigo-400 border-indigo-500'
                            : 'text-slate-400 border-transparent hover:text-slate-300'
                          }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat'
            ? <ChatTab courseId={courseId} lessonId={lessonId} onOpenHistory={() => setShowHistoryModal(true)} />
            : <AssignmentTab courseId={courseId} lessonId={lessonId} />
          }
        </div>
      </div>

      {/* Review Modal */}
      {showReview && (
        <ReviewModal
          courseId={courseId}
          onClose={() => setShowReview(false)}
          onSuccess={() => {}}
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
