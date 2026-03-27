# 🎓 New Campus Management System

A full-stack campus management platform built with **React + Node.js + MongoDB** for managing students, departments, attendance, and more.

[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://vercel.com)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)](https://render.com)
[![Database](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb)](https://www.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## ✨ Features

### 🔐 Authentication & Security
- JWT-based login/signup with role-based access control
- **6 roles:** Admin, Manager, Team Leader, Trainer, TA, Learner
- Account lockout after 5 failed login attempts (15-min cooldown)
- Force password reset on first login for bulk-created students

### 👥 User & Department Management
- Full CRUD for users with role assignment
- Department management with **auto-generated codes** (name → code)
- **Soft delete** with Active/Inactive toggle filter
- Styled **MUI Confirmation Dialog** (no more ugly browser popups!)

### 📤 Bulk Student Upload
- Upload students via **Excel (.xlsx)** or **CSV** files
- Auto-generates username from email
- Default password: `Default@123` (forced reset on first login)
- Download a pre-filled `.xlsx` template with one click
- Cohort grouping support for batch assignment

### 📊 Attendance & Performance
- Trainer/TA attendance marking per batch
- Attendance history & reports
- Learner performance tracking
- Daily updates system for Trainers and Managers

### 🏫 Academic Management
- Batch management with learner assignment
- Classroom management
- Topics/Courses management
- Audit logs for admin oversight

---

## 🧱 Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (Vite) |
| UI Library | Material UI (MUI v5) |
| Styling | Tailwind CSS |
| State | Redux Toolkit + React Query |
| HTTP Client | Axios |
| Routing | React Router DOM v6 |
| Excel Parsing | SheetJS (xlsx) |
| Deployment | Vercel |

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Logging | Custom audit logger |
| Deployment | Render |

---

## 🗂️ Project Structure

```
New-Campus-Management/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          ← ProtectedRoute, RoleBasedRoute
│   │   │   ├── layout/        ← MainLayout, Sidebar
│   │   │   ├── ui/            ← DataTable, ConfirmDialog
│   │   │   └── common/        ← ErrorBoundary
│   │   ├── pages/
│   │   │   ├── Admin/         ← Departments, Users, Batches, etc.
│   │   │   ├── Trainer/       ← Attendance, DailyUpdates
│   │   │   ├── Learner/       ← Attendance, Performance
│   │   │   ├── Manager/       ← DailyUpdates review
│   │   │   ├── Reports/       ← AttendanceHistory
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── store/
│   │   │   └── slices/        ← authSlice (Redux)
│   │   ├── services/          ← Axios API calls
│   │   └── App.jsx
│   ├── .env                   ← VITE_API_URL
│   └── vite.config.js
│
├── backend/
│   ├── routes/                ← Express route definitions
│   ├── controllers/           ← Business logic
│   ├── models/                ← Mongoose schemas
│   ├── middleware/            ← Auth middleware
│   ├── utils/                 ← Logger utilities
│   ├── .env                   ← MONGO_URI, JWT_SECRET, PORT
│   └── server.js
│
├── MASTER_PROMPT.md           ← AI session context file
└── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git**

### 1. Clone the Repository
```bash
git clone https://github.com/Diganta18-noob/New-Campus-Management.git
cd New-Campus-Management
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `backend/.env`:
```env
MONGO_URI=mongodb://localhost:27017/campus-management
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
BCRYPT_SALT_ROUNDS=10
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

Start the backend:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
```

Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:
```bash
npm run dev
# App runs on http://localhost:5173
```

---

## 🔑 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | *(create via signup)* | *(your password)* |
| Bulk Students | *(from Excel upload)* | `Default@123` |

> **Note:** Bulk-uploaded students are forced to change their password on first login.

---

## 📤 Bulk Student Upload Guide

1. Navigate to **Users Management** page
2. Click **"Download Template (.xlsx)"** to get the format
3. Fill in student data:

| firstname | lastname | email | rollnumber | phone | cohortid |
|-----------|----------|-------|------------|-------|----------|
| Alice | Demo | alice@example.com | D001 | 1234567890 | BATCH-2026-A |

4. Drag & drop the file into the upload zone (accepts `.xlsx` and `.csv`)
5. Students are created with role `LEARNER` and password `Default@123`

---

## 🌐 Deployment

### Frontend → Vercel
1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add env variable: `VITE_API_URL=https://your-backend.onrender.com`

### Backend → Render
1. Create a new **Web Service** on [Render](https://render.com)
2. Set root directory to `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add environment variables from `backend/.env`

> ⚠️ Render free tier spins down after inactivity (~30s cold start on first request).

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| API calls failing | Check if Render backend is awake (cold start ~30s) |
| CORS errors | Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL |
| Login not working | Verify `VITE_API_URL` points to correct backend URL |
| MongoDB connection error | Check `MONGO_URI` is valid and IP is whitelisted in Atlas |
| JWT errors | Ensure `JWT_SECRET` matches and token hasn't expired |
| `npm run dev` fails | Run `npm install` first in both `/frontend` and `/backend` |

---

## 🗺️ Roadmap

- [ ] Real-time notifications (Socket.IO)
- [ ] Fee payment module
- [ ] Timetable / schedule management
- [ ] Export data as PDF/CSV
- [ ] Email notifications (Nodemailer)
- [ ] Migrate to TypeScript
- [ ] Unit tests (Jest + Supertest)
- [ ] Docker containerization

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/awesome-feature`)
3. Commit your changes (`git commit -m 'feat: add awesome feature'`)
4. Push to the branch (`git push origin feature/awesome-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/Diganta18-noob">Diganta Biswas</a>
</p>
