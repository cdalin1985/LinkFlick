# LinkFlick Design Spec

## Goal

Build LinkFlick, a Ssemble-inspired but original SaaS web app that turns any affiliate product URL into short-form affiliate marketing assets.

## Product Direction

LinkFlick uses the familiar clean SaaS structure of Ssemble: a focused hero, one central conversion input, product preview, how-it-works flow, examples, pricing, FAQ, and final CTA. The product itself is different: instead of clipping source videos, it accepts any affiliate product URL and generates hooks, 30-45 second scripts, captions, hashtags, and an OpenAI/Sora-ready video prompt.

## Brand And Style

- Brand name: LinkFlick.
- Tone: clean SaaS with a small creator-commerce spark.
- Palette: white base, near-black text, crisp borders, accents in coral, lime, and cyan.
- Typography: polished modern sans-serif with deliberate UI text sizing.
- Components: quiet header, large headline, central URL input, generated result panels, vertical short preview, simple pricing cards, FAQ rows.
- Avoid: Ssemble branding, copied copy, purple gradients, bokeh/orbs, fake metrics, crowded dashboards, hero eyebrow labels, third-party marketplace logos.

## Core Workflow

1. User pastes any affiliate product URL.
2. User optionally chooses selling angle and tone.
3. App generates hooks, scripts, captions, hashtags, and a Sora video prompt.
4. User can request an OpenAI video job from the generated prompt.
5. If no API key or server is unavailable, the UI remains usable with a clearly labeled demo fallback.

## OpenAI Integration

The browser never receives `OPENAI_API_KEY`. Server routes handle OpenAI calls:

- `POST /api/generate-brief`: creates structured affiliate short assets.
- `POST /api/videos`: creates a video generation job from the selected prompt.
- `GET /api/videos/:id`: polls video job status.
- `GET /api/videos/:id/content`: proxies generated video content after completion.

The video layer is isolated because OpenAI's current Videos API is scheduled for deprecation on September 24, 2026.

## Acceptance Criteria

- React/Vite app runs locally.
- Server-side OpenAI routes are present and documented.
- The first viewport includes LinkFlick branding, nav, hero headline, affiliate URL input, Generate Shorts CTA, and a live app preview.
- Page includes how it works, features, example shorts, pricing, FAQ, and final CTA.
- Core generation flow works in demo mode without an API key.
- Tests cover URL normalization, product-name inference, fallback brief structure, and video prompt construction.
- Build and tests pass before handoff.
