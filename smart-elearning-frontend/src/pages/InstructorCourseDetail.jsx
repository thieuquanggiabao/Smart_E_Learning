import { ChevronLeft, Plus, BookOpen } from 'lucide-react';
import { Spinner, Badge } from '../components/ui';
import { useInstructorCourseDetail } from '../hooks/useInstructorCourseDetail';
import { CourseContentTab } from '../components/instructor/CourseContentTab';
import { SubmissionsTab } from '../components/instructor/SubmissionsTab';
import { LessonModal } from '../components/instructor/LessonModal';
import { AssignmentModal } from '../components/instructor/AssignmentModal';
import { SubmissionModal } from '../components/instructor/SubmissionModal';
import QuizManagementTab from '../components/instructor/QuizManagementTab';
import QuizModal from '../components/instructor/QuizModal';
import ErrorBoundary from '../components/ErrorBoundary';

export default function InstructorCourseDetail() {
  const {
    // data
    courseId, course, lessons, assignments, submissions, quizzes, loading, activeTab,
    // tab
    setActiveTab,
    // lesson
    showLessonModal, setShowLessonModal,
    lessonForm, setLessonForm, lessonSaving, uploadingVideo, editingLessonId,
    openCreateLesson, openEditLesson, handleVideoUpload, handleSaveLesson, handleDeleteLesson,
    // assignment
    showAssignmentModal, setShowAssignmentModal,
    assignmentForm, setAssignmentForm, assignmentSaving, editingAssignmentId, generatingTranscript,
    openCreateAssignment, openEditAssignment, handleSaveAssignment, handleDeleteAssignment, handleGenerateTranscript,
    // submission
    showSubmissionModal, setShowSubmissionModal,
    selectedSubmission, reviewForm, setReviewForm, reviewSaving,
    openSubmissionDetail, handleSaveReview,
    // quiz
    showQuizModal, setShowQuizModal,
    editingQuiz, openQuizModal, handleDeleteQuiz, loadCourseData,
    // nav
    navigate,
  } = useInstructorCourseDetail();

  // ─── Loading / Not found ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-20 text-slate-400">Không tìm thấy khóa học.</div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">

      {/* Back button */}
      <button
        onClick={() => navigate('/instructor/dashboard')}
        className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
      >
        <ChevronLeft size={16} />
        Quay lại Dashboard
      </button>

      {/* Course Header */}
      <div className="glass rounded-2xl border border-white/8 p-6 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover" />
            ) : (
              <BookOpen size={28} className="text-indigo-400" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge color="indigo">{course.category || 'Khóa học'}</Badge>
              <Badge color="slate">
                {course.level === 'beginner' ? 'Cơ bản' : course.level === 'intermediate' ? 'Trung cấp' : 'Nâng cao'}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold text-white mb-1 truncate">{course.title}</h1>
            <p className="text-slate-400 text-sm line-clamp-2">{course.description}</p>
          </div>
        </div>

        <button
          onClick={openCreateLesson}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all border border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.25)] shrink-0 self-start"
        >
          <Plus size={18} />
          <span>Thêm bài giảng</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-white/10 overflow-x-auto hide-scrollbar">
        <button
          onClick={() => setActiveTab('content')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'content'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Nội dung khóa học
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Trắc nghiệm (Quiz)
          {quizzes?.length > 0 && (
            <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{quizzes.length}</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'submissions'
              ? 'text-indigo-400 border-indigo-500'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Bài làm học viên
          {submissions?.length > 0 && (
            <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{submissions.length}</span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'content' && (
        <CourseContentTab
          lessons={lessons}
          assignments={assignments}
          onEditLesson={openEditLesson}
          onDeleteLesson={handleDeleteLesson}
          onGenerateTranscript={handleGenerateTranscript}
          generatingTranscript={generatingTranscript}
          onCreateAssignment={openCreateAssignment}
          onEditAssignment={openEditAssignment}
          onDeleteAssignment={handleDeleteAssignment}
        />
      )}

      {activeTab === 'quizzes' && (
        <QuizManagementTab
          quizzes={quizzes}
          onOpenQuizModal={openQuizModal}
          onDeleteQuiz={handleDeleteQuiz}
        />
      )}

      {activeTab === 'submissions' && (
        <SubmissionsTab
          submissions={submissions}
          onOpenDetail={openSubmissionDetail}
        />
      )}

      {/* Modals */}
      <LessonModal
        show={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSubmit={handleSaveLesson}
        form={lessonForm}
        setForm={setLessonForm}
        saving={lessonSaving}
        uploading={uploadingVideo}
        onVideoUpload={handleVideoUpload}
        editingId={editingLessonId}
        lessonCount={lessons.length}
      />

      <AssignmentModal
        show={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onSubmit={handleSaveAssignment}
        form={assignmentForm}
        setForm={setAssignmentForm}
        saving={assignmentSaving}
        editingId={editingAssignmentId}
      />

      <SubmissionModal
        show={showSubmissionModal}
        onClose={() => setShowSubmissionModal(false)}
        submission={selectedSubmission}
        reviewForm={reviewForm}
        setReviewForm={setReviewForm}
        onSubmit={handleSaveReview}
        saving={reviewSaving}
      />

      {showQuizModal && (
        <ErrorBoundary>
          <QuizModal
            courseId={courseId}
            editingQuiz={editingQuiz}
            onClose={() => setShowQuizModal(false)}
            onSuccess={() => {
              setShowQuizModal(false);
              loadCourseData();
            }}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}