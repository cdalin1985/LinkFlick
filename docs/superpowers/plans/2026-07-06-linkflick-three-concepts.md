# LinkFlick Three-Concept Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace LinkFlick's selected-angle brief with one generation that returns and displays three complete, contrasting affiliate-short concepts.

**Architecture:** Keep shared product metadata at the brief level and introduce an exact three-item `concepts` array. Generate the array in both OpenAI and deterministic fallback paths, normalize legacy payloads at the client boundary, render one self-contained card per concept, and track video jobs by concept ID.

**Tech Stack:** React, Vite, JavaScript, Zod, OpenAI Responses API, Vitest, CSS.

---

## File Structure

- `src/lib/linkflick.js`: Defines fallback concepts, video prompts, and legacy brief normalization.
- `server/linkflickApi.js`: Defines the API request/response schema and generation prompt.
- `src/App.jsx`: Owns generation state, concept-specific video state, and the three-card result UI.
- `src/styles.css`: Styles the responsive concept grid and card sections.
- `tests/linkflick.test.js`: Covers fallback and normalization behavior.
- `tests/linkflickApi.test.js`: Covers the server contract and demo response.

### Task 1: Define and test the three-concept client contract

**Files:**
- Modify: `tests/linkflick.test.js`
- Modify: `src/lib/linkflick.js`

- [ ] **Step 1: Write failing fallback and compatibility tests**

Add imports and assertions equivalent to:

```js
import {
  buildFallbackBrief,
  normalizeGeneratedBrief
} from "../src/lib/linkflick.js";

it("builds exactly three complete and distinct fallback concepts", () => {
  const brief = buildFallbackBrief({
    productUrl: "https://shop.example.com/products/desk-walking-pad",
    tone: "Punchy"
  });

  expect(brief.concepts).toHaveLength(3);
  expect(new Set(brief.concepts.map((concept) => concept.angle)).size).toBe(3);

  for (const concept of brief.concepts) {
    expect(concept.id).toBeTruthy();
    expect(concept.hook).toBeTruthy();
    expect(concept.script.lines.length).toBeGreaterThanOrEqual(3);
    expect(concept.caption).toBeTruthy();
    expect(concept.hashtags.length).toBeGreaterThanOrEqual(4);
    expect(concept.videoPrompt).toContain(brief.productName);
  }
});

it("normalizes a legacy single brief into three usable concepts", () => {
  const normalized = normalizeGeneratedBrief({
    productName: "Desk Walking Pad",
    tone: "Punchy",
    hooks: ["Hook one", "Hook two", "Hook three"],
    scripts: [
      { title: "One", duration: "30s", lines: ["A", "B", "C"], shotList: ["1", "2", "3", "4"], cta: "Go" }
    ],
    captions: ["Caption one"],
    hashtags: ["#AffiliateFinds"],
    videoPrompt: "Legacy prompt"
  });

  expect(normalized.concepts).toHaveLength(3);
  expect(normalized.concepts[0].hook).toBe("Hook one");
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- tests/linkflick.test.js`

Expected: FAIL because `normalizeGeneratedBrief` and the `concepts` contract do not exist.

- [ ] **Step 3: Implement fallback concepts and normalization**

Replace the single-angle fallback fields with three concept builders:

```js
const fallbackDirections = [
  { id: "problem-solution", angle: "Problem → Solution" },
  { id: "honest-review", angle: "Honest Review" },
  { id: "lifestyle-payoff", angle: "Lifestyle Payoff" }
];

export function normalizeGeneratedBrief(brief) {
  if (Array.isArray(brief?.concepts) && brief.concepts.length === 3) {
    return brief;
  }

  const hooks = brief?.hooks || [];
  const scripts = brief?.scripts || [];
  const captions = brief?.captions || [];

  return {
    ...brief,
    concepts: fallbackDirections.map((direction, index) => ({
      ...direction,
      hook: hooks[index] || hooks[0] || "A practical product worth a closer look.",
      script: scripts[index] || scripts[0] || {
        title: direction.angle,
        duration: "35s",
        lines: ["Show the problem.", "Demonstrate the product.", "Close with a clear CTA."],
        shotList: ["Problem", "Reveal", "Demo", "CTA"],
        cta: "Check the link for details."
      },
      caption: captions[index] || captions[0] || "",
      hashtags: brief?.hashtags || [],
      videoPrompt: brief?.videoPrompt || buildVideoPrompt({
        productName: brief?.productName,
        angle: direction.angle,
        tone: brief?.tone,
        hook: hooks[index] || hooks[0]
      })
    }))
  };
}
```

