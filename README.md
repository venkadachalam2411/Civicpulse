# CivicPulse – Smart Community Issue Reporting and Resolution Platform

> **Report. Track. Resolve.**

CivicPulse is a full-stack, production-quality web application that connects citizens, municipal administrators, and field officers to report, prioritize, track, resolve, and analyze community issues such as potholes, garbage accumulation, water leaks, broken streetlights, electricity hazards, and damaged public infrastructure.

---

## 🌟 Key Smart Features

- **Smart Category Suggestion**: Real-time keyword & NLP analysis of complaint descriptions to auto-recommend categories as citizens type.
- **Duplicate Issue Detection**: Evaluates text similarity and Haversine geographic distance within a ~1.5km radius to flag existing unresolved complaints ("A similar issue has already been reported nearby"), allowing citizens to upvote existing issues instead of creating duplicates.
- **Dynamic Priority Score (0–100)**: Automatically calculates priority score based on severity weights, community upvotes (+2 per upvote), location impact, and complaint age.
- **SLA & Delay Tracking**: Automated resolution targets based on priority (Critical: 12h, High: 24h, Medium: 3d, Low: 7d) with prominent **⚠️ SLA Breached** badges.
- **Location-Based Interactive Map**: City-wide Leaflet map visualization featuring custom color-coded markers for Low (Green), Medium (Blue), High (Orange), and Critical (Red) priorities.
- **Resolution Proofing**: Requires field officers to upload side-by-side **Before** and **After** resolution proof photos and remarks before marking tasks as resolved.
- **Citizen Verification & Reopen Workflow**: Citizens review resolution photos and can either **Confirm Resolution** to close the ticket or **Reopen Issue** if work is unsatisfactory.
- **In-App Notifications**: Real-time notification bell with unread counters and direct links.
- **Recharts Analytics Control Center**: Interactive charts for category distribution, monthly report/resolution trends, priority breakdown, and officer active workload.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14+ (React 18, TypeScript, App Router)
- **Styling**: Tailwind CSS, Modern Dark-Mode Glassmorphism Design Tokens
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Maps**: Leaflet & React-Leaflet (OpenStreetMap)
- **Forms & Validation**: React Hook Form, Zod
- **HTTP Client**: Axios with JWT interceptors

### Backend
- **Runtime**: Node.js & Express.js (TypeScript)
- **Database**: MongoDB & Mongoose
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs
- **File Uploads**: Multer with AWS S3 SDK integration and static disk storage fallback

---

## 👥 User Roles & Demo Credentials

The platform includes pre-seeded accounts for immediate demonstration:

| Role | Email | Password | Scope & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin (Venkat)** | `admin@civicpulse.org` | `Password123!` | Analytics dashboard, assign officers, verify complaints, override priority, manage categories |
| **Officer (Roads)** | `officer.roads@civicpulse.org` | `Password123!` | View assigned tasks, update work status, upload resolution proof photos |
| **Officer (Water)** | `officer.water@civicpulse.org` | `Password123!` | View assigned tasks, update work status, upload resolution proof photos |
| **Officer (Elec)** | `officer.elec@civicpulse.org` | `Password123!` | View assigned tasks, update work status, upload resolution proof photos |
| **Citizen** | `citizen1@civicpulse.org` | `Password123!` | Report issues, upvote complaints, track timeline, verify resolution proof |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- MongoDB (local or MongoDB Atlas cluster running at `mongodb://127.0.0.1:27017/civicpulse`)

### 1. Backend Setup & Seeding

```bash
cd backend

# Install dependencies
npm install

# Build TypeScript code
npm run build

# Seed database with sample users, categories, and 18 complaints
npm run seed

# Start Express backend server (default port 5000)
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js development server (default port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐳 Docker Deployment

To run the entire full-stack application (MongoDB + Express Backend + Next.js Frontend) in containerized Docker environment:

```bash
docker-compose up --build
```

---

## 📑 REST API Specification

### Authentication
- `POST /api/auth/register`: Register new user account
- `POST /api/auth/login`: Authenticate user & return JWT token
- `GET /api/auth/me`: Retrieve current logged in user profile

### Issues & Complaints
- `POST /api/issues`: Create new complaint (runs duplicate detection & category suggestion)
- `GET /api/issues`: List issues (supports search, category/status/priority filters, pagination & sorting)
- `GET /api/issues/:id`: Get full issue details, resolution proof, upvote state, and timeline
- `POST /api/issues/:id/upvote`: Upvote issue (recalculates smart priority score)
- `POST /api/issues/:id/confirm-resolution`: Citizen confirms closure or reopens issue

### Officer Endpoints
- `GET /api/officer/issues`: View assigned tasks with SLA filter
- `PUT /api/officer/issues/:id/status`: Update status (e.g. In Progress)
- `POST /api/officer/issues/:id/resolve`: Submit resolution proof photo & remarks

### Admin Control Center
- `GET /api/admin/analytics`: Return platform metrics & Recharts analytics data
- `GET /api/admin/issues`: View all system complaints
- `PUT /api/admin/issues/:id/assign`: Assign officer to complaint
- `PUT /api/admin/issues/:id/priority`: Override priority score (0–100) & SLA deadline
- `PUT /api/admin/issues/:id/verify`: Verify or reject reported complaint

---

## 🤖 Future AI/ML Roadmap

- **Computer Vision Model**: Automated issue image classification (e.g. identifying pothole severity from uploaded photo).
- **Predictive Maintenance**: Forecasting infrastructure failure risks based on historical complaint density clusters.
- **NLP Sentiment & Urgency Detection**: Parsing citizen voice notes and text description for high-stress urgency cues.

---

## 📜 License
MIT © 2026 CivicPulse Platform.
