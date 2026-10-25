# AICTE SmartAssist Pro — Unified National Regulatory Platform
### Smart India Hackathon (SIH) Prototype Demonstration

> **Official Problem Statement:** PS-4 — Approval Process Workflow Automation, AI-Powered Scrutiny, Document Passport & Geospatial Delay Intelligence.  
> **Repository:** Unified AICTE SmartAssist Platform  
> **Status:** Production Build Ready &bull; Fully Tested (41/41 Full System Audit Checks Passed)

---

## 1. Project Overview

**AICTE SmartAssist** is a unified, cloud-native regulatory platform engineered to modernize, streamline, and accelerate the All India Council for Technical Education (AICTE) approval and compliance lifecycle for engineering and technical institutions across India.

Historically, institutional approval processes, document verification, scrutiny, Expert Visiting Committee (EVC) scheduling, and compliance monitoring operated across fragmented systems with significant manual overhead, SLA delays, and communication friction. 

**AICTE SmartAssist** unifies all three regulatory tiers into a single integrated system:
1. **Institution Portal** (`/institution/*`): Digital application submission, deficiency rectification, Smart Document Passport ledger, fee tracking, and compliance management.
2. **Regional Officer Portal** (`/regional/*`): Application queue, AI-assisted document scrutiny, deficiency memo issuance, re-scrutiny, EVC committee scheduling, and late appeal condonation.
3. **Senior Authority / Central Bureau HQ** (`/senior/*`): Executive dashboard, GIS Regional Alert Map, real-time pendency tracking, automated SLA breach escalations, bottleneck analytics, and statutory reporting.

> [!NOTE]
> **Prototype Sandbox Environment:** This platform contains realistic simulated regulatory datasets for the SIH evaluation. It operates in a secure sandbox mode and is not connected to live production AICTE servers.

---

## 2. System Architecture

