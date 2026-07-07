import { describe, expect, it } from "vitest";
import {
  buildFallbackBrief,
  buildVideoPrompt,
  extractProductMetadataFromHtml,
  formatConceptForClipboard,
  inferProductNameFromUrl,
  normalizeAffiliateUrl,
  normalizeGeneratedBrief
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

  it("builds exactly three complete and distinct fallback concepts", () => {
    const brief = buildFallbackBrief({
      productUrl: "https://shop.example.com/products/desk-walking-pad",
      tone: "Punchy"
    });

    expect(brief.productName).toBe("Desk Walking Pad");
    expect(brief.concepts).toHaveLength(3);
    expect(new Set(brief.concepts.map((concept) => concept.angle)).size).toBe(3);

    for (const concept of brief.concepts) {
      expect(concept.id).toBeTruthy();
      expect(concept.hook).toBeTruthy();
      expect(concept.script.lines.length).toBeGreaterThanOrEqual(3);
      expect(concept.caption).toBeTruthy();
      expect(concept.hashtags.length).toBeGreaterThanOrEqual(4);
      expect(concept.videoPrompt).toContain("Desk Walking Pad");
    }
  });

  it("normalizes a legacy single brief into three usable concepts", () => {
    const normalized = normalizeGeneratedBrief({
      productName: "Desk Walking Pad",
      tone: "Punchy",
      hooks: ["Hook one", "Hook two", "Hook three"],
      scripts: [
        {
          title: "One",
          duration: "30s",
          lines: ["A", "B", "C"],
          shotList: ["1", "2", "3", "4"],
          cta: "Go"
        }
      ],
      captions: ["Caption one"],
      hashtags: ["#AffiliateFinds"],
      videoPrompt: "Legacy prompt"
    });

    expect(normalized.concepts).toHaveLength(3);
    expect(normalized.concepts[0].hook).toBe("Hook one");
    expect(normalized.concepts[2].script.title).toBe("One");
  });

  it("formats one complete concept for clipboard export", () => {
    const text = formatConceptForClipboard({
      angle: "Honest Review",
      hook: "I tested this for a week.",
      script: {
        title: "The verdict",
        duration: "35s",
        lines: ["Open honestly.", "Show the product.", "Share the verdict."],
        cta: "See the exact product."
      },
      caption: "A practical review.",
      hashtags: ["#ProductReview", "#AffiliateFinds"],
      videoPrompt: "Create a vertical review."
    });

    expect(text).toContain("HONEST REVIEW");
    expect(text).toContain("HOOK\nI tested this for a week.");
    expect(text).toContain("SCRIPT — The verdict (35s)");
    expect(text).toContain("#ProductReview #AffiliateFinds");
    expect(text).toContain("Create a vertical review.");
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
              "featureList": [
                "Brews smooth coffee without bitterness",
                "Packs down into a travel mug"
              ],
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
    expect(metadata.bullets).toEqual([
      "Brews smooth coffee without bitterness",
      "Packs down into a travel mug"
    ]);
  });

  it("extracts product bullets and price metadata from product page markup", () => {
    const metadata = extractProductMetadataFromHtml(
      `
      <html>
        <head>
          <meta property="og:title" content="Luma Bottle | Example Shop" />
          <meta property="og:image" content="/assets/luma.jpg" />
          <meta property="product:price:amount" content="24.00" />
          <meta property="product:price:currency" content="USD" />
        </head>
        <body>
          <section class="product-highlights">
            <ul>
              <li>Keeps drinks cold for 24 hours</li>
              <li>Leakproof flip lid for bags and commutes</li>
              <li>Powder-coated finish resists scratches</li>
            </ul>
          </section>
        </body>
      </html>
      `,
      "https://shop.example.com/products/luma-bottle"
    );

    expect(metadata.title).toBe("Luma Bottle");
    expect(metadata.image).toBe("https://shop.example.com/assets/luma.jpg");
    expect(metadata.price).toBe("24.00");
    expect(metadata.currency).toBe("USD");
    expect(metadata.bullets).toEqual([
      "Keeps drinks cold for 24 hours",
      "Leakproof flip lid for bags and commutes",
      "Powder-coated finish resists scratches"
    ]);
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
        image: "https://cdn.example.com/aeropress.jpg",
        bullets: ["Brews smooth coffee without bitterness"]
      }
    });

    expect(brief.productName).toBe("AeroPress Go Travel Coffee Maker");
    expect(brief.productContext.description).toContain("smooth travel brews");
    expect(brief.productContext.bullets).toEqual(["Brews smooth coffee without bitterness"]);
    expect(brief.concepts[0].hook).toContain("aeropress go travel coffee maker");
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
