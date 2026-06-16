import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import api from '../services/api';

export function useInstructorCourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('content');

  // Modal visibility
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);

  // Lesson form
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', videoUrl: '', order: '' });
  const [lessonSaving, setLessonSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState(null);

  // Assignment form
  const [selectedLessonId, setSelectedLessonId] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', rubric: '', maxScore: 10 });
  const [assignmentSaving, setAssignmentSaving] = useState(false);
  const [editingAssignmentId, setEditingAssignmentId] = useState(null);
  const [generatingTranscript, setGeneratingTranscript] = useState(false);

  // Submission review
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewForm, setReviewForm] = useState({ instructorScore: '', instructorFeedback: '' });
  const [reviewSaving, setReviewSaving] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);
    try {
      const [courseRes, lessonsRes, assignmentsRes, submissionsRes, quizzesRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/lessons`),
        api.get(`/courses/${courseId}/assignments`),
        api.get(`/courses/${courseId}/submissions`),
        api.get(`/courses/${courseId}/quizzes`),
      ]);
      setCourse(courseRes.data);
      setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
      setAssignments(Array.isArray(assignmentsRes.data) ? assignmentsRes.data : []);
      setSubmissions(Array.isArray(submissionsRes.data) ? submissionsRes.data : []);
      setQuizzes(Array.isArray(quizzesRes.data) ? quizzesRes.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Lesson Handlers ───────────────────────────────────────────────────────

  const openCreateLesson = () => {
    setEditingLessonId(null);
    setLessonForm({ title: '', description: '', videoUrl: '', order: '' });
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson) => {
    setEditingLessonId(lesson.lessonId);
    setLessonForm({
      title: lesson.title,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl || '',
      order: lesson.order,
    });
    setShowLessonModal(true);
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    try {
      const res = await api.post('/upload/generate-url', { fileName: file.name, contentType: file.type });
      const { uploadUrl, publicFileUrl } = res.data;
      await axios.put(uploadUrl, file, { headers: { 'Content-Type': file.type } });
      setLessonForm(prev => ({ ...prev, videoUrl: publicFileUrl }));
    } catch (err) {
      alert('Lỗi khi tải video lên. Vui lòng thử lại.');
      console.error(err);
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    setLessonSaving(true);
    try {
      const payload = { ...lessonForm, order: parseInt(lessonForm.order) || lessons.length + 1 };
      if (editingLessonId) {
        await api.put(`/courses/${courseId}/lessons/${editingLessonId}`, payload);
      } else {
        await api.post(`/courses/${courseId}/lessons`, payload);
      }
      setShowLessonModal(false);
      setEditingLessonId(null);
      setLessonForm({ title: '', description: '', videoUrl: '', order: '' });
      loadCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu bài giảng');
    } finally {
      setLessonSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Bạn có chắc muốn xóa bài giảng này không?')) return;
    try {
      await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
      loadCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa bài giảng');
    }
  };

  // ─── Assignment Handlers ────────────────────────────────────────────────────

  const openCreateAssignment = (lessonId) => {
    setSelectedLessonId(lessonId);
    setEditingAssignmentId(null);
    setAssignmentForm({ title: '', description: '', rubric: '', maxScore: 10 });
    setShowAssignmentModal(true);
  };

  const openEditAssignment = (assignment, lessonId) => {
    setSelectedLessonId(lessonId);
    setEditingAssignmentId(assignment.assignmentId);
    setAssignmentForm({
      title: assignment.title,
      description: assignment.description || '',
      rubric: assignment.rubric || '',
      maxScore: assignment.maxScore || 10,
    });
    setShowAssignmentModal(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setAssignmentSaving(true);
    try {
      const payload = { ...assignmentForm, lessonId: selectedLessonId, maxScore: parseInt(assignmentForm.maxScore) || 10 };
      if (editingAssignmentId) {
        await api.put(`/assignments/${editingAssignmentId}`, payload);
        alert('Cập nhật bài tập thành công!');
      } else {
        await api.post(`/courses/${courseId}/assignments`, payload);
        alert('Đã tạo bài tập AI thành công!');
      }
      setShowAssignmentModal(false);
      setEditingAssignmentId(null);
      setAssignmentForm({ title: '', description: '', rubric: '', maxScore: 10 });
      loadCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu bài tập');
    } finally {
      setAssignmentSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Bạn có chắc muốn xóa bài tập tự luận này?')) return;
    try {
      await api.delete(`/assignments/${assignmentId}`);
      loadCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi xóa bài tập');
    }
  };

  const handleGenerateTranscript = async (lessonId) => {
    if (!confirm('Tạo transcript bằng AI sẽ phân tích video. Bạn có chắc chắn?')) return;
    setGeneratingTranscript(lessonId);
    try {
      await api.post(`/courses/${courseId}/lessons/${lessonId}/generate-transcript`);
      alert('Tạo transcript thành công!');
      loadCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi tạo transcript');
    } finally {
      setGeneratingTranscript(false);
    }
  };

  // ─── Submission Handlers ────────────────────────────────────────────────────

  const openSubmissionDetail = (submission) => {
    setSelectedSubmission(submission);
    setReviewForm({
      instructorScore: submission.instructorScore !== undefined ? submission.instructorScore : submission.aiScore,
      instructorFeedback: submission.instructorFeedback || '',
    });
    setShowSubmissionModal(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    setReviewSaving(true);
    try {
      await api.put(`/submissions/${selectedSubmission.submissionId}/override`, reviewForm);
      alert('Đã lưu đánh giá thành công!');
      setShowSubmissionModal(false);
      setSelectedSubmission(null);
      loadCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi lưu đánh giá');
    } finally {
      setReviewSaving(false);
    }
  };

  // ─── Quiz Handlers ────────────────────────────────────────────────────────
  const openQuizModal = (quiz = null) => {
    setEditingQuiz(quiz);
    setShowQuizModal(true);
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Bạn có chắc muốn xóa bài Quiz này không?')) return;
    try {
      await api.delete(`/courses/${courseId}/quizzes/${quizId}`);
      loadCourseData();
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa Quiz');
    }
  };

  return {
    // Data
    courseId, course, lessons, assignments, submissions, quizzes, loading, activeTab,
    // Tab
    setActiveTab,
    // Lesson modal
    showLessonModal, setShowLessonModal,
    lessonForm, setLessonForm,
    lessonSaving, uploadingVideo, editingLessonId,
    openCreateLesson, openEditLesson, handleVideoUpload, handleSaveLesson, handleDeleteLesson,
    // Assignment modal
    showAssignmentModal, setShowAssignmentModal,
    assignmentForm, setAssignmentForm,
    assignmentSaving, editingAssignmentId, generatingTranscript,
    openCreateAssignment, openEditAssignment, handleSaveAssignment, handleDeleteAssignment, handleGenerateTranscript,
    // Submission modal
    showSubmissionModal, setShowSubmissionModal,
    selectedSubmission,
    reviewForm, setReviewForm,
    reviewSaving,
    openSubmissionDetail, handleSaveReview,
    // Quiz modal
    showQuizModal, setShowQuizModal,
    editingQuiz, openQuizModal, handleDeleteQuiz, loadCourseData,
    // Navigation
    navigate,
  };
}
