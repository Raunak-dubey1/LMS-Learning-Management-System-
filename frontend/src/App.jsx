import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import { apiRequest } from './api/client.js';
import AuthPage from './components/AuthPage.jsx';
import AppLayout from './components/AppLayout.jsx';
import { useAuth } from './hooks/useAuth.js';
import { emptyCourseForm, useLms } from './hooks/useLms.js';
import AdminPage from './pages/AdminPage.jsx';
import CourseCatalogPage from './pages/CourseCatalogPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import { CourseEditorPage, InstructorAnalyticsPage, InstructorCoursesPage, InstructorStudentsPage } from './pages/ManagementPages.jsx';
import { LearningPage, ProfilePage, QuizHistoryPage } from './pages/StudentPages.jsx';

function ProtectedRoute({ token }) {
  return token ? <Outlet /> : <Navigate to="/" replace />;
}

function CourseRoute({ lms }) {
  const { id } = useParams();
  useEffect(() => { lms.selectCourse(id); }, [id]);
  const [review, setReview] = useState({ rating: 5, comment: '' });
  const onReview = async () => {
    try { const response = await apiRequest({ endpoint: '/reviews', method: 'POST', token: lms.token, body: { courseId: lms.selectedCourse._id, rating: Number(review.rating), comment: review.comment } }); lms.onMessage?.(response.message); } catch (error) { lms.onMessage?.(error.message); }
  };
  return <CourseDetailPage course={lms.selectedCourse} onEnroll={lms.enrollCourse} onComplete={lms.markLessonComplete} onStartQuiz={lms.generateQuiz} quiz={lms.quiz} answers={lms.quizAnswers} setAnswers={lms.setQuizAnswers} quizResult={lms.quizResult} onSubmitQuiz={lms.submitQuiz} onReview={onReview} review={review} setReview={setReview} onCertificate={async () => { try { const response = await apiRequest({ endpoint: '/certificates/generate', method: 'POST', token: lms.token, body: { courseId: lms.selectedCourse._id } }); lms.setCertificate(response.certificate); } catch (error) { lms.onMessage?.(error.message); } }} certificate={lms.certificate} />;
}

