# LinkFlick Three-Concept Generation Design

## Goal

Upgrade LinkFlick so one pasted affiliate URL produces three complete, deliberately contrasting short-form campaign concepts in one generation. The result replaces the current single selected-angle workflow.

## Product Experience

1. The user pastes an affiliate product URL.
2. The user may choose a tone, but no longer chooses one selling angle.
3. LinkFlick extracts available product context and makes one brief-generation request.
4. The response contains exactly three concepts with distinct selling strategies.
5. The UI presents the three concepts side by side on desktop and in a readable single-column stack on smaller screens.

Each concept visibly includes:

- Selling-angle label
- Hook
- 30–45 second script
- Caption
- Hashtags
- Sora-ready 9:16 video prompt
- Per-field copy controls and a copy-all action
- Its own video-generation action using that concept's prompt

## Generation Contract

The brief response keeps shared product metadata at the top level and replaces the shared asset arrays with:

```json
{
  "productName": "Example Product",
  "productContext": {},
  "tone": "Trustworthy",
  "concepts": [
    {
      "id": "problem-solution",
      "angle": "Problem → Solution",
      "hook": "The tiny upgrade that fixes disappointing travel coffee.",
      "script": {
        "title": "Better Coffee Anywhere",
        "duration": "35 sec",
        "lines": ["Open on the familiar frustration.", "Reveal the product and demonstrate the payoff."],
        "shotList": ["Problem close-up", "Product reveal", "Use-case demo", "CTA frame"]
      },
      "caption": "A better cup without packing the whole kitchen.",
      "hashtags": ["#example"],
      "videoPrompt": "Create a vertical 9:16 creator-style product demonstration with natural light."
    }
  ]
}
```

The server schema requires exactly three concepts. Prompt instructions require meaningfully different mechanisms, not three rewrites of the same idea. The default trio should cover contrasting strategies such as problem/solution, honest review or proof, and lifestyle or identity payoff. The model may rename angles when product context makes another trio stronger.

## Demo and Compatibility Behavior

Deterministic demo generation also returns three complete concepts so the app remains functional without an OpenAI key.

The frontend normalizes legacy single-brief responses into three concepts when practical. This prevents a stale API response or partially deployed backend from crashing the result view, but all current server paths will emit the new contract.

## Interface Design

The existing product-intelligence area remains shared across the result.

Below it, a campaign header announces three creative directions and provides a regenerate-all control. Three bordered concept cards use distinct accent colors and equal visual weight. Every card shows its hook prominently, followed by script, caption, hashtags, and video prompt as visible stacked sections. Content may collapse only on narrow screens; desktop does not require selecting a card or switching a global tab to inspect another concept.

Video job state is tracked per concept so starting a video from one card does not replace or confuse another card's status.

## Error Handling

- Invalid URLs continue to fail before generation.
- Product-page extraction failures fall back to URL-derived product context.
- OpenAI output that does not validate against exactly three concepts falls back to deterministic three-concept output.
- A video-generation failure is displayed on the concept that initiated it.
- Missing optional product metadata does not suppress concept generation.

## Testing

- Unit tests verify fallback output contains exactly three distinct concepts and complete assets.
- API tests verify the OpenAI schema and prompt request three contrasting concepts.
- Compatibility tests verify legacy briefs normalize safely.
- UI behavior is covered through helper-level tests for concept normalization and concept-specific video state where feasible.
- Existing URL normalization, scraping, lint, build, and API tests remain passing.

## Scope

This change does not add accounts, persistence, analytics, exporting, saved campaigns, or independent regeneration of one concept. It focuses on replacing the selected-angle workflow with one-request, three-concept generation and presentation.
