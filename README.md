# 🚀 Momentum AI

> **Transform deadlines into momentum through AI-powered planning, intelligent prioritization, and productivity coaching.**

![Status](https://img.shields.io/badge/Status-Deployed-success)
![Progress](https://img.shields.io/badge/Progress-Completed-brightgreen)
![Hackathon](https://img.shields.io/badge/Hackathon-Google%20AI%20Build-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)
![Express](https://img.shields.io/badge/Express.js-Backend-black?logo=express)
![Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4)

🌐 **Live Demo:** https://momentum-ai-257250470541.asia-southeast1.run.app/
---

## 📖 Overview

Managing deadlines is more than keeping a checklist—it's about knowing **what to do, when to do it, and how to recover when things don't go as planned.**

Momentum AI is an AI-powered productivity web application that helps students, professionals, and freelancers organize their work through intelligent task planning, deadline risk prediction, and personalized execution strategies.

Unlike traditional to-do applications, Momentum AI doesn't just store tasks—it analyzes them and provides actionable guidance to help users stay productive and avoid last-minute stress.

---

# ✨ Why Momentum AI?

| Problem | Momentum AI Solution |
|----------|----------------------|
| Too many tasks to manage | 🤖 AI Task Planner |
| Unsure what to prioritize | ⚠️ Risk Prediction |
| Falling behind schedule | 🚨 Rescue Battleplan |
| Easily distracted | 🎯 Focus Mode |
| No visibility into progress | 📊 Momentum Snapshot |

---

# 🌟 Key Features

### 🤖 AI Task Planner
Generate structured execution plans using Google's Gemini AI based on task priority, deadline, category, and estimated effort.

---

### ⚠️ Smart Risk Prediction
Identify tasks most likely to miss their deadlines and prioritize them before they become urgent.

---

### 🚨 Rescue Battleplan
Receive practical recovery strategies when deadlines are approaching or tasks become high-risk.

---

### 🎯 Focus Mode
Reduce distractions by highlighting a single priority task and guiding users through focused execution.

---

### 📊 Momentum Snapshot
Track overall productivity with completion statistics and task progress at a glance.

---

### 💾 Local Data Storage
Tasks are stored securely in the user's browser using Local Storage, ensuring privacy without requiring authentication.

---

### 📱 Responsive Interface
Designed to provide a seamless experience across desktop and mobile devices.

---

# 🛠 Tech Stack

| Layer | Technology |
|--------|------------|
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express.js |
| AI | Google Gemini API |
| Storage | Browser Local Storage |
| Deployment | Google AI Studio |
| Version Control | Git & GitHub |

---

# 🏗 System Architecture

```text
                 User
                   │
                   ▼
          React + TypeScript
                   │
           HTTP API Requests
                   │
                   ▼
          Express.js Backend
                   │
        Gemini API Integration
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
 AI Execution Plan      Risk Analysis
        │                     │
        └──────────┬──────────┘
                   ▼
            Browser Interface
```

---

# 🔄 Application Workflow

```text
Create Task
     │
     ▼
Risk Analysis
     │
     ▼
Gemini AI Planning
     │
     ▼
Execution Strategy
     │
     ▼
Task Tracking
     │
     ▼
Momentum Dashboard
```

---

# 💡 Engineering Decisions

Some important design choices made during development:

- Modular React component architecture for maintainability.
- Express.js REST API to separate frontend and AI logic.
- Gemini Flash model selected for lower latency.
- Browser Local Storage used to preserve user privacy.
- Offline fallback when AI services are temporarily unavailable.
- Timeout and retry mechanisms for improved reliability.
- Responsive layout optimized for desktop and mobile devices.

---

# ⚡ Challenges & Solutions

| Challenge | Solution |
|------------|----------|
| Gemini API response delays | Implemented timeout handling and offline fallback |
| Shared test data after deployment | Isolated browser Local Storage for each user |
| High AI response latency | Optimized prompts and switched to Gemini Flash |
| Dashboard becoming cluttered | Redesigned with a cleaner and more focused UI |

---

# 📂 Project Structure

```text
Momentum-AI/
│
├── app/
│   ├── src/
│   ├── server.ts
│   ├── package.json
│   └── ...
│
├── docs/
│   ├── project-summary.md
│   └── ai-development-log.md
│
├── README.md
└── .gitignore
```

# 🌍 Project Impact

Momentum AI helps users transition from reactive task management to proactive planning. By combining AI-powered guidance, deadline risk analysis, and productivity-focused design, it empowers users to organize their work more effectively, reduce last-minute stress, and build consistent work habits.

---

# 📸 Screenshots



### Dashboard

![alt text](<Screenshot 2026-06-30 145729.png>)

### AI Planner

![alt text](<Screenshot 2026-06-30 145959.png>)

### Focus Mode


![alt text](<Screenshot 2026-06-30 145927.png>)

---

# 🙏 Acknowledgements

Built as part of the **VIBE2SKILL**, leveraging **Google AI Studio** and the **Gemini API** for intelligent task planning and productivity assistance.

---

## ⭐ If you found this project interesting, consider giving it a star!