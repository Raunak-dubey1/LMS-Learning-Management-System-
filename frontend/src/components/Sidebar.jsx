export default function Sidebar({
  userRole,
  view,
  setView,
  resetCourseEditor,
}) {
  const navigate = (nextView) => setView(nextView);

  return (
    <aside className="sidebar">
      <button
        className={view === "dashboard" ? "nav active" : "nav"}
        onClick={() => navigate("dashboard")}
      >
        Dashboard
      </button>

      {userRole === "instructor" && (
        <>
          <button
            className={view === "instructor-courses" ? "nav active" : "nav"}
            onClick={() => navigate("instructor-courses")}
          >
            Course Management
          </button>
          <button
            className={view === "course-editor" ? "nav active" : "nav"}
            onClick={() => {
              resetCourseEditor();
              navigate("course-editor");
            }}
          >
            Create Course
          </button>
          <button
            className={view === "instructor-students" ? "nav active" : "nav"}
            onClick={() => navigate("instructor-students")}
          >
            Student Management
          </button>
          <button
            className={view === "instructor-reviews" ? "nav active" : "nav"}
            onClick={() => navigate("instructor-reviews")}
          >
            Reviews & Analytics
          </button>
        </>
      )}

      {userRole === "admin" && (
        <>
          <button
            className={view === "admin-users" ? "nav active" : "nav"}
            onClick={() => navigate("admin-users")}
          >
            Users
          </button>
          <button
            className={view === "admin-instructors" ? "nav active" : "nav"}
            onClick={() => navigate("admin-instructors")}
          >
            Instructor approvals
          </button>
          <button
            className={view === "admin-courses" ? "nav active" : "nav"}
            onClick={() => navigate("admin-courses")}
          >
            Course moderation
          </button>
          <button
            className={view === "admin-reviews" ? "nav active" : "nav"}
            onClick={() => navigate("admin-reviews")}
          >
            Review moderation
          </button>
          <button
            className={view === "admin-categories" ? "nav active" : "nav"}
            onClick={() => navigate("admin-categories")}
          >
            Categories
          </button>
          <button
            className={view === "admin-audit" ? "nav active" : "nav"}
            onClick={() => navigate("admin-audit")}
          >
            Audit logs
          </button>
        </>
      )}

      {userRole === "student" && (
        <>
          <button
            className={view === "courses" ? "nav active" : "nav"}
            onClick={() => navigate("courses")}
          >
            Discover Courses
          </button>
          <button
            className={view === "learning" ? "nav active" : "nav"}
            onClick={() => navigate("learning")}
          >
            My Learning
          </button>
          <button
            className={view === "course" ? "nav active" : "nav"}
            onClick={() => navigate("course")}
          >
            Course Detail
          </button>
          <button
            className={view === "quiz-history" ? "nav active" : "nav"}
            onClick={() => navigate("quiz-history")}
          >
            Quiz History
          </button>
          <button
            className={view === "profile" ? "nav active" : "nav"}
            onClick={() => navigate("profile")}
          >
            Profile
          </button>
        </>
      )}
    </aside>
  );
}
