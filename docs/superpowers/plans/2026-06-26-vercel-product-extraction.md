# LinkFlick Vercel Deploy And Product Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make LinkFlick production-ready on Vercel and improve generation context by extracting product metadata from pasted URLs.

**Architecture:** Move API behavior into reusable request handlers that can be called by both local Express routes and Vercel serverless functions. Add deterministic product metadata extraction helpers that parse Open Graph, JSON-LD Product data, and URL fallback data before copy generation.

**Tech Stack:** React, Vite, Express for local dev, Vercel serverless functions, OpenAI SDK, Zod, Vitest.

---

### Task 1: Product Metadata Helpers

**Files:**
- Modify: `src/lib/linkflick.js`
- Modify: `tests/linkflick.test.js`

- [x] **Step 1: Add failing tests for product metadata extraction**
- [x] **Step 2: Implement Open Graph and JSON-LD product parsing**
- [x] **Step 3: Use extracted title/description in fallback briefs**
- [x] **Step 4: Run `npm test` and verify the tests pass**

### Task 2: Shared API Handlers

**Files:**
- Create: `server/linkflickApi.js`
- Modify: `server/openaiRoutes.js`
- Create: `api/generate-brief.js`
- Create: `api/videos.js`
- Create: `api/videos/[id].js`
- Create: `api/videos/[id]/content.js`

- [x] **Step 1: Move generation and video logic into reusable handler functions**
- [x] **Step 2: Keep local Express routes as thin adapters**
- [x] **Step 3: Add Vercel serverless API entrypoints**
- [x] **Step 4: Run local API smoke tests**

### Task 3: Deploy

**Files:**
- Modify: `.gitignore`
- Commit and push all deployment-readiness changes.

- [x] **Step 1: Verify `npm test`, `npm run lint`, and `npm run build`**
- [x] **Step 2: Commit and push changes to `main`**
- [x] **Step 3: Deploy production on Vercel**
- [x] **Step 4: Verify live app, live generation route, and video setup/job behavior**

**Completion evidence, June 26, 2026:**
- `npm test`: 2 test files passed, 8 tests passed.
- `npm run lint`: completed with no ESLint errors.
- `npm run build`: Vite production build completed successfully.
- GitHub `main`: deployment-readiness changes and this plan update were pushed.
- Vercel production: `https://linkflick.vercel.app` inspected as ready with all API functions present.
- Live generation route: `POST /api/generate-brief` returned OpenAI-generated product assets from a pasted product URL.
- Live video route: `POST /api/videos` validation returned `400` with `{"error":"A video prompt is required."}` without creating a billable video job.