The application adopts a **3-Tier Role-Based Unified Architecture** backed by a shared Supabase PostgreSQL database with Row-Level Security (RLS) and real-time reactive updates.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        AICTE SmartAssist Client                        │
│                 (React 19 + TypeScript + Vite + Tailwind)              │
└────────────┬───────────────────────────┬───────────────────────────┬───┘
             │                           │                           │
   ┌─────────▼─────────┐       ┌─────────▼─────────┐       ┌─────────▼─────────┐
   │ Institution Portal│       │  Regional Office  │       │   Senior Bureau   │
   │ (/institution/*)  │       │   (/regional/*)   │       │    (/senior/*)    │
   │  Sakshi Sharma    │       │  Ragini Telange   │       │  Dr. Janhavi H.   │
   └─────────┬─────────┘       └─────────┬─────────┘       └─────────┬─────────┘
             │                           │                           │
┌────────────┴───────────────────────────┴───────────────────────────┴───┐
│                    Universal Application Shell                         │
│  • TopHeader (SIH Banner, Role Switcher, Language Selector: EN/HI/MR)  │
│  • DynamicSidebar (Role-Aware Navigation)                              │
│  • Floating AI Copilot & Voice Assistant (Web Speech API)              │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                    Canonical Shared Data Service Layer                 │
│  • applicationsService.ts  • documentsService.ts  • complianceService.ts│
│  • notificationsService.ts • authService.ts       • chatbotService.ts   │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
┌────────────────────────────────────▼───────────────────────────────────┐
│                  Supabase Cloud Engine (PostgreSQL)                    │
│  • Row-Level Security (RLS) • Private Document Vault Bucket            │
│  • Audit Trail Ledger       • Real-Time WebSocket Notifications        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling & UI** | Tailwind CSS 3.4, Lucide React Icons |
| **Routing** | React Router v7 |
| **State & Context** | React Context API (`AuthProvider`, `LanguageProvider`, `ToastProvider`) |
| **Database & Auth** | Supabase (PostgreSQL 15), Supabase Auth, Row-Level Security (RLS) |
| **Storage** | Supabase Storage (Private `application-documents` bucket) |
| **Geospatial & Mapping** | Leaflet 1.9, React-Leaflet, OpenStreetMap Tiles |
| **Data Visualization** | Recharts 3.10 (Bar, Pie, Area, and Radar Charts) |
| **AI & Voice Services** | Natural Language Rule-Based Statutory Assistant, Web Speech API |
| **Browser Extension** | Chrome Manifest V3, TypeScript, Side Panel API |

---

## 4. Setup & Installation

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### Installation Steps

1. **Clone the repository:**
   ```bash
   git clone <repo-url>
   cd "EduApprove Pro"
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Run TypeScript verification:**
   ```bash
   npm run lint
   ```

5. **Build production bundle:**
   ```bash
   npm run build
   ```

6. **Preview production build:**
   ```bash
   npm run preview
   ```

---

## 5. Environment Variables

Create a `.env` file in the project root:

```env
# AICTE SmartAssist Environment Configuration
VITE_APP_TITLE="AICTE SmartAssist Pro"
VITE_APP_ENV="development"

# Supabase Credentials (Cloud or Local Sandbox)
VITE_SUPABASE_URL="https://your-supabase-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Optional External AI API Key (Groq / Gemini)
VITE_GROQ_API_KEY=""
```

> [!CAUTION]
> **Zero Service-Role Key Exposure:** Never add `SUPABASE_SERVICE_ROLE_KEY` to client `.env` files. Frontend operations strictly use the public `VITE_SUPABASE_ANON_KEY` combined with JWT user sessions.

---

## 6. Supabase Setup & RLS Security

The database schema is structured around canonical tables:
- `applications`: Master application records, stages, and status transitions.
- `documents`: Document metadata, versioning, storage paths, and scrutiny flags.
- `document_passport`: Multi-year credential ledger with expiry dates and verification badges.
- `compliance_requirements`: Institutional statutory compliance checklist and deficiency notices.
- `notifications`: Multi-tier real-time alerts and escalation notices.
- `audit_logs`: Immutable, append-only ledger tracking all status changes.

### Key Row-Level Security Policies:
- **Institutions:** `auth.uid() = institution_id` (Institutions can read and update only their own applications and documents).
- **Regional Officers:** `region IN (officer_jurisdiction)` (Officers can review applications within their designated administrative region).
- **Senior Authorities:** Authorized high-level aggregate visibility across all regions with applicant PII masked.

---

## 7. User Roles & Evaluation Personas

The application features three pre-configured demo personas accessible via **1-Click Quick Login** on the login screen:

| Role | Persona Name | Organization / Office | Default Email | Password |
| :--- | :--- | :--- | :--- | :--- |
| **Institution Admin** | Sakshi Sharma | Pune Institute of Computer Technology | `principal@pict.edu` | `demo123` |
| **Regional Officer** | Ragini Telange | Western Regional Office (Pune Desk) | `ragini.telange@aicte-india.org` | `demo123` |
| **Senior Authority** | Dr. Janhavi Hinganghatkar | AICTE National Headquarters (New Delhi) | `j.hinganghatkar@aicte-india.org` | `demo123` |

---

## 8. Application Routes

### Public Routes
- `/login`: Unified Login Portal with 1-Click Role Switcher and credential auto-fill.
- `/`: Smart Gateway Redirect (directs authenticated users to their authorized dashboard).

### Institution Portal (`/institution/*`)
- `/institution/dashboard`: Application summary, compliance health score, and quick actions.
- `/institution/applications`: Application list, new application submission, and timeline view.
- `/institution/documents`: Mandatory document vault, scrutiny status, and deficiency uploads.
- `/institution/passport`: Smart Document Passport credential ledger and expiry tracker.
- `/institution/compliance`: Statutory compliance checklist (Fire Safety, Biometric, Land, Anti-Ragging).
- `/institution/evc`: Expert Visiting Committee inspection schedule and readiness checklist.
- `/institution/notifications`: Real-time notification center with priority filters.
- `/institution/profile`: Institutional AICTE profile and affiliation records.
- `/institution/settings`: Account preferences and language settings.

### Regional Officer Portal (`/regional/*`)
- `/regional/dashboard`: Regional workload, scrutiny queue status, and pending approvals.
- `/regional/applications`: Application queue, state filters, and applicant dossiers.
- `/regional/scrutiny-workspace`: AI-assisted document scrutiny studio and deficiency memo generator.
- `/regional/evc`: EVC committee formation, inspector assignment, and report evaluation.
- `/regional/compliance`: Institutional compliance verification and deficiency closure.
- `/regional/late-requests`: Late appeal condonation and extension request processing.
- `/regional/notifications`: Officer notices and approaching SLA reminders.
- `/regional/audit-logs`: Immutable regional audit trail.

### Senior Authority Portal (`/senior/*`)
- `/senior/dashboard`: National executive dashboard with live KPI counters and pendency analytics.
- `/senior/regional-map`: Interactive Leaflet GIS Regional Alert Map with 5 data layers.
- `/senior/applications`: Pan-India application registry with status breakdowns.
- `/senior/escalations`: Escalation Action Centre for overdue cases and SLA breaches.
- `/senior/reports`: Exportable regulatory reports (PDF, CSV) and historical trend charts.
- `/senior/audit-logs`: Pan-India statutory audit ledger.

---

## 9. Major Features

### 1. Unified 3-Tier End-to-End Workflow
- When an institution submits an application, it immediately routes to the assigned Regional Officer's scrutiny queue.
- If the Regional Officer flags a deficiency and requests correction, the application transitions to `CORRECTION_REQUIRED`.
- The institution receives an instant notification, views the deficiency memo, uploads the revised certified document, and resubmits (`RESUBMITTED`).
- The Regional Officer verifies the correction, advances the case to `UNDER_RE_SCRUTINY`, and moves it to the next configured statutory stage (`PENDING_EVC`).
- Senior Authority statistics (total applications, pendency, regional GIS charts) update in real-time from the shared database.

### 2. Smart Document Passport
- Tracks institutional documents as cryptographically verified credentials.
- Displays upload dates, issuing authorities, verification badges, validity periods, and multi-cycle renewal history.
- Automatically flags expiring certificates (e.g. Fire Safety, Building Stability, Land Title).

### 3. Compliance & Undertakings Engine
- Tracks statutory mandates from the AICTE Approval Process Handbook (APH).
- Supports document evidence attachments and officer remarks.
- Enforces strict verification before closure.

### 4. Smart Alerts & SLA Escalation Radar
- Generates 7-day upcoming deadline reminders.
- Flags overdue reviews exceeding statutory citizen charter limits.
- Automatically escalates Level 2 critical breaches to the Senior Authority Action Centre.

---

## 10. AI Features

### 1. Context-Aware AI Chatbot
- Universal floating copilot accessible across all pages.
- Understands regulatory queries: required documents, application status, APH guidelines, deadlines, and fee structures.
- **Statutory Decision Safeguard:** Programmed to refuse making binding statutory approvals, directing users to authorized officer workflows.

### 2. Voice Assistant
- Integrated microphone input with real-time speech recognition (Web Speech API).
- Text-to-speech voice responses with speech synthesis.
- Supports conversational regulatory assistance.

### 3. Multilingual Support
- Unified language engine supporting **English**, **Hindi (हिन्दी)**, and **Marathi (मराठी)**.
- Single global `LanguageProvider` with synchronized UI translations.

---

## 11. Chrome Extension

The **AICTE SmartAssist Approval Companion** Chrome extension enables regional officers and senior authorities to monitor approval queues and deadlines without keeping the main web portal open.

### Features
- Real-time SLA deadline radar.
- Quick status check for assigned applications.
- Pending notification count with one-click direct deep links.
- Chrome Side Panel integration for persistent multitasking.

### Installation Instructions
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in top-right corner).
3. Click **Load unpacked**.
4. Select the folder:  
   `EduApprove Pro/senior_authority/dist-extension`
5. The extension icon will appear in the Chrome toolbar.

---

## 12. Testing & Verification Suite

The repository includes comprehensive automated verification suites covering all application dimensions:

```bash
# 1. Full System & Security Audit (41 checks: Auth, RBAC, DB, Workflows, UI)
npx tsx scripts/verify-full-system-audit.js

# 2. 3-Tier End-to-End Workflow Test (42 checks: Inst -> RO -> Senior)
npx tsx scripts/verify-complete-e2e-workflow.js

# 3. Advanced Features Verification (37 checks: Passport, Map, Chatbot, i18n)
npx tsx scripts/verify-advanced-features.js

# 4. TypeScript Static Type Check
npm run lint

# 5. Production Build
npm run build
```

---

## 13. Known Limitations & Prototype Boundaries

1. **Simulated Production Sandbox:** The database uses realistic prototype records and simulated institutional profiles (e.g., PICT Pune, COEP, VJTI) rather than live production feeds.
2. **Payment Gateway Integration:** Payment fee steps simulate transaction success via webhook mock callbacks; no live banking gateway is connected.
3. **SMS / Email Gateway:** Notifications are rendered in-app and in the browser extension; live SMS gateway (e.g. NIC SMS) requires authorized AICTE sender IDs.
4. **Offline Speech Recognition:** The Web Speech API relies on browser-supported speech engines (Chrome / Edge recommended for optimal voice support).

---

## 14. Demo Instructions & SIH Presentation Script

Follow this step-by-step walkthrough during the SIH evaluation:

### Act 1: Institution Admin Flow (Sakshi Sharma)
1. **Login:** Open [http://localhost:5173/login](http://localhost:5173/login). Click **"1. Institution Admin"** (or enter `principal@pict.edu` / `demo123`).
2. **Dashboard:** Point out the Institutional Compliance Health Score, Application Status summary, and Document Expiry Alert widget.
3. **Smart Document Passport:** Navigate to **"Smart Passport"** in the sidebar. Highlight the Fire Safety and Land Deed credential cards with verification badges and renewal tracking.
4. **Create & Submit Application:** Navigate to **"Applications"** $\rightarrow$ Click **"New Application"** (e.g., Application `TEST-001` - Extension of Approval). Upload statutory documents and click **"Submit Application"**.
5. **View Status:** Confirm the application status changes to `SUBMITTED`.

### Act 2: Regional Officer Scrutiny Flow (Ragini Telange)
1. **Role Switch:** Click the role switcher in the top navigation bar and select **"Ragini Telange (Regional Officer)"** (or log out and use the 1-click RO button on `/login`).
2. **Scrutiny Queue:** Navigate to **"Scrutiny Queue"** (`/regional/applications`). Notice application `TEST-001` appears immediately at the top of the queue.
3. **Open Scrutiny Studio:** Open `TEST-001`. Review the uploaded documents.
4. **Request Correction:** Click **"Request Correction"**. Issue a deficiency memo: *"Land deed missing Sub-Registrar seal. Please upload certified copy."* Status updates to `CORRECTION_REQUIRED`.
5. **Switch Back to Institution:** Switch back to Sakshi Sharma. Notice the instant deficiency alert notification. Open the application, upload the rectified document, and click **"Submit Correction"** (status: `RESUBMITTED`).
6. **Re-Scrutiny & EVC:** Switch back to Regional Officer. Verify the rectified submission, approve re-scrutiny, and schedule the case for **EVC Inspection** (`PENDING_EVC`).

### Act 3: Senior Authority Executive Oversight (Dr. Janhavi Hinganghatkar)
1. **Role Switch:** Switch to **"Dr. Janhavi Hinganghatkar (Senior Authority)"**.
2. **National Dashboard:** Point out the updated total applications counter (incremented from 14 to 15), Western Region caseload, and SLA health indicators.
3. **Regional Alert Map:** Click **"Regional Alert Map & GIS"** in the sidebar. Demonstrate:
   - Selecting the **"Overdue Applications"** layer.
   - Zooming into the **Western Region** marker.
   - Demonstrating the accessible table view alternative.
4. **Escalation Action Centre:** Navigate to **"Escalation Action Centre"** (`/senior/escalations`). Review overdue bottleneck cases flagged for National Secretariat intervention.
5. **Reports:** Navigate to **"Statutory Reports"** to show real-time exportable CSV/PDF summaries.

### Act 4: Advanced Features
1. **AI Chatbot & Voice Assistant:** Click the floating copilot in the bottom right corner. Type: *"What documents are required for Extension of Approval?"*. Click the microphone icon to test voice queries.
2. **Language Switcher:** In the top header, switch the language from **English** to **हिन्दी** and **मराठी**. Show that labels, navigation, and badges seamlessly update.
3. **Chrome Extension:** Open the extension popup from the browser toolbar to show the live synchronization of pending tasks and SLA countdowns.
