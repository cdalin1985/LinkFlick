const genericPathParts = new Set([
  "a",
  "affiliate",
  "collections",
  "deal",
  "deals",
  "dp",
  "gp",
  "item",
  "p",
  "product",
  "products",
  "shop",
  "store"
]);

const stopWords = new Set(["and", "for", "in", "of", "the", "to", "with"]);

export const defaultTones = ["Punchy", "Trustworthy", "Playful", "Premium"];

const fallbackDirections = [
  { id: "problem-solution", angle: "Problem → Solution" },
  { id: "honest-review", angle: "Honest Review" },
  { id: "lifestyle-payoff", angle: "Lifestyle Payoff" }
];

export function normalizeAffiliateUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    throw new Error("Enter a valid affiliate product URL.");
  }

  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (!url.hostname.includes(".") || /\s/.test(url.hostname)) {
      throw new Error("Invalid hostname");
    }

    return url.toString();
  } catch {
    throw new Error("Enter a valid affiliate product URL.");
  }
}

export function inferProductNameFromUrl(productUrl) {
  const normalizedUrl = normalizeAffiliateUrl(productUrl);
  const url = new URL(normalizedUrl);
  const pathParts = url.pathname
    .split("/")
    .map((part) => decodeURIComponent(part).replace(/\.[a-z0-9]+$/i, ""))
    .filter(Boolean)
    .filter((part) => !genericPathParts.has(part.toLowerCase()))
    .filter((part) => !/^[a-z0-9]{8,}$/i.test(part));

  const bestPart = pathParts.sort((a, b) => b.length - a.length)[0] || url.hostname.split(".")[0];
  return titleize(bestPart.replace(/[_+.-]+/g, " "));
}

export function extractProductMetadataFromHtml(html, productUrl) {
  const normalizedUrl = normalizeAffiliateUrl(productUrl);
  const text = String(html || "");
  const jsonLdProducts = extractJsonLdProducts(text);
  const product = jsonLdProducts[0] || {};
  const offers = Array.isArray(product.offers) ? product.offers[0] || {} : product.offers || {};
  const brand = typeof product.brand === "string" ? product.brand : product.brand?.name;
  const price =
    stringValue(offers.price || offers.lowPrice) ||
    metaContent(text, "product:price:amount") ||
    metaContent(text, "og:price:amount");
  const title =
    cleanProductTitle(stringValue(product.name) || metaContent(text, "og:title") || metaContent(text, "twitter:title")) ||
    inferProductNameFromUrl(normalizedUrl);

  return compactObject({
    title,
    description:
      stringValue(product.description) ||
      metaContent(text, "og:description") ||
      metaContent(text, "twitter:description"),
    image: absoluteUrl(
      stringValue(product.image) ||
        (Array.isArray(product.image) ? product.image[0] : "") ||
        metaContent(text, "og:image") ||
        metaContent(text, "twitter:image"),
      normalizedUrl
    ),
    brand: stringValue(brand),
    price,
    currency:
      stringValue(offers.priceCurrency) ||
      metaContent(text, "product:price:currency") ||
      metaContent(text, "og:price:currency"),
    bullets: extractProductBullets(product, text),
    sourceUrl: normalizedUrl
  });
}

export function buildVideoPrompt({ productName, angle, tone, hook }) {
  const safeProduct = productName || "the affiliate product";
  const selectedAngle = angle || "Problem-solution";
  const selectedTone = tone || "Punchy";
  const openingHook = hook || `This ${safeProduct} solves a problem people feel every day.`;

  return [
    `Create a 9:16 vertical short-form affiliate product video for ${safeProduct}.`,
    `Tone: ${selectedTone}. Angle: ${selectedAngle}.`,
    `Opening hook shown visually in the first two seconds: "${openingHook}"`,
    "Show realistic product close-ups, one clear problem moment, one satisfying product-in-use moment, and a clean end frame with space for code-native caption overlay.",
    "No logos, no platform marks, no celebrity likenesses, no readable third-party brand names, no exaggerated medical or financial claims.",
    "Fast creator-commerce pacing, natural handheld camera energy, crisp product lighting, white SaaS-friendly background accents in coral, lime, and cyan."
  ].join(" ");
}

