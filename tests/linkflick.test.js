import { describe, expect, it } from "vitest";
import {
  buildFallbackBrief,
  buildVideoPrompt,
  extractProductMetadataFromHtml,
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

  it("extracts product metadata from Open Graph and JSON-LD product HTML", () => {
    const metadata = extractProductMetadataFromHtml(
      `
      <html>
        <head>
          <meta property="og:title" content="AeroPress Go Travel Coffee Maker | Example Shop" />
          <meta property="og:description" content="Compact coffee maker for smooth travel brews." />
          <meta property="og:image" content="https://cdn.example.com/aeropress.jpg" />
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "AeroPress Go Travel Coffee Maker",
              "brand": { "name": "AeroPress" },
              "offers": { "price": "39.95", "priceCurrency": "USD" }
            }
          </script>
        </head>
      </html>
      `,
      "https://shop.example.com/products/aeropress-go"
    );

    expect(metadata.title).toBe("AeroPress Go Travel Coffee Maker");
    expect(metadata.description).toBe("Compact coffee maker for smooth travel brews.");
    expect(metadata.image).toBe("https://cdn.example.com/aeropress.jpg");
    expect(metadata.brand).toBe("AeroPress");
    expect(metadata.price).toBe("39.95");
    expect(metadata.currency).toBe("USD");
  });

  it("uses extracted product metadata when building fallback briefs", () => {
    const brief = buildFallbackBrief({
      productUrl: "https://shop.example.com/products/aeropress-go",
      angle: "Creator review",
      tone: "Trustworthy",
      productContext: {
        title: "AeroPress Go Travel Coffee Maker",
        description: "Compact coffee maker for smooth travel brews.",
        brand: "AeroPress",
        price: "39.95",
        currency: "USD",
        image: "https://cdn.example.com/aeropress.jpg"
      }
    });

    expect(brief.productName).toBe("AeroPress Go Travel Coffee Maker");
    expect(brief.productContext.description).toContain("smooth travel brews");
    expect(brief.hooks[0]).toContain("aeropress go travel coffee maker");
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
