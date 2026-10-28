# CareerLens AI — Intelligent Resume & Job Match Analyzer

CareerLens AI is an advanced ATS (Applicant Tracking System) intelligence and resume benchmarking platform. It integrates **real server-side LLM analysis** (Google Gemini & OpenAI) alongside a high-performance **offline heuristic fallback engine**.

---

## 🚀 Key Features

- **Real LLM-Powered Analysis**: Deep semantic matching evaluating candidate depth of experience, technical competency overlap, ATS keyword density, and leadership context.
- **Strict Server-Side Security**: Secret API keys (`GEMINI_API_KEY` / `OPENAI_API_KEY`) remain strictly on the server side. Never exposed in HTML, client JavaScript, network payloads, or Git.
- **Constrained JSON Schema Output**: Server enforces structured JSON responses containing:
  - `matchScore`: 0–100 compatibility score
  - `matchedSkills`: Competencies verified in both resume and job listing
  - `missingSkills`: Critical screening gaps with priority classifications
  - `strengths`: Candidate's top competitive advantages
  - `weaknesses`: Screening flags and vulnerabilities
  - `recommendations`: Step-by-step resume optimization roadmap
  - `interviewQuestions`: Custom interview questions with STAR talking points and model answers
- **Safe DOM Rendering (Anti-XSS)**: All model outputs are validated and injected via standard DOM APIs (`textContent` and `createElement`), completely immune to script injection or malicious text in model completions.
- **Built-in Resilience & Fallback**:
  - Live API status checks (`GET /api/status`)
  - 40-second timeout handling with `AbortController`
  - Inline error dialogs with **Retry** and **Instant Offline Baseline Fallback**
  - Works 100% offline using the built-in rule-based engine when credentials or internet are absent
- **Input Bounds Validation**:
  - Minimum 15 words for resume and job description
  - Maximum 40,000 characters to prevent token overflow and DoS attacks

---

## 📋 Prerequisites

- **Node.js**: Version 18.0.0 or higher (v20+ or v22+ recommended).
- **Zero external dependencies required**: Built using native Node.js HTTP, Fetch, and AbortController.

---

## ⚙️ Configuration & Environment Secrets

### 1. Create your `.env` file
Copy the provided `.env.example` template:

```bash
cp .env.example .env
```

*(On Windows PowerShell: `Copy-Item .env.example .env`)*

### 2. Configure Environment Variables
Open `.env` and set your preferred AI provider credentials:

```env
# ==============================================================================
# CareerLens AI - Server Environment Secrets
# Never commit this file to version control.
# ==============================================================================

# Server Port (Default: 3000)
PORT=3000

# Primary Provider: Google Gemini API (Recommended)
# Obtain a free key at: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-1.5-flash

# Optional Alternative: OpenAI API
# If OPENAI_API_KEY is configured and GEMINI_API_KEY is unset, OpenAI is used.
# OPENAI_API_KEY=your_openai_api_key_here
# OPENAI_MODEL=gpt-4o-mini

# Request timeout in milliseconds (Default: 45000)
AI_TIMEOUT_MS=45000
```

> **Security Note:** `.env` is listed in `.gitignore` and is explicitly blocked from being served over HTTP by the server (`403 Forbidden`).

---

## 🏃 Running the Application

### Start the Local Server
```bash
npm start
# or: node server.js
```

Then open your browser at:
```
http://localhost:3000
```

### Run Integration Tests
To verify API endpoints, bounds checking, schema normalization, and error handling:

```bash
npm test
```

---

## 🧪 Verifying the Integration

1. **When API Key is Pending / Unconfigured**:
   - The top navbar displays `⚡ Baseline (AI Key Pending)`.
   - Selecting **Real AI (LLM)** and clicking **Analyze Resume Match** gracefully halts at the scanner modal with:
     > **AI Provider Not Configured**
     > *No AI API key is configured on the server. Please set GEMINI_API_KEY in your server environment (.env). You can run the offline baseline analyzer right now.*
   - Clicking **Run Baseline Fallback** immediately executes the local heuristic analyzer without errors.

2. **When API Key is Configured in `.env`**:
   - Restart the server (`node server.js`).
   - The top navbar automatically detects credentials and displays `✨ AI Active (GEMINI)`.
   - Clicking **Analyze Resume Match** sends the request through `POST /api/analyze`, validates the JSON schema from the model, and displays `✨ Real GEMINI AI Analysis` on the results dashboard.

---

## ☁️ Deployment Guide

### Option 1: Vercel (Serverless)
The serverless endpoint is pre-configured in `api/analyze.js`.
1. Push the repository to GitHub (remember `.env` is ignored).
2. Import the project into Vercel.
3. In **Settings -> Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key
   - `GEMINI_MODEL`: `gemini-1.5-flash`
4. Deploy! Vercel will automatically serve static files from the root and expose `/api/analyze` as a serverless function.

### Option 2: Render / Railway / DigitalOcean (Node.js Container)
1. Set the build command: (empty or `npm test`)
2. Set the start command: `node server.js`
3. Add environment secret: `GEMINI_API_KEY = your_api_key`
4. Set port to `PORT = 3000` (or leave default assigned by platform).

### Option 3: Netlify
1. Connect repository.
2. Set build command: `#` (static site)
3. For serverless functions, configure Netlify Functions to wrap `api/analyze.js`.
4. Configure `GEMINI_API_KEY` under **Site Settings -> Environment Variables**.

---

## 🛡️ Architecture & Security Safeguards

```
+-------------------------------------------------------------+
| Browser Client (Vanilla JS / HTML5 / CSS3)                  |
| - Zero API keys stored in client memory or bundle           |
| - Safe DOM rendering: textContent everywhere                |
| - Local Baseline Heuristic Engine (Offline Fallback)        |
+-------------------------------------------------------------+
                              |
                     POST /api/analyze
            (No secrets in transit from client)
                              |
                              v
+-------------------------------------------------------------+
| Node.js Server / Serverless Endpoint (server.js)            |
| - Loaded from server-side process.env only                  |
| - Request bounds validation (min 15 words, max 40k chars)   |
| - 40s timeout with AbortController                         |
| - Schema-constrained JSON response validation               |
| - Traversal protection: blocks .env and system paths        |
+-------------------------------------------------------------+
                              |
                Secure Server-to-Server HTTPS
                              |
                              v
+-------------------------------------------------------------+
| AI Service (Google Gemini 1.5 Flash / OpenAI)               |
| - Strict JSON Schema response enforcement                   |
+-------------------------------------------------------------+
```

---

## 📄 License
MIT License. Open-source client-side and server-side architecture.