Build each deterministic concept with its own hook, script, caption, hashtag set, and `buildVideoPrompt` call. Preserve shared `productUrl`, `productName`, `productContext`, `audience`, and `tone`.

- [ ] **Step 4: Run the focused test and verify success**

Run: `npm test -- tests/linkflick.test.js`

Expected: PASS.

### Task 2: Change the server response to exactly three concepts

**Files:**
- Modify: `tests/linkflickApi.test.js`
- Modify: `server/linkflickApi.js`

- [ ] **Step 1: Write failing API contract tests**

Extend the demo assertion:

```js
expect(result.body.concepts).toHaveLength(3);
expect(new Set(result.body.concepts.map((concept) => concept.angle)).size).toBe(3);
expect(result.body.concepts.every((concept) => concept.videoPrompt)).toBe(true);
```

Add a test for exported prompt guidance:

```js
expect(buildGenerationPrompt({
  normalizedUrl: "https://shop.example.com/products/luma-bottle",
  tone: "Trustworthy",
  productContext: {}
})).toContain("exactly three");
```

- [ ] **Step 2: Run the API test and verify failure**

Run: `npm test -- tests/linkflickApi.test.js`

Expected: FAIL because the response still exposes one angle and shared asset arrays.

- [ ] **Step 3: Replace the Zod schema and prompt**

Define:

```js
const ScriptSchema = z.object({
  title: z.string(),
  duration: z.string(),
  lines: z.array(z.string()).min(3).max(6),
  shotList: z.array(z.string()).min(4).max(7),
  cta: z.string()
});

const ConceptSchema = z.object({
  id: z.string(),
  angle: z.string(),
  hook: z.string(),
  script: ScriptSchema,
  caption: z.string(),
  hashtags: z.array(z.string()).min(4).max(10),
  videoPrompt: z.string()
});

const GeneratedBriefSchema = z.object({
  productName: z.string(),
  audience: z.string(),
  tone: z.string(),
  concepts: z.array(ConceptSchema).length(3)
});
```

Remove `angle` from `BriefRequestSchema`. Export a `buildGenerationPrompt` helper that includes:

```js
[
  `Affiliate product URL: ${normalizedUrl}`,
  `Tone: ${tone}`,
  buildProductContextPrompt(productContext),
  "Return exactly three complete concepts with meaningfully different selling strategies.",
  "Each concept needs an angle label, hook, 30-45 second script, caption, hashtags, and a Sora-ready 9:16 video prompt.",
  "Do not return three rewrites of the same mechanism."
].filter(Boolean).join("\n");
```

- [ ] **Step 4: Run the API tests and verify success**

Run: `npm test -- tests/linkflickApi.test.js`

Expected: PASS.

### Task 3: Replace selected-angle UI state with concept state

**Files:**
- Modify: `src/App.jsx`

- [ ] **Step 1: Normalize every incoming brief**

Import `normalizeGeneratedBrief`, remove `defaultAngles`, `angle`, `activeTab`, and `selectedScript`, and initialize with:

```js
const defaultBrief = normalizeGeneratedBrief(buildFallbackBrief({
  productUrl: sampleProductUrl,
  tone: "Punchy"
}));
```

Send only `{ productUrl: normalizedUrl, tone }` to `/api/generate-brief`, and call `setBrief(normalizeGeneratedBrief(payload))`.

- [ ] **Step 2: Track video jobs by concept**

Replace scalar video state with:

```js
const [videoJobs, setVideoJobs] = useState({});
const [loadingConceptId, setLoadingConceptId] = useState("");
```

Update `handleVideoJob(concept)` and `pollVideoJob(conceptId, jobId)` so state updates use:

