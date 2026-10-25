# AICTE SmartAssist - Institution Admin Dashboard & Backend

AICTE SmartAssist is an enterprise government-technology portal engineered for AICTE workflow automation, institutional accreditation tracking, document passport compliance, and expert visiting committee (EVC) readiness.

---

## Architecture Overview

```text
d:\Sakshi\TY\SIH\
├── backend/
│   ├── app/
│   │   ├── main.py                     # FastAPI application with CORS & static file mounting
│   │   ├── core/
│   │   │   └── config.py               # Application settings, database URL & file validations
│   │   ├── database/
│   │   │   ├── base.py                 # SQLAlchemy declarative base
│   │   │   ├── session.py              # Engine & SessionLocal (SQLite + PostgreSQL/Supabase ready)
│   │   │   └── seed.py                 # Initial data seeder for Government College of Engineering
│   │   ├── models/
│   │   │   ├── institution.py          # Institution profile model
│   │   │   ├── application.py          # AICTE Application model (12 statuses/stages)
│   │   │   ├── document.py             # Statutory certificates & documents
│   │   │   ├── compliance.py           # Regulatory compliance requirements (8/10 completed)
│   │   │   ├── evc.py                  # Expert Visiting Committee inspection visits
│   │   │   ├── notification.py         # Institutional notifications
│   │   │   └── alert.py                # Smart Alert Center entries
│   │   ├── schemas/                    # Pydantic v2 schemas for all requests and responses
│   │   ├── services/
│   │   │   ├── dashboard_service.py    # Metric aggregation, summaries & timeline calculations
│   │   │   ├── document_service.py     # Document expiry logic (Valid, Expiring Soon, Critical, Expired)
│   │   │   ├── compliance_service.py   # Overdue calculations based on real calendar dates
│   │   │   ├── health_score_service.py # Dynamic 4-pillar health score algorithm
│   │   │   ├── assistant_service.py    # Context-aware AICTE copilot answering questions from live DB
│   │   │   └── storage_service.py      # Supabase Storage + local upload fallback
│   │   └── api/
│   │       └── institution/            # Modular FastAPI routers
│   │           ├── dashboard.py
│   │           ├── applications.py
│   │           ├── documents.py
│   │           ├── compliance.py
│   │           ├── evc.py
│   │           ├── notifications.py
│   │           ├── alerts.py
│   │           ├── health_score.py
│   │           └── assistant.py
│   ├── uploads/                        # Secure local file repository (if Supabase credentials not set)
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py
│
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── client.ts               # Type-safe API client for all backend REST endpoints
    │   ├── context/
    │   │   └── LanguageContext.tsx     # Multilingual i18n support (English, Hindi, Marathi)
    │   ├── components/
    │   │   ├── layout/
    │   │   │   ├── Sidebar.tsx         # Responsive sidebar with branding & institution details
    │   │   │   ├── TopNavbar.tsx       # Navbar with search, language switcher & notifications
    │   │   │   └── InstitutionLayout.tsx
    │   │   ├── dashboard/
    │   │   │   ├── SummaryCard.tsx
    │   │   │   ├── ApplicationOverviewChart.tsx # Recharts Donut chart
    │   │   │   ├── RecentApplications.tsx       # Applications table
    │   │   │   ├── ActionRequired.tsx           # Dynamic urgent issues section
    │   │   │   ├── UpcomingDeadlines.tsx        # Dynamic timeline with remaining days
    │   │   │   ├── DocumentPassportPreview.tsx  # Smart Document Passport preview
    │   │   │   ├── ComplianceOverview.tsx       # 8/10, 80% progress
    │   │   │   ├── EVCStatusCard.tsx            # Conditional EVC visit card
    │   │   │   ├── SmartAlertCenter.tsx         # Prioritized alert center
    │   │   │   ├── InstitutionHealthScore.tsx   # Health score card with official disclaimer
    │   │   │   └── AIAssistantCard.tsx          # Interactive chatbot copilot
    │   │   ├── forms/
    │   │   │   ├── DocumentUploadModal.tsx      # Secure upload with dropzone & validations
    │   │   │   └── NewApplicationModal.tsx      # Application initiation modal
    │   │   └── common/
    │   │       ├── Badge.tsx
    │   │       ├── Button.tsx
    │   │       ├── Modal.tsx
    │   │       └── Skeleton.tsx
    │   ├── pages/
    │   │   ├── DashboardPage.tsx
    │   │   ├── ApplicationsPage.tsx
    │   │   ├── DocumentsPage.tsx
    │   │   ├── PassportPage.tsx
    │   │   ├── CompliancePage.tsx
    │   │   ├── EVCPage.tsx
    │   │   ├── NotificationsPage.tsx
    │   │   ├── ProfilePage.tsx
    │   │   └── SettingsPage.tsx
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── vite.config.ts
```

---

## Key Backend REST APIs

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/institution/dashboard` | Consolidated dashboard payload (summary, chart, actions, deadlines, alerts, passport, health score) |
| `GET` | `/api/institution/dashboard/summary` | Cards 1-6 summary counters computed dynamically from database |
| `GET` | `/api/institution/dashboard/application-summary` | Donut chart workflow stage breakdown |
| `GET` | `/api/institution/dashboard/action-required` | Urgent tasks requiring immediate institutional attention |
| `GET` | `/api/institution/dashboard/deadlines` | Upcoming statutory deadlines with calculated remaining days |
| `GET` | `/api/institution/applications` | Full list of applications with filter & search |
| `GET` | `/api/institution/applications/recent` | Recent applications table view |
| `POST` | `/api/institution/applications` | Create new application |
| `GET` | `/api/institution/documents` | Documents enriched with expiry status logic |
| `POST` | `/api/institution/documents/upload` | Secure file upload (<15MB, PDF/JPG/PNG validation) |
| `GET` | `/api/institution/documents/passport` | Smart Document Passport records |
| `GET` | `/api/institution/compliance/summary` | Compliance completion ratio (8/10, 80%) |
| `GET` | `/api/institution/compliance` | Compliance requirements with real-time overdue detection |
| `POST` | `/api/institution/compliance/{id}/submit` | Submit compliance undertaking proof |
| `GET` | `/api/institution/evc/status` | EVC visit details (only returned when applicable) |
| `GET` | `/api/institution/notifications` | Notifications list with unread counter |
| `PATCH` | `/api/institution/notifications/{id}/read` | Mark notification as read |
| `GET` | `/api/institution/alerts` | Smart Alert Center prioritized entries |
| `GET` | `/api/institution/health-score` | Dynamic 4-component health score with disclaimer |
| `POST` | `/api/institution/assistant/chat` | AI SmartAssist copilot query endpoint |

---

## Seed Data Profile

- **Institution**: Government College of Engineering
- **Institution ID**: `AICTE-INS-10245`
- **AISHE Code**: `C-41584`
- **Region**: Western Regional Office (WRO Mumbai)
- **Total Applications**: 12 (Draft: 2, Submitted: 2, Under Scrutiny: 4, Correction Required: 2, EVC: 1, Completed: 1)
- **EVC Visit**: Scheduled for 20 Nov 2026, 10:30 AM (75% Complete)
- **Compliance Status**: 8 / 10 Completed (80%)
