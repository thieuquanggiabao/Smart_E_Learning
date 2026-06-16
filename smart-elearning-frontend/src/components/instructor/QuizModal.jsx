import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Sparkles, Loader2, Save } from 'lucide-react';
import api from '../../services/api';

export default function QuizModal({ courseId, editingQuiz, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 15,
    maxAttempts: 0,
    questions: []
  });

  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingQuiz) {
      setFormData(editingQuiz);
    } else {
      // Create empty template
      setFormData({
        title: '',
        description: '',
        timeLimit: 15,
        maxAttempts: 0,
        questions: [{
          id: Date.now().toString(),
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          points: 1
        }]
      });
    }
  }, [editingQuiz]);

  const handleAddQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now().toString(),
          questionText: '',
          options: ['', '', '', ''],
          correctOptionIndex: 0,
          points: 1
        }
      ]
    }));
  };

  const handleRemoveQuestion = (idx) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions.splice(idx, 1);
      return { ...prev, questions: newQuestions };
    });
  };

  const handleQuestionChange = (idx, field, value) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[idx][field] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (qIdx, optIdx, value) => {
    setFormData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIdx].options[optIdx] = value;
      return { ...prev, questions: newQuestions };
    });
  };

  const handleGenerateAI = async () => {
    if (!window.confirm('AI sẽ tự động đọc nội dung khóa học và tạo ra bộ 5 câu hỏi trắc nghiệm mới. Bạn có muốn tiếp tục?')) return;
    setGeneratingAI(true);
    setError('');
    try {
      const res = await api.post(`/courses/${courseId}/generate-quiz`, { numQuestions: 5 });
      const aiQuestions = res.data.questions.map(q => ({
        id: Math.random().toString(36).substr(2, 9),
        ...q
      }));
      setFormData(prev => ({
        ...prev,
        questions: [...prev.questions, ...aiQuestions]
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi khi gọi AI sinh đề.');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) return setError('Vui lòng nhập tên Quiz');
    if (formData.questions.length === 0) return setError('Quiz phải có ít nhất 1 câu hỏi');
    
    // Basic validation
    for (let i = 0; i < formData.questions.length; i++) {
        const q = formData.questions[i];
        if (!q.questionText.trim()) return setError(`Câu ${i+1} không được để trống nội dung`);
        if (q.options.some(opt => !opt.trim())) return setError(`Câu ${i+1} có đáp án trống`);
    }

    setLoading(true);
    try {
      if (editingQuiz?.id) {
        await api.put(`/courses/${courseId}/quizzes/${editingQuiz.id}`, formData);
      } else {
        await api.post(`/courses/${courseId}/quizzes`, formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Lỗi lưu Quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="glass rounded-2xl w-full max-w-4xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {editingQuiz ? 'Sửa Quiz' : 'Tạo Quiz Mới'}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-4 md:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-1">Tên Quiz</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="VD: Kiểm tra cuối khóa"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1">Thời gian (phút)</label>
              <input
                type="number"
                min="1"
                value={formData.timeLimit}
                onChange={e => setFormData({...formData, timeLimit: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
            <div className="col-span-2 md:col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1" title="0: Không giới hạn">Số lần làm tối đa</label>
              <input
                type="number"
                min="0"
                value={formData.maxAttempts}
                onChange={e => setFormData({...formData, maxAttempts: e.target.value})}
                placeholder="0 = Không giới hạn"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Mô tả (Không bắt buộc)</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm resize-none"
            />
          </div>

          {/* AI Generator Button */}
          <div className="flex justify-end pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={generatingAI}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm transition-colors shadow-lg shadow-violet-500/20"
            >
              {generatingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {generatingAI ? 'AI đang đọc nội dung & soạn đề...' : '✨ Tạo 5 câu hỏi bằng AI'}
            </button>
          </div>

          {/* Questions list */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold">Danh sách Câu hỏi ({formData.questions.length})</h3>
            
            {formData.questions.map((q, qIdx) => (
              <div key={q.id} className="p-4 bg-black/40 border border-white/5 rounded-xl space-y-4 relative group">
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="absolute top-4 right-4 p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Xóa câu hỏi"
                >
                  <Trash2 size={14} />
                </button>
                
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Câu {qIdx + 1}</label>
                  <input
                    type="text"
                    value={q.questionText}
                    onChange={e => handleQuestionChange(qIdx, 'questionText', e.target.value)}
                    placeholder="Nội dung câu hỏi..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm pr-10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pl-4 border-l-2 border-white/5">
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-3">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={q.correctOptionIndex === optIdx}
                        onChange={() => handleQuestionChange(qIdx, 'correctOptionIndex', optIdx)}
                        className="w-4 h-4 text-indigo-500 focus:ring-indigo-500 bg-white/10 border-white/20"
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(qIdx, optIdx, e.target.value)}
                        placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`}
                        className={`w-full bg-white/5 border rounded-xl px-3 py-2 text-sm text-white
                          ${q.correctOptionIndex === optIdx ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-white/10'}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddQuestion}
              className="w-full py-3 border-2 border-dashed border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
            >
              <Plus size={16} /> Thêm câu hỏi thủ công
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 shrink-0 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Lưu Quiz
          </button>
        </div>

      </div>
    </div>
  );
}
