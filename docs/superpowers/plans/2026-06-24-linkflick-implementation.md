# LinkFlick Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished LinkFlick web app that generates affiliate short assets from any product URL and exposes server-side OpenAI video generation routes.

**Architecture:** Use React + Vite for the frontend and a small Express API server for OpenAI calls. Keep shared deterministic helpers in `src/lib/linkflick.js` so both tests and UI can use the same URL normalization, fallback brief, and prompt-generation logic.

**Tech Stack:** React, Vite, Express, OpenAI SDK, Zod, Vitest, ESLint, Lucide React.

---

### Task 1: Project Scaffold And Tests

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.js`
- Create: `eslint.config.js`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `tests/linkflick.test.js`

- [x] **Step 1: Create package and tool config**
- [x] **Step 2: Add tests for shared helper behavior before implementation**
- [x] **Step 3: Run tests and confirm they fail because helpers are missing**

### Task 2: Shared LinkFlick Logic

**Files:**
- Create: `src/lib/linkflick.js`

- [x] **Step 1: Implement URL normalization and product-name inference**
- [x] **Step 2: Implement fallback brief and Sora prompt builder**
- [x] **Step 3: Run tests and confirm they pass**

### Task 3: Server OpenAI Routes

**Files:**
- Create: `server/index.js`
- Create: `server/openaiRoutes.js`

- [x] **Step 1: Add `POST /api/generate-brief` with demo fallback and OpenAI structured output path**
- [x] **Step 2: Add `POST /api/videos`, `GET /api/videos/:id`, and `GET /api/videos/:id/content`**
- [x] **Step 3: Keep API key server-only via `.env`**

### Task 4: React Product UI

**Files:**
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles.css`
- Create: `src/data/content.js`

- [x] **Step 1: Build Ssemble-inspired LinkFlick landing/tool page**
- [x] **Step 2: Wire local generation fallback and API generation call**
- [x] **Step 3: Add video job request and polling UI**

### Task 5: Verification

**Files:**
- Modify as needed based on verification output.

- [x] **Step 1: Run `npm test`**
- [x] **Step 2: Run `npm run lint`**
- [x] **Step 3: Run `npm run build`**
- [x] **Step 4: Start dev server and verify desktop/mobile UI in browser**
