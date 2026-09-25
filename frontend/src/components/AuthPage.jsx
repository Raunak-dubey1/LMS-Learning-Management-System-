export default function AuthPage({
  authMode,
  authForm,
  message,
  onModeChange,
  onChange,
  onSubmit,
}) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="badge">LMS</span>
          <h1>Learning Management System</h1>
          <p>Backend-first MERN learning platform</p>
        </div>

        <div className="auth-toggle">
          <button
            className={authMode === "login" ? "active" : ""}
            onClick={() => onModeChange("login")}
            type="button"
          >
            Login
          </button>
          <button
            className={authMode === "register" ? "active" : ""}
            onClick={() => onModeChange("register")}
            type="button"
          >
            Register
          </button>
        </div>

        <form onSubmit={onSubmit} className="auth-form">
          {authMode === "register" && (
            <label>
              Full Name
              <input
                type="text"
                name="name"
                value={authForm.name}
                onChange={onChange}
                placeholder="Your name"
                required
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              name="email"
              value={authForm.email}
              onChange={onChange}
              placeholder="you@example.com"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              value={authForm.password}
              onChange={onChange}
              placeholder="••••••••"
              required
            />
          </label>
          {authMode === "register" && (
            <label>
              Role
              <select name="role" value={authForm.role} onChange={onChange}>
                <option value="student">Student</option>
                <option value="instructor">Instructor</option>
              </select>
            </label>
          )}
          {authMode === "register" && authForm.role === "instructor" && (
            <label>
              Experience
              <textarea
                name="instructorExperience"
                value={authForm.instructorExperience || ""}
                onChange={onChange}
                placeholder="Teaching or professional experience"
              />
            </label>
          )}
          <button type="submit" className="primary-btn">
            {authMode === "login" ? "Login to dashboard" : "Create account"}
          </button>
        </form>

        {message && <p className="system-message">{message}</p>}
      </div>
    </div>
  );
}
