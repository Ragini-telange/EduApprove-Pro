# EduApprove Pro — AICTE Regulatory Approval Platform

EduApprove Pro is an institutional regulatory compliance and statutory approval platform for the All India Council for Technical Education (AICTE).

This repository contains the shared platform architecture and the authoritative implementation of **Part 2: Regional Officer Module** (assigned to Ragini Telange, Regional Scrutiny Officer, Western Regional Office - Pune).

---

## 🏛️ Module Responsibility: Regional Officer Workspace (Part 2)

The Regional Officer module manages:
1. **Regional Officer Dashboard**: Real-time KPI cards for assigned cases, awaiting initial scrutiny, correction requests awaiting institution resubmission, cases awaiting re-scrutiny, EVC pipeline, expiring NOCs, and statutory deadlines (< 15 working days).
2. **Application Queue & Scrutiny Management**: Advanced multi-parameter search and filtering by regulatory status, application type, priority, and permanent institutional ID.
3. **Document Scrutiny Studio**: Deep verification of land deeds, municipal sanctioned plans, faculty rosters, and fire safety NOCs with version tracking, officer observations, and deficiency creation.
4. **AI-Assisted Scrutiny Pre-screening**: Assistive optical text extraction (OCR), confidence scoring, citation evidence, and discrepancy flags. *Crucial boundary: AI insights are strictly assistive and never make autonomous approval decisions.*
5. **Finite State Transition Engine**: Enforces strict statutory status vocabulary (`draft`, `submitted`, `under_scrutiny`, `correction_required`, `resubmitted`, `under_re_scrutiny`, `pending_evc`, `evc_scheduled`, `under_next_stage`, `completed`, `rejected`, `withdrawn`). Arbitrary dropdown jumps are blocked.
6. **EVC (Expert Visit Committee) Tracking**: Monitors surprise unannounced visits, regular physical inspections, appointed committee experts, and report submissions.
7. **Compliance & Undertakings Monitor**: Tracks anti-ragging affidavits, structural stability certificates, and upcoming document expirations with escalation flags.
8. **Late Submission & Force Majeure Appeals**: Review of condonation petitions with statutory disclaimers.
9. **Immutable Regulatory Audit Trail**: Complete log of every state transition, scrutiny action, and deficiency logged.

---

## 🛡️ Architecture & Resilient Data Access Layer (Supabase Resilience)

In accordance with architectural directives regarding external database status:
- **Separated Data Access Layer**: The frontend interacts exclusively through the `EduApproveDataService` interface.
- **Mock Data Fallback Provider**: In-memory repository with realistic AICTE institutional data (PIATR Pune, Sahyadri Polytechnic, Marathwada Institute, GIAS Ahmedabad, etc.).
- **Clear Demo / Dev Banner**: A top-level indicator visibly informs officers when mock fallback mode is active.
- **Zero Credential Exposure**: No secrets or service-role keys are exposed in client-side code.

---

## 🚀 Running the Project

### Frontend (React + Vite + TypeScript + Tailwind CSS)

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:3000`.

### Running Frontend Tests (Vitest)

```bash
cd frontend
npm run test
```

### Backend (Python FastAPI)

```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

The FastAPI backend will start at `http://localhost:8000`.

### Running Backend Tests (pytest)

```bash
cd backend
pytest tests/
```

---

## 👥 Teammate Module Interoperability

EduApprove Pro is designed as **one shared platform**:
- **Part 1 (Institution Admin)**: College profile, document upload, and deficiency resubmissions.
- **Part 2 (Regional Officer - Ragini)**: Complete scrutiny desk, EVC appointment, and compliance monitoring.
- **Part 3 (AICTE Senior Authority / Bureau)**: Final approval committee issuance, hearing committee rejections, and national oversight.

The built-in **Role Switcher** in the top navigation bar demonstrates seamless compatibility across all three roles.