function LmsRoutes({ lms, user, setMessage, message, profile, setProfile, onLogout }) {
  const navigate = useNavigate();
  const [newCategory, setNewCategory] = useState('');
  const updateProfile = async (event) => { event.preventDefault(); try { const response = await apiRequest({ endpoint: '/users/me', method: 'PATCH', token: lms.token, body: { name: profile.name, email: profile.email } }); setMessage(response.message); } catch (error) { setMessage(error.message); } };
  const changePassword = async (event) => { event.preventDefault(); try { const response = await apiRequest({ endpoint: '/users/password', method: 'PATCH', token: lms.token, body: { currentPassword: profile.currentPassword, newPassword: profile.newPassword } }); setMessage(response.message); setProfile({ ...profile, currentPassword: '', newPassword: '' }); } catch (error) { setMessage(error.message); } };
  const editCourse = (course) => { lms.setEditingCourseId(course._id); lms.setCourseForm({ title: course.title, description: course.description, category: course.category, level: course.level, price: course.price, sections: course.sections?.length ? course.sections : emptyCourseForm.sections }); navigate('/instructor/courses/edit'); };
  const resetEditor = () => { lms.setEditingCourseId(null); lms.setCourseForm(emptyCourseForm); navigate('/instructor/courses/new'); };
  const toggleCourse = async (course) => { try { const response = await apiRequest({ endpoint: `/courses/${course._id}/publish`, method: 'PATCH', token: lms.token, body: { published: !course.published } }); setMessage(response.message); await lms.refresh(); } catch (error) { setMessage(error.message); } };
  const addSection = () => lms.setCourseForm({ ...lms.courseForm, sections: [...lms.courseForm.sections, { title: `Section ${lms.courseForm.sections.length + 1}`, lessons: [] }] });
  const addLesson = (sectionIndex) => lms.setCourseForm({ ...lms.courseForm, sections: lms.courseForm.sections.map((section, index) => index === sectionIndex ? { ...section, lessons: [...section.lessons, { title: `Lesson ${section.lessons.length + 1}`, content: '' }] } : section) });
  const goToView = (view) => {
    const routes = { dashboard: '/dashboard', courses: '/courses', learning: '/learning', course: '/courses', profile: '/profile', 'quiz-history': '/quiz-history', 'course-editor': '/instructor/courses/new', 'instructor-courses': '/instructor/courses', 'instructor-students': '/instructor/students', 'instructor-reviews': '/instructor/analytics' };
    navigate(routes[view] || '/dashboard');
  };

  return <Routes>
    <Route element={<AppLayout user={user} resetCourseEditor={resetEditor} onLogout={onLogout} message={message} />}>
      <Route path="/dashboard" element={<DashboardPage role={user.role} user={user} dashboard={lms.dashboard} instructorDashboard={lms.instructorDashboard} adminDashboard={lms.adminDashboard} setView={goToView} />} />
      <Route path="/courses" element={<CourseCatalogPage courses={lms.courses} filters={lms.courseFilters} pagination={lms.coursePagination} setFilters={lms.setCourseFilters} onSelectCourse={(id) => navigate(`/course/${id}`)} onEnrollCourse={lms.enrollCourse} />} />
      <Route path="/course/:id" element={<CourseRoute lms={lms} />} />
      <Route path="/learning" element={<LearningPage dashboard={lms.dashboard} onSelect={(id) => navigate(`/course/${id}`)} />} />
      <Route path="/quiz-history" element={<QuizHistoryPage attempts={lms.quizAttempts} />} />
      <Route path="/profile" element={<ProfilePage user={user} profile={profile} setProfile={setProfile} onUpdate={updateProfile} onPassword={changePassword} />} />
      <Route path="/instructor/courses" element={<InstructorCoursesPage dashboard={lms.instructorDashboard} onEdit={editCourse} onToggle={toggleCourse} />} />
      <Route path="/instructor/courses/new" element={<CourseEditorPage form={lms.courseForm} setForm={lms.setCourseForm} onSave={lms.saveCourse} editing={false} onAddSection={addSection} onAddLesson={addLesson} />} />
      <Route path="/instructor/courses/edit" element={<CourseEditorPage form={lms.courseForm} setForm={lms.setCourseForm} onSave={lms.saveCourse} editing onAddSection={addSection} onAddLesson={addLesson} />} />
      <Route path="/instructor/students" element={<InstructorStudentsPage students={lms.instructorDashboard?.students} />} />
      <Route path="/instructor/analytics" element={<InstructorAnalyticsPage dashboard={lms.instructorDashboard} />} />
      <Route path="/course" element={<Navigate to="/courses" replace />} />
      {['users', 'instructors', 'courses', 'reviews', 'categories', 'audit'].map((section) => <Route key={section} path={`/admin/${section}`} element={<AdminPage section={section} users={lms.adminUsers} instructors={lms.pendingInstructors} courses={lms.adminCourses} reviews={lms.adminReviews} categories={lms.adminCategories} logs={lms.auditLogs} action={lms.adminAction} newCategory={newCategory} setNewCategory={setNewCategory} />} />)}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Route>
  </Routes>;
}

function App() {
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({ name: '', email: '', currentPassword: '', newPassword: '' });
  const auth = useAuth({ onMessage: setMessage });
  const lms = useLms({ token: auth.token, user: auth.user, onMessage: setMessage });

  useEffect(() => { if (auth.user) setProfile((previous) => ({ ...previous, name: auth.user.name, email: auth.user.email })); }, [auth.user]);

  if (auth.token && (auth.isLoading || !auth.user)) return <div className="auth-page"><div className="auth-card"><div className="auth-header"><span className="badge">LMS</span><h1>Loading your workspace</h1><p>Checking your account session...</p></div></div></div>;

  if (!auth.token) {
    return <Routes>
      <Route path="/" element={<AuthPage authMode={auth.authMode} authForm={auth.authForm} message={message} onModeChange={auth.setAuthMode} onChange={auth.handleAuthChange} onSubmit={auth.authenticate} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>;
  }

  return <Routes>
    <Route element={<ProtectedRoute token={auth.token} />}>
      <Route path="/*" element={<LmsRoutes lms={{ ...lms, token: auth.token, onMessage: setMessage }} user={auth.user} setMessage={setMessage} message={message} profile={profile} setProfile={setProfile} onLogout={auth.logout} />} />
    </Route>
  </Routes>;
}

export default App;
