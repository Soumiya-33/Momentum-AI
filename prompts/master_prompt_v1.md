# Momentum AI - Technical Blueprint

## Stack

Frontend
- React
- TypeScript
- Vite

Backend
- Node.js
- Express

AI
- Google Gemini API (@google/genai)

Storage
- Browser Local Storage

Deployment
- Google AI Studio

Version Control
- Git + GitHub

---

## Frontend Architecture

src/
├── pages/
├── components/
├── services/
├── hooks/
├── utils/
└── types/

Responsibilities:

Pages
- Dashboard
- AI Planner
- Rescue Mode
- Reflection

Components
- Task Cards
- Risk Widgets
- Progress Indicators
- Insight Feed

Services
- API communication
- Request handling

State Management
- React useState
- React useEffect

---

## Backend Architecture

server.ts

Responsibilities:

- API Routing
- Gemini Requests
- Retry Logic
- Error Handling
- Fallback Generation

Endpoints

POST /api/plan-task
→ Generate AI roadmap

POST /api/rescue-mode
→ Generate rescue plan

Request Flow

Frontend
↓
Express Route
↓
Gemini API
↓
JSON Response
↓
Frontend Rendering

---

## Data Model

Task

{
  id,
  title,
  description,
  deadline,
  priority,
  estimatedHours,
  category,
  status
}

Status

- Pending
- In Progress
- Completed

---

## AI Architecture

Gemini Used For

1. AI Planner
2. Enhanced Rescue Mode

Prompt
↓
Gemini
↓
Structured JSON
↓
UI Rendering

---

## Local Logic

No Gemini Required

Risk Predictor

Inputs:
- deadline
- priority
- estimatedHours
- activeTasks

Outputs:
- riskScore
- riskLevel
- recommendation

AI Insights Feed

Rules:
- approaching deadline
- overdue task
- high risk task

AI Reflection

Inputs:
- completed tasks
- delayed tasks
- pending tasks

Outputs:
- summary
- strengths
- improvements

---

## Error Handling

Known Errors

429
Rate Limit Exceeded

503
Service Unavailable

UNAVAILABLE
High Demand

Network Failure

Handling Strategy

Gemini Request
↓
Retry (Exponential Backoff)
↓
Retry
↓
Retry
↓
Fallback Mode

Fallback Output

"Cloud AI busy.
Using Smart Fallback Mode."

User never receives a blank response.

---

## Reliability Design

Problem:
Gemini free-tier limits.

Solution:

- Reduce API calls
- Local risk calculation
- Local insights generation
- Local reflection generation
- Gemini reserved for complex planning

Result:

- Faster responses
- Lower quota usage
- Better demo reliability

---

## Future Scope

- Firebase Auth
- Firestore Database
- User Profiles
- Cross-device Sync
- Mobile Version