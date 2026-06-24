import { describe, expect, it } from "vitest";
import {
  buildFallbackBrief,
  buildVideoPrompt,
  inferProductNameFromUrl,
  normalizeAffiliateUrl
} from "../src/lib/linkflick.js";

describe("LinkFlick helpers", () => {
  it("normalizes bare affiliate URLs to https URLs", () => {
    expect(normalizeAffiliateUrl("example.com/deals/smart-ring?tag=creator")).toBe(
      "https://example.com/deals/smart-ring?tag=creator"
    );
  });

  it("rejects invalid affiliate URLs", () => {
    expect(() => normalizeAffiliateUrl("not a url")).toThrow("Enter a valid affiliate product URL.");
  });

  it("infers a readable product name from URL path slugs", () => {
    expect(
      inferProductNameFromUrl("https://shop.example.com/products/portable-espresso-maker?aff=link")
    ).toBe("Portable Espresso Maker");
  });

  it("builds a fallback brief with hooks, scripts, captions, hashtags, and video prompt", () => {
    const brief = buildFallbackBrief({
      productUrl: "https://shop.example.com/products/desk-walking-pad",
      angle: "Problem-solution",
      tone: "Punchy"
    });

    expect(brief.productName).toBe("Desk Walking Pad");
    expect(brief.hooks).toHaveLength(5);
    expect(brief.scripts).toHaveLength(3);
    expect(brief.captions).toHaveLength(3);
    expect(brief.hashtags).toContain("#AffiliateFinds");
    expect(brief.videoPrompt).toContain("Desk Walking Pad");
  });

  it("builds a concise vertical video prompt for OpenAI video generation", () => {
    const prompt = buildVideoPrompt({
      productName: "Desk Walking Pad",
      angle: "Problem-solution",
      tone: "Punchy",
      hook: "This tiny desk upgrade changed my workday."
    });

    expect(prompt).toContain("9:16 vertical short-form affiliate product video");
    expect(prompt).toContain("Desk Walking Pad");
    expect(prompt).toContain("This tiny desk upgrade changed my workday.");
    expect(prompt).toContain("No logos");
  });
});