export function buildFallbackBrief({
  productUrl,
  tone = "Punchy",
  productContext = {}
}) {
  const normalizedUrl = normalizeAffiliateUrl(productUrl);
  const productName = cleanProductTitle(productContext.title) || inferProductNameFromUrl(normalizedUrl);
  const productLower = productName.toLowerCase();
  const contextBullets = normalizeBullets(productContext.bullets || []);
  const primaryDetail = contextBullets[0] || productContext.description || "one practical benefit";
  const secondaryDetail = contextBullets[1] || "a setup that stays simple in real life";
  const baseHashtags = ["#AffiliateFinds", "#ProductReview", "#ShoppingFinds", "#LinkInBio"];
  const concepts = [
    {
      ...fallbackDirections[0],
      hook: `This ${productLower} fixed the tiny problem I kept ignoring.`,
      script: {
        title: "From friction to payoff",
        duration: "35s",
        lines: [
          "Open on the daily frustration your audience already recognizes.",
          `Introduce ${productName} as the simple upgrade, not a miracle fix.`,
          `Show the product in use and call out: ${primaryDetail}.`,
          "Close with a direct, low-pressure call to check the link."
        ],
        shotList: ["Frustration close-up", "Product reveal", "Use-case demo", "Benefit detail", "CTA end frame"],
        cta: "Tap the link and compare it for yourself."
      },
      caption: `${productName} is the small upgrade that removes one annoying bit of friction from the routine.`,
      hashtags: [...baseHashtags, "#ProblemSolved", "#UsefulFinds"]
    },
    {
      ...fallbackDirections[1],
      hook: `I did not expect this ${productLower} to earn a spot in my routine.`,
      script: {
        title: "The honest verdict",
        duration: "42s",
        lines: [
          `Start with the surprise: ${productName} was more useful than expected.`,
          `Demonstrate ${primaryDetail} without exaggerating the result.`,
          `Name the practical upside: ${secondaryDetail}.`,
          "End with who should buy it, plus one believable reason someone might skip it."
        ],
        shotList: ["Hook frame", "Hands-on use", "Feature close-up", "Pros and caveat", "Affiliate disclosure frame"],
        cta: "I linked the exact option so you can judge it for yourself."
      },
      caption: `No fake hype—just the practical reason ${productName} stayed in the rotation.`,
      hashtags: [...baseHashtags, "#HonestReview", "#CreatorTested"]
    },
    {
      ...fallbackDirections[2],
      hook: `The easiest way to make your routine feel a little more put together.`,
      script: {
        title: "The routine upgrade",
        duration: "32s",
        lines: [
          "Open with the calmer, easier version of the moment your audience wants.",
          `Make ${productName} part of the routine instead of presenting it as the whole story.`,
          `Use a satisfying detail shot to reinforce ${primaryDetail}.`,
          "Finish on the emotional payoff and invite viewers to picture it in their own setup."
        ],
        shotList: ["Lifestyle opener", "Product-in-context reveal", "Satisfying detail", "Routine payoff", "Soft CTA frame"],
        cta: "The exact product is linked if this fits your routine too."
      },
      caption: `${productName} turns an ordinary routine into one of those oddly satisfying little wins.`,
      hashtags: [...baseHashtags, "#RoutineUpgrade", "#LifestyleFinds"]
    }
  ].map((concept) => ({
    ...concept,
    videoPrompt: buildVideoPrompt({
      productName,
      angle: concept.angle,
      tone,
      hook: concept.hook
    })
  }));

  return {
    source: "demo",
    productUrl: normalizedUrl,
    productName,
    productContext: compactObject({
      title: productName,
      description: productContext.description,
      image: productContext.image,
      brand: productContext.brand,
      price: productContext.price,
      currency: productContext.currency,
      bullets: contextBullets,
      sourceUrl: productContext.sourceUrl || normalizedUrl
    }),
    audience: "Affiliate shoppers",
    tone,
    concepts
  };
}

export function normalizeGeneratedBrief(brief = {}) {
  const suppliedConcepts = Array.isArray(brief.concepts) ? brief.concepts.slice(0, 3) : [];
  const legacyHooks = Array.isArray(brief.hooks) ? brief.hooks : [];
  const legacyScripts = Array.isArray(brief.scripts) ? brief.scripts : [];
  const legacyCaptions = Array.isArray(brief.captions) ? brief.captions : [];
  const legacyHashtags = Array.isArray(brief.hashtags) ? brief.hashtags : [];

  const concepts = fallbackDirections.map((direction, index) => {
    const supplied = suppliedConcepts[index] || {};
    const hook =
      stringValue(supplied.hook) ||
      stringValue(legacyHooks[index]) ||
      stringValue(legacyHooks[0]) ||
      `A practical reason to look closer at ${brief.productName || "this product"}.`;
    const script = supplied.script || legacyScripts[index] || legacyScripts[0] || {
      title: direction.angle,
      duration: "35s",
      lines: ["Show the familiar problem.", "Demonstrate the product clearly.", "Close with a direct call to action."],
      shotList: ["Problem", "Reveal", "Demo", "CTA"],
      cta: "Check the link for details."
    };

    return {
      id: stringValue(supplied.id) || direction.id,
      angle: stringValue(supplied.angle) || direction.angle,
      hook,
      script,
      caption:
        stringValue(supplied.caption) ||
        stringValue(legacyCaptions[index]) ||
        stringValue(legacyCaptions[0]),
      hashtags:
        Array.isArray(supplied.hashtags) && supplied.hashtags.length
          ? supplied.hashtags
          : legacyHashtags,
      videoPrompt:
        stringValue(supplied.videoPrompt) ||
        stringValue(brief.videoPrompt) ||
        buildVideoPrompt({
          productName: brief.productName,
          angle: stringValue(supplied.angle) || direction.angle,
          tone: brief.tone,
          hook
        })
    };
  });

  return {
    ...brief,
    concepts
  };
}

