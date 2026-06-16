import { Video, Bot, FileText, Trash2, Play } from 'lucide-react';
import { Spinner } from '../ui';

export function CourseContentTab({
  lessons,
  assignments,
  onEditLesson,
  onDeleteLesson,
  onGenerateTranscript,
  generatingTranscript,
  onCreateAssignment,
  onEditAssignment,
  onDeleteAssignment,
}) {
  return (
    <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
      <div className="p-5 border-b border-white/10 bg-white/5">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          Danh sách bài giảng ({lessons.length})
        </h2>
      </div>

      <div className="divide-y divide-white/5">
        {lessons.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Video size={36} className="mx-auto mb-3 opacity-40" />
            <p>Chưa có bài giảng nào. Hãy thêm bài giảng đầu tiên!</p>
          </div>
        ) : (
          lessons.map((lesson, idx) => {
            const lessonAssignments = assignments.filter(a => a.lessonId === lesson.lessonId);
            return (
              <div key={lesson.lessonId} className="p-5 hover:bg-white/[0.03] transition-colors flex flex-col gap-3">
                {/* Lesson Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-indigo-300">{lesson.order ?? idx + 1}</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium text-sm">{lesson.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        {lesson.videoUrl && <span className="flex items-center gap-1"><Play size={10} /> Có Video</span>}
                        {lesson.description && <span className="truncate max-w-xs">{lesson.description}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => onGenerateTranscript(lesson.lessonId)}
                      disabled={generatingTranscript === lesson.lessonId}
                      title="Tạo transcript bằng AI"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg transition-colors border border-white/10 disabled:opacity-50"
                    >
                      {generatingTranscript === lesson.lessonId ? <Spinner size="sm" /> : <Bot size={13} />}
                    </button>
                    <button
                      onClick={() => onCreateAssignment(lesson.lessonId)}
                      title="Thêm bài tập tự luận"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/15 hover:bg-violet-500/25 text-violet-400 text-xs rounded-lg transition-colors border border-violet-500/30"
                    >
                      <FileText size={13} />
                    </button>
                    <button
                      onClick={() => onEditLesson(lesson)}
                      title="Sửa bài giảng"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs rounded-lg transition-colors border border-blue-500/30"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => onDeleteLesson(lesson.lessonId)}
                      title="Xóa bài giảng"
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/15 hover:bg-red-500/25 text-red-400 text-xs rounded-lg transition-colors border border-red-500/30"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Assignments under this lesson */}
                {lessonAssignments.length > 0 && (
                  <div className="ml-14 mt-1 space-y-2">
                    {lessonAssignments.map(assignment => (
                      <div key={assignment.assignmentId} className="flex items-center justify-between p-3 rounded-lg bg-violet-500/5 border border-violet-500/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <Bot size={14} className="text-violet-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-violet-100">{assignment.title}</p>
                            <p className="text-xs text-slate-500">Tối đa: {assignment.maxScore} điểm</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onEditAssignment(assignment, lesson.lessonId)}
                            className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => onDeleteAssignment(assignment.assignmentId)}
                            className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
