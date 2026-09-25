import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../api/client.js';
import { useCourseFilters } from './useCourseFilters.js';

export const emptyCourseForm = {
  title: '',
  description: '',
  category: 'Web Development',
  level: 'Beginner',
  price: 0,
  sections: [{ title: 'Section 1', lessons: [{ title: 'Lesson 1', content: '' }] }],
};

export function useLms({ token, user, onMessage }) {
  const { filters: courseFilters, setFilters: setCourseFilters } = useCourseFilters();
  const [dashboard, setDashboard] = useState(null);
  const [instructorDashboard, setInstructorDashboard] = useState(null);
  const [adminDashboard, setAdminDashboard] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [adminCourses, setAdminCourses] = useState([]);
  const [adminReviews, setAdminReviews] = useState([]);
  const [adminCategories, setAdminCategories] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [coursePagination, setCoursePagination] = useState({ page: 1, pages: 1, total: 0 });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [editingCourseId, setEditingCourseId] = useState(null);

  const request = useCallback((options) => apiRequest({ ...options, token }), [token]);

  const loadCourses = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ ...courseFilters, limit: '6' });
      const response = await request({ endpoint: `/courses?${params.toString()}` });
      setCourses(response.data || []);
      setCoursePagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) { onMessage(error.message); }
  }, [courseFilters, onMessage, request, token]);

  const loadAdminData = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const [dashboardResponse, usersResponse, instructorsResponse, coursesResponse, logsResponse, reviewsResponse, categoriesResponse] = await Promise.all([
        request({ endpoint: '/admin/dashboard' }), request({ endpoint: '/admin/users' }), request({ endpoint: '/admin/instructors/pending' }), request({ endpoint: '/admin/courses' }), request({ endpoint: '/admin/audit-logs' }), request({ endpoint: '/admin/reviews' }), request({ endpoint: '/admin/categories' }),
      ]);
      setAdminDashboard(dashboardResponse.dashboard); setAdminUsers(usersResponse.data || []); setPendingInstructors(instructorsResponse.data || []); setAdminCourses(coursesResponse.data || []); setAuditLogs(logsResponse.data || []); setAdminReviews(reviewsResponse.data || []); setAdminCategories(categoriesResponse.data || []);
    } catch (error) { onMessage(error.message); }
  }, [onMessage, request, user?.role]);

  const refresh = useCallback(async () => {
    if (!token) return;
    try {
      const dashboardResponse = await request({ endpoint: '/users/dashboard' });
      setDashboard(dashboardResponse.dashboard);
      if (user?.role === 'instructor') setInstructorDashboard(dashboardResponse.dashboard);
      if (user?.role === 'admin') await loadAdminData();
      if (user?.role === 'student') {
        const attempts = await request({ endpoint: '/quizzes/attempts' });
        setQuizAttempts(attempts.data || []);
      }
      await loadCourses();
    } catch (error) { onMessage(error.message); }
  }, [loadAdminData, loadCourses, onMessage, request, token, user]);

  useEffect(() => { refresh(); }, [refresh]);

  const selectCourse = async (courseId) => {
    try { const response = await request({ endpoint: `/courses/${courseId}` }); setSelectedCourse(response.course); return response.course; } catch (error) { onMessage(error.message); return null; }
  };

  const enrollCourse = async (courseId) => {
    try { const response = await request({ endpoint: `/courses/${courseId}/enroll`, method: 'POST' }); onMessage(response.message); await refresh(); return selectCourse(courseId); } catch (error) { onMessage(error.message); return null; }
  };

  const markLessonComplete = async (lessonId) => {
    if (!selectedCourse) return;
    try { const response = await request({ endpoint: `/progress/lesson/${lessonId}/complete`, method: 'POST', body: { courseId: selectedCourse._id } }); onMessage(response.message); await refresh(); await selectCourse(selectedCourse._id); } catch (error) { onMessage(error.message); }
  };

  const generateQuiz = async () => {
    if (!selectedCourse) return;
    try { const response = await request({ endpoint: '/quizzes/generate', method: 'POST', body: { subject: selectedCourse.title, difficulty: 'medium', amount: 3, courseId: selectedCourse._id } }); setQuiz(response); setQuizAnswers({}); setQuizResult(null); onMessage('Quiz created successfully'); } catch (error) { onMessage(error.message); }
  };

  const submitQuiz = async () => {
    if (!quiz) return;
    try { const response = await request({ endpoint: `/quizzes/${quiz.quizId}/submit`, method: 'POST', body: { answers: quizAnswers } }); setQuizResult(response); onMessage('Quiz submitted'); await refresh(); } catch (error) { onMessage(error.message); }
  };

  const saveCourse = async (event) => {
    event.preventDefault();
    try { const response = await request({ endpoint: editingCourseId ? `/courses/${editingCourseId}` : '/courses', method: editingCourseId ? 'PATCH' : 'POST', body: { ...courseForm, price: Number(courseForm.price) } }); onMessage(response.message); setCourseForm(emptyCourseForm); setEditingCourseId(null); await refresh(); } catch (error) { onMessage(error.message); }
  };

  const adminAction = async (endpoint, method = 'PATCH', body = null) => {
    try { const response = await request({ endpoint, method, body }); onMessage(response.message || 'Admin action completed'); await loadAdminData(); } catch (error) { onMessage(error.message); }
  };

  return {
    dashboard, instructorDashboard, adminDashboard, adminUsers, pendingInstructors, adminCourses, adminReviews, adminCategories, auditLogs,
    courses, coursePagination, courseFilters, setCourseFilters, selectedCourse, setSelectedCourse, quizAttempts, quiz, quizAnswers, setQuizAnswers, quizResult, certificate, setCertificate,
    courseForm, setCourseForm, editingCourseId, setEditingCourseId, refresh, loadAdminData, selectCourse, enrollCourse, markLessonComplete, generateQuiz, submitQuiz, saveCourse, adminAction,
  };
}