export function formatConceptForClipboard(concept = {}) {
  const script = concept.script || {};

  return [
    String(concept.angle || "Concept").toUpperCase(),
    "",
    "HOOK",
    concept.hook || "",
    "",
    `SCRIPT — ${script.title || "Affiliate short"}${script.duration ? ` (${script.duration})` : ""}`,
    ...(Array.isArray(script.lines) ? script.lines : []),
    script.cta ? `CTA: ${script.cta}` : "",
    "",
    "CAPTION",
    concept.caption || "",
    "",
    "HASHTAGS",
    Array.isArray(concept.hashtags) ? concept.hashtags.join(" ") : "",
    "",
    "VIDEO PROMPT",
    concept.videoPrompt || ""
  ]
    .filter((line, index, lines) => line !== "" || lines[index - 1] !== "")
    .join("\n")
    .trim();
}

function absoluteUrl(value, baseUrl) {
  if (!value) {
    return "";
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function extractProductBullets(product, html) {
  return normalizeBullets([
    ...structuredBullets(product.featureList),
    ...structuredBullets(product.features),
    ...structuredBullets(product.additionalProperty),
    ...structuredBullets(product.positiveNotes),
    ...htmlListBullets(html)
  ]).slice(0, 6);
}

function structuredBullets(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => structuredBullets(item));
  }

  if (typeof value === "object") {
    if (value.itemListElement) {
      return structuredBullets(value.itemListElement);
    }

    return structuredBullets(value.value || value.text || value.description || value.name || value.item?.name);
  }

  return splitBulletText(value);
}

function htmlListBullets(html) {
  const snippets = [];
  const containerPattern =
    /<(?:section|div|ul|ol)[^>]*(?:class|id)=["'][^"']*(?:feature|highlight|bullet|benefit|spec|detail|description|product)[^"']*["'][^>]*>([\s\S]*?)<\/(?:section|div|ul|ol)>/gi;
  let container = containerPattern.exec(html);

  while (container) {
    snippets.push(container[1]);
    container = containerPattern.exec(html);
  }

  return snippets.flatMap((snippet) => {
    const bullets = [];
    const itemPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let item = itemPattern.exec(snippet);

    while (item) {
      bullets.push(item[1]);
      item = itemPattern.exec(snippet);
    }

    return bullets;
  });
}

function normalizeBullets(values) {
  const seen = new Set();
  const bullets = [];

  for (const value of values) {
    const bullet = cleanBullet(value);
    const key = bullet.toLowerCase();

    if (bullet && !seen.has(key)) {
      seen.add(key);
      bullets.push(bullet);
    }
  }

  return bullets;
}

function splitBulletText(value) {
  return String(value || "")
    .split(/\n|[\u2022]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function cleanBullet(value) {
  const bullet = decodeHtmlEntities(String(value || "").replace(/<[^>]+>/g, " "))
    .replace(/^[\s\-*\u2022]+/, "")
    .replace(/\s+/g, " ")
    .trim();

  if (bullet.length < 8 || bullet.length > 180) {
    return "";
  }

  if (/^(add to cart|buy now|checkout|privacy|terms|home|shop)$/i.test(bullet)) {
    return "";
  }

  return bullet;
}

function cleanProductTitle(value) {
  const title = stringValue(value);

  if (!title) {
    return "";
  }

  return title
    .replace(/\s+[|–—-]\s+(?:buy\s+)?(?:official\s+)?(?:store|shop|amazon|walmart|target|example shop).*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null && String(item).trim() !== "")
  );
}

function extractJsonLdProducts(html) {
  const products = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match = scriptPattern.exec(html);

  while (match) {
    try {
      const parsed = JSON.parse(decodeHtmlEntities(match[1].trim()));
      products.push(...findProductNodes(parsed));
    } catch {
      // Ignore malformed third-party JSON-LD and keep parsing other metadata.
    }
    match = scriptPattern.exec(html);
  }

  return products;
}

function findProductNodes(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => findProductNodes(item));
  }

  if (typeof value !== "object") {
    return [];
  }

  const type = value["@type"];
  const isProduct = Array.isArray(type)
    ? type.some((item) => String(item).toLowerCase() === "product")
    : String(type || "").toLowerCase() === "product";

  if (isProduct) {
    return [value];
  }

  return findProductNodes(value["@graph"]);
}

function metaContent(html, key) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escapedKey}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escapedKey}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return decodeHtmlEntities(match[1]).trim();
    }
  }

  return "";
}

function decodeHtmlEntities(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function stringValue(value) {
  if (Array.isArray(value)) {
    return stringValue(value[0]);
  }

  return value === undefined || value === null ? "" : String(value).trim();
}

function titleize(value) {
  return String(value)
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && stopWords.has(lower)) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}
