# VELORA — CAPACITY CONNECT 🌊⚡
### Next-Generation AI-Driven Digital Capacity-Building & Skill Gap Ecosystem
**Smart India Hackathon 2026 (SIH 2026) • Problem Statement ID: SIH26075**  
**Ministry / Organization:** Ministry of Earth Sciences (MoES) / India Meteorological Department (IMD)

---

## 🌟 Executive Summary

**VELORA — Capacity Connect** is a complete, enterprise-grade, role-based digital learning and skill gap resolution ecosystem purpose-built for the **Ministry of Earth Sciences (MoES)** and its constituent organizations (**IMD, INCOIS, IITM, NCMRWF, NIOT**). 

The platform operationalizes the end-to-end capacity-building lifecycle:
$$\text{PROFILE} \longrightarrow \text{ASSESS} \longrightarrow \text{ANALYZE} \longrightarrow \text{IDENTIFY SKILL GAP} \longrightarrow \text{RECOMMEND} \longrightarrow \text{LEARN} \longrightarrow \text{PRACTICE} \longrightarrow \text{REASSESS} \longrightarrow \text{CERTIFY}$$

---

## 🎯 Hackathon Judge Quick-Start Guide (One-Click Role Switching)

The platform features an instant **Judge Demo Switcher** in the top navigation bar and on the landing page, allowing evaluators to experience all 3 user role portals with zero friction:

| Role Portal | Demo Account | Quick Switch Action | Key Features to Test |
| :--- | :--- | :--- | :--- |
| 🎓 **Trainee Portal** | `trainee@velora.demo` | Click **"Trainee Portal (Arjun)"** | Competency Radar Chart, AI Skill Gap Alert, Micro-Lessons, Timed Assessment Engine, Personal Notebook |
| 👨‍🏫 **Trainer Portal** | `trainer@velora.demo` | Click **"Trainer Portal (Dr. Rahul)"** | Micro-Course Builder, Trainee Progress Metrics, Live Classroom Hub, Question Bank |
| 🏛️ **Admin Director** | `admin@velora.demo` | Click **"Admin Director Portal"** | Institutional Readiness Charts (Recharts), Directorate CSV Export, System Announcement Broadcast |

*(Password for manual login on all demo accounts: `Demo@123`)*

---

## 🚀 Architectural Overview & Key Capabilities

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            VELORA FRONTEND (Vite + React 18)                 │
│   • Dark GovTech Modern Aesthetic (Custom CSS System)                       │
│   • Role-Aware Navigation (Trainee / Trainer / Admin)                      │
│   • Interactive Recharts Data Visualization & Radar Matrix                   │
│   • Responsive Glassmorphic Layout & Live Classroom Streaming UI            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │  REST API (JWT Bearer Token)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         VELORA BACKEND ENGINE (Express + Node.js)           │
│   • Automated Competency & Skill Gap Calculation Engine                     │
│   • AI Rule-Based Course & Trainer Recommendation Engine                    │
│   • Timed Assessment Scoring Engine (Auto-updates Trainee Scores)           │
│   • Cryptographic Certificate Verification Registry                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │  sql.js (WASM SQLite Driver)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      PERSISTENT RELATIONAL DATABASE                         │
│   • 30+ Interconnected Tables (Competencies, Gaps, Courses, Lessons,        │
│     Assessments, Questions, Enrollments, Certificates, Notifications, etc.)  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Key Technical Innovations:
1. **Dynamic Skill Gap Engine (`/api/skill-gaps/calculate`):** Automatically compares a scientist's current competency scores against MoES operational target benchmarks ($Gap = Target - Current$).
2. **AI Recommendation Engine (`/api/recommendations/generate`):** Maps identified skill gaps to specific micro-learning courses and connects trainees directly with senior domain trainers.
3. **Real-time Assessment Engine (`/api/assessments/:id/submit`):** Evaluates timed quizzes, calculates percentage accuracy, updates competency scores, and triggers skill gap recalculations on the fly.
4. **Verifiable National Credentials (`/api/certificates/verify/:certId`):** Public cryptographic validation page ensuring tamper-evident certificate verification for MoES personnel files.

---

## 🛠️ Local Development & Setup Instructions

### Prerequisites
- Node.js (v18+ or v24+)
- npm or yarn

### 1. Backend Setup
```bash
cd backend
npm install
npm run seed     # Initializes WASM SQLite database & seeds 30+ tables with demo data
npm start        # Starts Express server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev      # Starts Vite dev server on http://localhost:3000
```
Open `http://localhost:3000` in your web browser to launch VELORA!

---

## 📊 Database Schema Highlights

The database is powered by `sql.js` (WebAssembly SQLite) to ensure cross-platform Node.js compatibility without native binary dependencies:

- `users` (id, email, password_hash, role, first_name, last_name, department, designation, learning_hours)
- `competencies` (id, name, category, description, target_score)
- `trainee_competencies` (user_id, competency_id, current_score, proficiency_level)
- `skill_gaps` (user_id, competency_id, target_score, current_score, gap_score, status)
- `courses` (id, title, category, level, duration_hours, trainer_id, competency_id, rating)
- `lessons` (id, course_id, module_id, title, duration_mins, content_body, is_completed)
- `assessments` (id, title, category, time_limit_mins, passing_score, competency_id)
- `certificates` (id, user_id, course_id, certificate_number, issue_date)

---

## 🏆 SIH26075 Alignment Matrix

| SIH26075 Feature Requirement | Implemented Velora Solution |
| :--- | :--- |
| **MoES Competency Mapping** | 45+ Domain competencies categorized across NWP, Radar, Satellite, Oceanography |
| **Skill Gap Identification** | Automated algorithm calculating gap score, severity badge, & target deficit |
| **Personalized Recommendations** | Rule-based recommendation engine matching skill gaps to courses & trainers |
| **Interactive Learning** | Micro-lessons, live classroom with interactive polls & real-time chat, personal notes |
| **Institutional Analytics** | Executive dashboard with Recharts readiness index & CSV export |

---
*Built with ❤️ for Smart India Hackathon 2026 • Ministry of Earth Sciences / IMD*
