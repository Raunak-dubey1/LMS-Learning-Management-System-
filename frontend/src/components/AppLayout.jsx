import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';

export default function AppLayout({ user, resetCourseEditor, onLogout, message }) {
  const navigate = useNavigate();
  const location = useLocation();
  const view = location.pathname.split('/').filter(Boolean).join('-') || 'dashboard';
  const go = (nextView) => {
    const routes = { dashboard: '/dashboard', courses: '/courses', learning: '/learning', course: '/course', profile: '/profile', 'quiz-history': '/quiz-history', 'instructor-courses': '/instructor/courses', 'course-editor': '/instructor/courses/new', 'instructor-students': '/instructor/students', 'instructor-reviews': '/instructor/analytics', 'admin-users': '/admin/users', 'admin-instructors': '/admin/instructors', 'admin-courses': '/admin/courses', 'admin-reviews': '/admin/reviews', 'admin-categories': '/admin/categories', 'admin-audit': '/admin/audit' };
    navigate(routes[nextView] || '/dashboard');
  };

  return (
    <div className="app-shell">
      <header className="topbar"><div><span className="badge">LMS</span><h2>Learning Management System</h2></div><div className="topbar-actions"><span>{user?.name || 'User'}</span><button className="secondary-btn" onClick={onLogout} type="button">Logout</button></div></header>
      <main className="layout"><Sidebar userRole={user?.role} view={view} setView={go} resetCourseEditor={resetCourseEditor} /><section className="main-panel">{message && <div className="flash-message">{message}</div>}<Outlet /></section></main>
    </div>
  );
}
