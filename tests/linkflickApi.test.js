import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildGenerationPrompt,
  buildProductContextPrompt,
  handleGenerateBrief,
  sanitizeEnvValue
} from "../server/linkflickApi.js";

const originalFetch = globalThis.fetch;
const originalOpenAIKey = process.env.OPENAI_API_KEY;
const originalDemoMode = process.env.LINKFLICK_DEMO_MODE;

afterEach(() => {
  globalThis.fetch = originalFetch;
  restoreEnv("OPENAI_API_KEY", originalOpenAIKey);
  restoreEnv("LINKFLICK_DEMO_MODE", originalDemoMode);
  vi.restoreAllMocks();
});

describe("LinkFlick API helpers", () => {
  it("strips BOM characters and surrounding whitespace from env values", () => {
    expect(sanitizeEnvValue(" \uFEFFsk-test-value\r\n")).toBe("sk-test-value");
  });

  it("fetches product page HTML and includes extracted context in demo generation", async () => {
    process.env.LINKFLICK_DEMO_MODE = "true";
    delete process.env.OPENAI_API_KEY;

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      headers: {
        get: (name) => (name.toLowerCase() === "content-type" ? "text/html; charset=utf-8" : "")
      },
      text: async () => `
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
              </ul>
            </section>
          </body>
        </html>
      `
    }));

    const result = await handleGenerateBrief({
      productUrl: "shop.example.com/products/luma-bottle?tag=creator",
      angle: "Creator review",
      tone: "Trustworthy"
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://shop.example.com/products/luma-bottle?tag=creator",
      expect.objectContaining({
        headers: expect.objectContaining({
          accept: "text/html,application/xhtml+xml",
          "user-agent": expect.stringContaining("LinkFlickBot")
        })
      })
    );
    expect(result.status).toBe(200);
    expect(result.body.productName).toBe("Luma Bottle");
    expect(result.body.productContext).toMatchObject({
      title: "Luma Bottle",
      image: "https://shop.example.com/assets/luma.jpg",
      price: "24.00",
      currency: "USD",
      bullets: ["Keeps drinks cold for 24 hours", "Leakproof flip lid for bags and commutes"]
    });
    expect(result.body.concepts).toHaveLength(3);
    expect(new Set(result.body.concepts.map((concept) => concept.angle)).size).toBe(3);
    expect(result.body.concepts.every((concept) => concept.videoPrompt)).toBe(true);
  });

  it("returns a generated fallback brief when product page scraping fails", async () => {
    process.env.LINKFLICK_DEMO_MODE = "true";
    delete process.env.OPENAI_API_KEY;
    globalThis.fetch = vi.fn(async () => {
      throw new Error("network unavailable");
    });

    const result = await handleGenerateBrief({
      productUrl: "https://shop.example.com/products/foldable-desk-lamp",
      angle: "Problem-solution",
      tone: "Punchy"
    });

    expect(result.status).toBe(200);
    expect(result.body.source).toBe("demo");
    expect(result.body.productName).toBe("Foldable Desk Lamp");
    expect(result.body.productContext.sourceUrl).toBe("https://shop.example.com/products/foldable-desk-lamp");
    expect(result.body.concepts).toHaveLength(3);
  });

  it("formats structured product context for OpenAI generation", () => {
    const prompt = buildProductContextPrompt({
      title: "Luma Bottle",
      brand: "Luma",
      description: "A compact insulated bottle for commuters.",
      image: "https://shop.example.com/assets/luma.jpg",
      price: "24.00",
      currency: "USD",
      bullets: ["Keeps drinks cold for 24 hours", "Leakproof flip lid"]
    });

    expect(prompt).toContain("Product title: Luma Bottle");
    expect(prompt).toContain("Price: USD 24.00");
    expect(prompt).toContain("Product image: https://shop.example.com/assets/luma.jpg");
    expect(prompt).toContain("- Keeps drinks cold for 24 hours");
    expect(prompt).toContain("- Leakproof flip lid");
  });

  it("asks OpenAI for exactly three contrasting complete concepts", () => {
    const prompt = buildGenerationPrompt({
      normalizedUrl: "https://shop.example.com/products/luma-bottle",
      tone: "Trustworthy",
      productContext: {}
    });

    expect(prompt).toContain("exactly three");
    expect(prompt).toContain("meaningfully different selling strategies");
    expect(prompt).toContain("30-45 second script");
    expect(prompt).not.toContain("Selling angle:");
  });
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
