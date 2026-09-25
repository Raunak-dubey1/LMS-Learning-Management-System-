# LMS Backend Workflow

## 1. Authentication and access control

- Users register with `name`, `email`, and `password`
- Passwords are hashed before persistence
- JWT tokens are generated on login
- Every protected route checks the token and then role access

## 2. Role-based permissions

- Student: browse courses, enroll, learn lessons, take quizzes, track progress
- Instructor: create and publish courses, manage lessons and sections
- Admin: manage users, courses, reports, and platform moderation

## 3. Course creation flow

Instructor creates course metadata, adds sections, adds lessons, then publishes it. The course is saved in MongoDB and made available to students.

## 4. Student enrollment and learning

Students browse filtered course listings through backend APIs, enroll in published courses, and learn lesson content stored as text or structured lesson data.

## 5. Quiz generation with external API

Students trigger a quiz request using a subject and difficulty. The backend calls the external Quiz API, validates returned data, normalizes it, stores a quiz session, and returns only safe question metadata to the client.

## 6. Quiz submission and evaluation

The frontend sends answers to the backend. The server compares answers against stored correct answers, computes percentage, applies pass/fail logic, saves the attempt, and updates course progress.

## 7. Analytics and completion

- Lesson completion updates progress
- Quiz result updates course completion state
- Review and certificate generation happen only after completion criteria are met
- Instructor and admin dashboards read aggregated metrics from MongoDB

## 8. Data model direction

Core collections should include:

- User
- Course
- Section
- Lesson
- Enrollment
- QuizSession
- QuizAttempt
- Review
- Certificate

## 9. Backend architecture

- Routes: define HTTP endpoints
- Middleware: JWT verification and role checks
- Services: external API communication, validation, business logic
- Models: MongoDB schemas
- Controllers: orchestrate request handling

This project is intentionally backend-heavy and prepared for a React frontend to consume these APIs.
