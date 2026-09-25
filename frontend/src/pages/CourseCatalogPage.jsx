export default function CourseCatalogPage({ courses, filters, pagination, setFilters, onSelectCourse, onEnrollCourse }) {
  return (
    <div>
      <div className="card discovery-toolbar">
        <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value, page: 1 })} placeholder="Search courses" />
        <input value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value, page: 1 })} placeholder="Category" />
        <select value={filters.level} onChange={(event) => setFilters({ ...filters, level: event.target.value, page: 1 })}><option value="">All levels</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select>
        <select value={filters.sort} onChange={(event) => setFilters({ ...filters, sort: event.target.value, page: 1 })}><option value="rating">Top rated</option><option value="popularity">Most popular</option><option value="price">Lowest price</option><option value="title">Title</option></select>
      </div>
      <div className="panel-grid courses-grid">
        {courses.map((course) => (
          <article key={course._id} className="course-card card">
            <div className="course-topline"><span>{course.category}</span><span>{course.level}</span></div>
            <h3>{course.title}</h3>
            <p>{course.description}</p>
            <div className="meta-row"><strong>₹{course.price}</strong><span>⭐ {course.rating} · {course.students || 0} students</span></div>
            <div className="action-row"><button className="primary-btn" onClick={() => onSelectCourse(course._id)} type="button">View course</button><button className="secondary-btn" onClick={() => onEnrollCourse(course._id)} type="button">Enroll</button></div>
          </article>
        ))}
      </div>
      <div className="pagination-row"><button className="secondary-btn" disabled={pagination.page <= 1} onClick={() => setFilters({ ...filters, page: pagination.page - 1 })} type="button">Previous</button><span>Page {pagination.page} of {pagination.pages || 1}</span><button className="secondary-btn" disabled={pagination.page >= pagination.pages} onClick={() => setFilters({ ...filters, page: pagination.page + 1 })} type="button">Next</button></div>
    </div>
  );
}
