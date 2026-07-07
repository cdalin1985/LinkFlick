# LinkFlick Vercel Serverless Design

## Goal

Make LinkFlick deployable through Vercel Git integration without a persistent
Express server. Brief generation and video-job operations must work through
Vercel Node.js functions in local development, Preview deployments, and
Production deployments while preserving the frontend's existing `/api` URLs.

## Scope

This migration covers:

- brief generation at `POST /api/generate-brief`;
- video-job creation at `POST /api/videos`;
- video-job polling at `GET /api/videos/:id`;
- generated-video download at `GET /api/videos/:id/content`;
- local, Preview, and Production environment handling;
- repository configuration and documentation for Vercel Git deployments.

It does not change the LinkFlick interface, generated content, product metadata
extraction, OpenAI prompt design, or video polling behavior.

## Architecture

LinkFlick will use Vite for the React build and Vercel Node.js functions for
server-side work. The Express application, router, CORS middleware, and local
API process will be removed.

The four files under `api/` remain the public serverless entrypoints. They call
a framework-neutral service module containing validation, OpenAI calls, product
context retrieval, fallback generation, and result formatting. A small shared
HTTP adapter translates Vercel request and response objects into that service
contract, centralizing method validation and response headers instead of
duplicating them across endpoints.

The browser continues to call same-origin `/api` paths, so Preview and
Production deployments need no CORS configuration or environment-specific API
base URL.

## Components

### Serverless entrypoints

Each entrypoint declares its allowed HTTP method, reads the relevant request
body or route parameter, invokes one service handler, and sends the returned
status, headers, and body through the shared HTTP adapter.

Unsupported methods return `405`, include the appropriate `Allow` header, and
return a JSON error. Missing or malformed route input is handled as a client
error rather than producing an unhandled function failure.

### Shared API service

The existing LinkFlick service behavior remains independent of Express and
Vercel. It reads server-only environment variables at request time, sanitizes
their values, validates inputs, calls OpenAI, and returns transport-neutral
result objects.

OpenAI credentials are never exposed through `VITE_` variables or included in
the frontend bundle.

### Local development

`npm run dev` starts `vercel dev`, which serves both the Vite application and
the serverless functions using the same routing model as deployed
environments. A separate frontend-only script remains available for UI work
that does not require API routes.

Local server secrets live in `.env.local`, which stays ignored. The checked-in
`.env.example` documents every supported variable without containing secret
values.

### Deployment configuration

`vercel.json` explicitly identifies the Vite framework, production build
command, `dist` output directory, and Node function duration/memory settings
needed by brief generation and video operations. It does not contain project
IDs, team IDs, tokens, or environment secrets.

Vercel Git integration creates Preview deployments for non-production branches
and Production deployments from the configured production branch. The README
documents adding the same server-only variables to Vercel's Development,
Preview, and Production scopes.

## Data Flow

1. The browser sends a same-origin request to an `/api` route.
2. Vercel invokes the matching Node.js function.
3. The HTTP adapter checks the method and extracts the body or dynamic route
   parameter.
4. The shared service validates the input and reads sanitized environment
   settings.
5. The service either returns deterministic demo brief data or calls the
   relevant OpenAI endpoint.
6. The adapter copies the service status, headers, and body to the Vercel
   response.
7. The existing frontend consumes the unchanged response shape.

Generated video bytes are returned as a binary response with the upstream
content type. The function does not write temporary state to disk.

## Environment Contract

The server supports:

- `OPENAI_API_KEY`: required for real brief and video generation;
- `OPENAI_SCRIPT_MODEL`: model used for structured brief generation;
- `OPENAI_VIDEO_MODEL`: model used to create video jobs;
- `OPENAI_VIDEO_SIZE`: requested video dimensions;
- `OPENAI_VIDEO_SECONDS`: requested video duration;
- `LINKFLICK_DEMO_MODE`: when `true`, forces deterministic brief generation.

`PORT` is removed because Vercel owns the HTTP listener. Defaults remain in the
service layer so missing optional settings do not break a deployment.

## Error Handling

Client mistakes return `400` with a stable JSON `{ "error": "..." }` shape.
Unsupported methods return `405`. Upstream OpenAI or product-page failures are
converted to controlled responses using the current service behavior.

No response returns the OpenAI API key or a complete environment dump. Binary
video responses preserve their content type; JSON errors remain JSON even on
video-content routes.

## Testing

Implementation follows test-first development:

- adapter tests cover allowed methods, `405` responses, `Allow` headers,
  request forwarding, route parameters, JSON bodies, and binary headers;
- service tests continue to cover environment sanitization, demo behavior,
  product-context fallback, and prompt formatting;
- configuration assertions verify that Express dependencies and obsolete
  scripts are gone and required Vercel settings are present;
- the full Vitest suite, ESLint, Vite production build, and `vercel build` must
  pass before completion.

The endpoint URLs and response shapes are compatibility requirements. Existing
frontend tests must remain green without changes made solely to accommodate a
new API contract.

## Deployment and Verification

Git integration is the deployment mechanism; no custom GitHub Actions workflow
is added. A non-production branch push creates a Preview deployment, while a
merge or push to the configured production branch creates Production.

Verification consists of:

1. running the local automated checks;
2. producing a local Vercel build;
3. confirming the build contains the Vite site and all four functions;
4. exercising brief-generation validation without incurring OpenAI usage;
5. exercising video-job validation without creating a billable video job.

An authenticated live deployment is outside local source conversion unless the
user separately requests deployment.

## Non-Goals

- adding a database or durable job store;
- adding authentication, billing, or rate limiting;
- changing product scraping or generated marketing content;
- redesigning the frontend;
- creating custom CI/CD beyond Vercel Git integration.
