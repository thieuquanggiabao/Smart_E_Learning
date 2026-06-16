import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export default function SelfStudyModal({ studySet, onClose }) {
  const isFlashcard = studySet.type === 'flashcard';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="glass rounded-3xl w-full max-w-3xl border border-white/10 shadow-2xl flex flex-col min-h-[60vh] max-h-[90vh] bg-[#0d0d1a]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 block">
              {isFlashcard ? 'Luyện tập Flashcard' : 'Luyện tập Quiz'}
            </span>
            <h2 className="text-xl font-bold text-white">{studySet.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col overflow-y-auto">
          {isFlashcard ? (
            <FlashcardView cards={studySet.content} />
          ) : (
            <PracticeQuizView questions={studySet.content} />
          )}
        </div>

      </div>
    </div>
  );
}

// ─── FLASHCARD VIEW ───
function FlashcardView({ cards }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex(i => Math.min(cards.length - 1, i + 1));
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex(i => Math.max(0, i - 1));
  };

  const card = cards[currentIndex];
  if (!card) return <div className="text-center text-slate-400">Không có thẻ nào.</div>;

  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8">
      
      <div className="text-slate-400 text-sm font-medium">Thẻ {currentIndex + 1} / {cards.length}</div>

      <div 
        className="relative w-full max-w-xl h-80 perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`w-full h-full duration-500 preserve-3d relative ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/30 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-2xl">
            <span className="absolute top-6 left-6 text-indigo-400/50 text-sm font-bold uppercase">Mặt trước</span>
            <h3 className="text-2xl font-bold text-white leading-relaxed">{card.front}</h3>
            <p className="absolute bottom-6 text-slate-400 text-sm flex items-center gap-2">Chạm để lật</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/30 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-2xl rotate-y-180">
            <span className="absolute top-6 left-6 text-emerald-400/50 text-sm font-bold uppercase">Mặt sau</span>
            <h3 className="text-xl font-medium text-white leading-relaxed">{card.back}</h3>
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button 
          onClick={handlePrev} disabled={currentIndex === 0}
          className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors disabled:opacity-30"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={handleNext} disabled={currentIndex === cards.length - 1}
          className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors disabled:opacity-30"
        >
          <ChevronRight size={24} />
        </button>
      </div>
    </div>
  );
}

// ─── PRACTICE QUIZ VIEW ───
function PracticeQuizView({ questions }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIndex: selectedOptionIndex }

  const handleNext = () => setCurrentIndex(i => Math.min(questions.length - 1, i + 1));
  const handlePrev = () => setCurrentIndex(i => Math.max(0, i - 1));

  const q = questions[currentIndex];
  const selectedOpt = selectedAnswers[currentIndex];
  const hasAnswered = selectedOpt !== undefined;

  const handleSelect = (optIdx) => {
    if (hasAnswered) return; // Không cho chọn lại để biết đáp án ban đầu
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optIdx }));
  };

  if (!q) return <div className="text-center text-slate-400">Không có câu hỏi nào.</div>;

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
      <div className="flex justify-between items-center mb-6">
        <div className="text-slate-400 text-sm font-medium">Câu {currentIndex + 1} / {questions.length}</div>
        <div className="flex gap-2">
          {questions.map((_, i) => (
            <div key={i} className={`w-2 h-2 rounded-full ${
              i === currentIndex ? 'bg-white' : 
              selectedAnswers[i] !== undefined ? 'bg-indigo-500' : 'bg-white/20'
            }`} />
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 flex-1 flex flex-col">
        <h3 className="text-xl font-medium text-white mb-8">{q.questionText}</h3>
        
        <div className="space-y-4 mb-8 flex-1">
          {q.options.map((opt, optIdx) => {
            let stateClass = 'bg-black/40 border-white/5 text-slate-300 hover:border-white/20';
            let Icon = null;

            if (hasAnswered) {
              if (optIdx === q.correctOptionIndex) {
                stateClass = 'bg-emerald-500/20 border-emerald-500 text-emerald-400';
                Icon = CheckCircle2;
              } else if (optIdx === selectedOpt) {
                stateClass = 'bg-rose-500/20 border-rose-500 text-rose-400';
                Icon = XCircle;
              } else {
                stateClass = 'bg-black/40 border-white/5 text-slate-500 opacity-50';
              }
            } else if (selectedOpt === optIdx) {
              stateClass = 'bg-indigo-500/20 border-indigo-500 text-white';
            }

            return (
              <button
                key={optIdx}
                onClick={() => handleSelect(optIdx)}
                disabled={hasAnswered}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${stateClass}`}
              >
                <span>{opt}</span>
                {Icon && <Icon size={20} />}
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <p className="text-indigo-300 text-sm"><strong className="text-indigo-400 font-bold">Giải thích:</strong> {q.explanation || 'Không có giải thích.'}</p>
          </div>
        )}
      </div>

      <div className="flex justify-between mt-8">
        <button 
          onClick={handlePrev} disabled={currentIndex === 0}
          className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors disabled:opacity-30 font-medium"
        >
          Câu trước
        </button>
        <button 
          onClick={handleNext} disabled={currentIndex === questions.length - 1}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-30 font-medium"
        >
          Câu tiếp theo
        </button>
      </div>
    </div>
  );
}
