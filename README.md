# LinkFlick

LinkFlick is a Ssemble-inspired affiliate marketing short generator. Paste any affiliate product URL and the app generates hooks, scripts, captions, hashtags, and an OpenAI video-generation prompt.

## Run Locally

```bash
npm install
npm run dev:full
```

The frontend runs at `http://127.0.0.1:5173` and proxies API requests to the local Express server on `http://127.0.0.1:8877`.

## OpenAI Setup

Create `.env` from `.env.example` and set:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_SCRIPT_MODEL=gpt-5.5
OPENAI_VIDEO_MODEL=sora-2
OPENAI_VIDEO_SIZE=720x1280
OPENAI_VIDEO_SECONDS=8
PORT=8877
```

Without `OPENAI_API_KEY`, copy generation falls back to deterministic demo mode and video generation shows setup guidance.

## API Routes

- `POST /api/generate-brief`
- `POST /api/videos`
- `GET /api/videos/:id`
- `GET /api/videos/:id/content`

## Verification

```bash
npm test
npm run lint
npm run build
```
