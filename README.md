# Project Submission Portal — ML‑Assisted Evaluation

A full‑stack web application that streamlines how students **submit** academic projects and how faculty **evaluate** them, with help from an AI text‑analysis component.

| Layer      | Technology                                                                                |
|------------|-------------------------------------------------------------------------------------------|
| **Backend**| Python · Django 5 · Django REST Framework · PynamoDB (AWS DynamoDB) · Google Gemini (AI)    |
| **Frontend**| React (Vite) · Bootstrap · Axios                                                          |
| **Auth**   | AWS Cognito (JWT) → *Session + OAuth2 branch in progress*                                  |
| **Storage**| Local FileSystem (default) ➜ optional AWS S3                                              |
| **Infra**  | AWS SES (email) · SNS (critical‑error alerts) · DynamoDB tables auto‑provisioned           |

> **New in v0.6 (2025‑07‑09)** — default file handling has been switched to **local storage** because of an S3 outage.
> S3 variables are still present but commented out so you can turn them back on later.

---

### Contents
1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Local Dev Workflow](#local-dev-workflow)
4. [Environment Variables](#environment-variables)
5. [Architecture Diagram](#architecture-diagram)
6. [REST API Glance](#rest-api-glance)

### Features
* **Student / Faculty dashboards** with role‑based routes.
* **Project & Rubric builder** — faculty define criteria, weights, deadlines.
* Up to **3 resubmissions** per student, version‑tracked.
* PDF **text extraction** → AI rubric‑aligned auto‑scoring (Gemini 1.5 Flash).
* **Weighted final score** = `manual*(1‑w) + AI*w` (w from `.env`, default 0.30).
* **Real‑time leaderboard** and email notifications (SES).
* **Error tracker** posts critical logs to an SNS topic.
* **Light/Dark mode** preserved in localStorage.

### Quick Start
```bash
# Linux / macOS
./setup.sh
# Windows (PowerShell)
.\setup.ps1
# Windows (CMD)
setup.bat
```

### Local Dev Workflow
1. **Backend**
   ```bash
   cd BackEnd && source .venv/bin/activate
   python manage.py runserver
   ```
2. **Frontend**
   ```bash
   cd FrontEnd
   npm run dev
   ```
3. App runs at **http://localhost:5173** (proxying API to `127.0.0.1:8000`).

### Environment Variables
| Key | Default | Purpose |
|-----|---------|---------|
| `USE_LOCAL_FILE_STORAGE` | `true` | If `false`, Django uses S3 storage backend. |
| `MEDIA_ROOT` | `<repo>/BackEnd/media/` | Where uploaded files are stored locally. |
| `ML_SCORE_WEIGHT` | `0.30` | Weight of AI score in final grade. |
| *AWS keys* | *(commented)* | Uncomment to re‑enable Cognito / S3 / SES. |

### Architecture Diagram
```text
React UI  ⇄  DRF API  ⇄  DynamoDB
            ↳ local FileSystem (PDFs, ZIPs)
            ↳ Gemini AI (auto‑score)
            ↳ SES / SNS (emails, alerts)
```

### REST API Glance (URLs start with `/api/`)
* `projects/`, `projects/<id>/`
* `submissions/`, `submissions/<id>/`
* `projects/<id>/rubrics/`
* `submissions/<id>/evaluations/`
* `submissions/<id>/trigger_ai_evaluation/`
* `leaderboard/`
* `profiles/<username>/`

See the backend `Proj/urls.py` for the authoritative map.

---

© 2025 Project Flow Team. Licensed under MIT.
