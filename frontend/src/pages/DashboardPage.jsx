export default function DashboardPage({ role, user, dashboard, instructorDashboard, adminDashboard, setView }) {
  if (role === 'instructor') {
    return (
      <div className="panel-grid instructor-dashboard">
        <div className="card highlight wide"><h3>Instructor Dashboard</h3><p>Manage your courses, learners, quizzes, and feedback from one workspace.</p></div>
        <div className="card"><h3>My Courses</h3><strong>{instructorDashboard?.myCourses?.length ?? 0}</strong></div>
        <div className="card"><h3>Enrollments</h3><strong>{instructorDashboard?.analytics?.enrollments ?? 0}</strong></div>
        <div className="card"><h3>Completion</h3><strong>{instructorDashboard?.analytics?.completion ?? 0}%</strong></div>
        <div className="card"><h3>Quiz Average</h3><strong>{instructorDashboard?.analytics?.avgQuizScore ?? 0}%</strong></div>
        <div className="card"><h3>Average Rating</h3><strong>{instructorDashboard?.analytics?.rating ?? 0}</strong></div>
        <div className="card wide">
          <div className="section-heading"><h3>Course performance</h3><button className="primary-btn" onClick={() => setView('course-editor')} type="button">Create course</button></div>
          <div className="course-list compact">
            {(instructorDashboard?.myCourses || []).map((course) => (
              <div key={course._id} className="mini-course instructor-course-row">
                <span><strong>{course.title}</strong><small>{course.published ? 'Published' : 'Draft'} · {course.enrolledStudents} students</small></span>
                <span>{course.completion}% complete</span>
              </div>
            ))}
            {!instructorDashboard?.myCourses?.length && <p>No courses created yet.</p>}
          </div>
        </div>
      </div>
    );
  }

  if (role === 'admin') {
    return (
      <div className="panel-grid admin-dashboard">
        <div className="card highlight wide"><h3>Admin Control Center</h3><p>Platform-level monitoring and moderation. Every action is authorization-checked and audited.</p></div>
        <div className="card"><h3>Students</h3><strong>{adminDashboard?.users?.students ?? 0}</strong></div>
        <div className="card"><h3>Instructors</h3><strong>{adminDashboard?.users?.instructors ?? 0}</strong></div>
        <div className="card"><h3>Pending tutors</h3><strong>{adminDashboard?.users?.pending ?? 0}</strong></div>
        <div className="card"><h3>Published courses</h3><strong>{adminDashboard?.courses?.published ?? 0}</strong></div>
        <div className="card"><h3>Enrollments</h3><strong>{adminDashboard?.learning?.enrollments ?? 0}</strong></div>
        <div className="card"><h3>Completed</h3><strong>{adminDashboard?.learning?.completedCourses ?? 0}</strong></div>
        <div className="card"><h3>Quiz average</h3><strong>{adminDashboard?.quizzes?.averageScore ?? 0}%</strong></div>
        <div className="card"><h3>Average rating</h3><strong>{adminDashboard?.reviews?.averageRating ?? 0}</strong></div>
      </div>
    );
  }

  return (
    <div className="panel-grid">
      <div className="card highlight"><h3>Welcome back</h3><p>{user?.name}</p><small>{user?.role}</small></div>
      <div className="card"><h3>Enrolled Courses</h3><strong>{dashboard?.enrolledCourses ?? 0}</strong></div>
      <div className="card"><h3>Average Score</h3><strong>{dashboard?.averageScore ?? 0}%</strong></div>
      <div className="card"><h3>Best Subject</h3><strong>{dashboard?.bestSubject ?? 'N/A'}</strong></div>
      <div className="card wide">
        <h3>My Learning</h3>
        <div className="course-list compact">
          {(dashboard?.myCourses || []).length ? dashboard.myCourses.map((course) => (
            <div key={course.courseId || course._id} className="mini-course"><span>{course.title || course.course}</span><strong>{course.progress || 0}%</strong></div>
          )) : <p>No courses enrolled yet.</p>}
        </div>
      </div>
    </div>
  );
}