```js
setVideoJobs((current) => ({
  ...current,
  [conceptId]: payload
}));
```

- [ ] **Step 3: Render three complete concept cards**

Replace `AssetContent` and the single `ShortPreview` with:

```jsx
<div className="concept-grid">
  {brief.concepts.map((concept, index) => (
    <ConceptCard
      key={concept.id}
      concept={concept}
      productName={brief.productName}
      productContext={brief.productContext}
      accentIndex={index}
      videoJob={videoJobs[concept.id]}
      isVideoLoading={loadingConceptId === concept.id}
      onVideoJob={() => handleVideoJob(concept)}
    />
  ))}
</div>
```

`ConceptCard` visibly renders:

```jsx
<article className={`concept-card accent-${accentIndex + 1}`}>
  <header>
    <span>{concept.angle}</span>
    <button type="button" onClick={() => copyConcept(concept)}><Copy size={14} />Copy all</button>
  </header>
  <h3>{concept.hook}</h3>
  <ConceptSection label="Script" copyText={concept.script.lines.join("\n")}>
    {concept.script.lines.map((line) => <p key={line}>{line}</p>)}
  </ConceptSection>
  <ConceptSection label="Caption" copyText={concept.caption}><p>{concept.caption}</p></ConceptSection>
  <ConceptSection label="Hashtags" copyText={concept.hashtags.join(" ")}><p>{concept.hashtags.join(" ")}</p></ConceptSection>
  <ConceptSection label="Video prompt" copyText={concept.videoPrompt}><p>{concept.videoPrompt}</p></ConceptSection>
  <button type="button" onClick={onVideoJob}>Create OpenAI Video Job</button>
  <p className={videoJob?.error ? "video-status error" : "video-status"}>
    {videoJob?.error || (videoJob ? `Video job: ${videoJob.status || "queued"}` : "Ready to send prompt")}
  </p>
  {videoJob?.status === "completed" && videoJob.id ? (
    <video src={`/api/videos/${videoJob.id}/content`} controls playsInline />
  ) : null}
</article>
```

`ConceptSection` includes a copy button that calls `navigator.clipboard.writeText(copyText)`. Use the same API with a joined plain-text representation for copy-all. Keep product intelligence shared above the grid.

- [ ] **Step 4: Update counts and marketing copy**

Change campaign meters to count three concepts and their contained assets. Update hero/status text from a single pitch to “three creative directions.” Remove the angle segmented control while keeping tone.

### Task 4: Style the responsive three-card result

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Add desktop card-grid styles**

Add:

```css
.concept-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.concept-card {
  min-width: 0;
  border: 1px solid var(--line);
  border-top-width: 5px;
  border-radius: 22px;
  background: #fff;
  padding: 20px;
}

.concept-card.accent-1 { border-top-color: var(--coral); }
.concept-card.accent-2 { border-top-color: var(--lime); }
.concept-card.accent-3 { border-top-color: var(--cyan); }

.concept-section {
  border-top: 1px solid var(--line);
  padding: 16px 0;
}
```

- [ ] **Step 2: Add narrow-screen behavior**

At the existing tablet/mobile breakpoints, switch `.concept-grid` to one column, remove fixed content heights, and keep all card text readable without horizontal scrolling.

- [ ] **Step 3: Remove obsolete global-tab and single-preview rules only when unused**

Delete selectors that apply solely to `.tabs`, `.asset-panel`, and `.short-preview` after confirming no remaining JSX uses them. Preserve unrelated product-intelligence and marketing-page styles.

### Task 5: Verify the complete feature

**Files:**
- Verify: `src/lib/linkflick.js`
- Verify: `server/linkflickApi.js`
- Verify: `src/App.jsx`
- Verify: `src/styles.css`
- Verify: `tests/linkflick.test.js`
- Verify: `tests/linkflickApi.test.js`

- [ ] **Step 1: Run all unit tests**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0 with no ESLint errors.

- [ ] **Step 3: Build production assets**

Run: `npm run build`

Expected: Vite production build completes successfully.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check && git diff --stat`

Expected: no whitespace errors; changes remain limited to the brief contract, tests, result UI, styles, and supporting docs.
