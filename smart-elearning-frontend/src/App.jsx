import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// Layout
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import StudentDashboard   from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import InstructorCourses from './pages/InstructorCourses';
import InstructorCreateCourse from './pages/InstructorCreateCourse';
import InstructorCourseDetail from './pages/InstructorCourseDetail';
import LearningWorkspace  from './pages/LearningWorkspace';
import BrowseCourses      from './pages/BrowseCourses';
import CourseDetailPage   from './pages/CourseDetailPage';
import LessonViewPage     from './pages/LessonViewPage';
import MyLearningPage     from './pages/MyLearningPage';
import CertificatesPage   from './pages/CertificatesPage';
import SettingsPage       from './pages/SettingsPage';
import GroupsListPage     from './pages/GroupsListPage';
import GroupDetailPage    from './pages/GroupDetailPage';
import LiveRoomPage       from './pages/LiveRoomPage';

function RootRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'teacher' || user?.role === 'admin') {
    return <Navigate to="/instructor/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/dashboard"            element={<ProtectedRoute><Layout><StudentDashboard /></Layout></ProtectedRoute>} />
          <Route path="/instructor/dashboard" element={<ProtectedRoute><Layout><InstructorDashboard /></Layout></ProtectedRoute>} />
          <Route path="/instructor/courses"   element={<ProtectedRoute><Layout><InstructorCourses /></Layout></ProtectedRoute>} />
          <Route path="/instructor/courses/new" element={<ProtectedRoute><Layout><InstructorCreateCourse /></Layout></ProtectedRoute>} />
          <Route path="/instructor/courses/:courseId" element={<ProtectedRoute><Layout><InstructorCourseDetail /></Layout></ProtectedRoute>} />

          {/* Group routes for both */}
          <Route path="/groups" element={<ProtectedRoute><Layout><GroupsListPage /></Layout></ProtectedRoute>} />
          <Route path="/groups/:groupId" element={<ProtectedRoute><Layout><GroupDetailPage /></Layout></ProtectedRoute>} />

          {/* Live Room — Toàn màn hình, không có Layout sidebar */}
          <Route path="/live/:groupId" element={<ProtectedRoute><LiveRoomPage /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/courses"                         element={<ProtectedRoute><Layout><BrowseCourses /></Layout></ProtectedRoute>} />
          <Route path="/courses/:courseId"               element={<ProtectedRoute><Layout><CourseDetailPage /></Layout></ProtectedRoute>} />

          {/* Lesson View — xem video + sidebar bài học */}
          <Route path="/courses/:courseId/lessons"              element={<ProtectedRoute><Layout><LessonViewPage /></Layout></ProtectedRoute>} />
          <Route path="/courses/:courseId/lessons/:lessonId"    element={<ProtectedRoute><Layout><LessonViewPage /></Layout></ProtectedRoute>} />

          {/* Legacy learning workspace route */}
          <Route path="/learn/:courseId/lesson/:lessonId" element={<ProtectedRoute><Layout><LessonViewPage /></Layout></ProtectedRoute>} />

          {/* Other */}
          <Route path="/my-learning"  element={<ProtectedRoute><Layout><MyLearningPage /></Layout></ProtectedRoute>} />
          <Route path="/certificates" element={<ProtectedRoute><Layout><CertificatesPage /></Layout></ProtectedRoute>} />
          <Route path="/settings"     element={<ProtectedRoute><Layout><SettingsPage /></Layout></ProtectedRoute>} />

          <Route path="/"  element={<RootRedirect />} />
          <Route path="*"  element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
