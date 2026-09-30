# 🎓 Learning Management System

A backend-focused **Learning Management System (LMS)** built using the MERN stack. The platform supports **Students, Instructors, and Administrators** with authentication, role-based access control, course management, progress tracking, quizzes, reviews, certificates, and administration.

The project focuses on **REST API development, backend architecture, database design, authentication, authorization, and business logic**.

---

## ✨ Features

### Student

* Register and login
* Browse, search, and filter courses
* Enroll in courses
* Access lessons and track progress
* Take subject and difficulty-based quizzes
* View quiz results and attempts
* Receive certificates after course completion
* Review and rate completed courses

### Instructor

* Create and manage courses
* Create sections and lessons
* Configure quizzes
* Publish and unpublish courses
* View enrolled students and progress
* View course reviews and analytics

### Administrator

* Manage users and instructors
* Approve or reject instructors
* Manage and moderate courses
* Manage categories
* Moderate reviews and reports
* View platform-wide analytics
* Monitor administrative activities

### Quiz System

* Integrates with an external quiz API
* Generates questions based on subject and difficulty
* Processes questions through the backend
* Evaluates answers server-side
* Stores quiz attempts and scores
* Supports configurable passing scores and attempt limits

---

## 💡 Why This Project?

This project demonstrates the development of a real-world backend-driven application using REST APIs.

It focuses on:

* Authentication and authorization
* Role-Based Access Control (RBAC)
* MongoDB database design
* REST API development
* Business logic
* Input validation and error handling
* Pagination, filtering, and search
* Third-party API integration
* Progress and quiz evaluation
* Database aggregation and analytics

Course and lesson content is **seeded into the database**, while user activities such as enrollments, progress, quiz attempts, reviews, and certificates are handled dynamically.

---

## 🛠️ Tech Stack

| Technology   | Purpose                          |
| ------------ | -------------------------------- |
| React.js     | Frontend UI                      |
| Node.js      | Backend runtime                  |
| Express.js   | REST API framework               |
| MongoDB      | Database                         |
| Mongoose     | MongoDB schema and data modeling |
| JWT          | Authentication and authorization |
| bcrypt       | Password hashing                 |
| Axios        | API communication                |
| Quiz API     | External quiz questions          |

---

## 🏗️ Architecture

```text
React.js
    │
    │ REST API
    ▼
Express.js + Node.js
    │
    ├──────────────► MongoDB
    │
    └──────────────► External Quiz API
```

The backend handles authentication, authorization, business logic, database operations, quiz processing, and communication with the external quiz API.

---

## 📂 Project Structure

```text
lms/
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   └── package.json
│
├── server/                 # Node.js + Express backend
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── validators/
│   │   └── utils/
│   ├── seed/
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ How to Run

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/your-repository-name.git
cd your-repository-name
```

### 2. Install Dependencies

Backend:

```bash
cd server
npm install
```

Frontend:

```bash
cd ../client
npm install
```

### 3. Configure Environment Variables

Create a `.env` file inside the `server` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
QUIZ_API_KEY=your_quiz_api_key
```

Do not commit the `.env` file to GitHub.

### 4. Seed the Database

From the `server` directory:

```bash
npm run seed
```

If an admin seed script is available:

```bash
npm run seed:admin
```

### 5. Start the Backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5000
```

### 6. Start the Frontend

Open another terminal:

```bash
cd client
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## 🔐 Authentication

The application uses **JWT authentication** and **Role-Based Access Control** to protect resources.

Supported roles:

```text
Student
Instructor
Admin
```

Protected operations require authentication, while instructor and administrator operations additionally require the appropriate role.

---

## 🧪 API Testing

The REST APIs can be tested using:

* Postman
* Insomnia
* Thunder Client

API base URL:

```text
http://localhost:5000/api
```

---

## 🎯 Learning Objectives

This project provides practical experience with:

* Backend architecture
* RESTful API development
* MongoDB and Mongoose
* Authentication and RBAC
* Third-party API integration
* Database aggregation
* Validation and error handling
* Real-world backend business logic

---

## 📌 Project Status
**In Development/Progress**


## Demo Link 
https://lms-learning-management-system-bpu5.onrender.com


