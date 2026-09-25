# LMS Backend

This backend implements the workflow described for a MERN Learning Management System:

- Register/login with JWT auth
- Student, instructor, and admin roles
- Course listing and enrollment
- Lesson progress tracking
- External quiz generation and evaluation
- Reviews and certificate issuance

## Run

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env` from `.env.example` and set a unique `JWT_SECRET` of at least 32 characters. In local development, CORS allows `http://localhost:5173`; in the combined production deployment, the frontend and API use the same origin. Never commit `.env` files or production credentials.

Create an administrator with `npm run seed:admin` after setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the environment.

## API base

`http://localhost:5000/api`
