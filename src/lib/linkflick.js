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

export const defaultAngles = [
  "Problem-solution",
  "Before-after",
  "Gift-worthy",
  "Creator review",
  "Deal urgency"
];

export const defaultTones = ["Punchy", "Trustworthy", "Playful", "Premium"];

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
    price: stringValue(offers.price || offers.lowPrice),
    currency: stringValue(offers.priceCurrency),
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
  angle = "Problem-solution",
  tone = "Punchy",
  productContext = {}
}) {
  const normalizedUrl = normalizeAffiliateUrl(productUrl);
  const productName = cleanProductTitle(productContext.title) || inferProductNameFromUrl(normalizedUrl);
  const productLower = productName.toLowerCase();

  const hooks = [
    `This ${productLower} fixed the tiny problem I kept ignoring.`,
    `I did not expect this ${productLower} to be this useful.`,
    `Three reasons this ${productLower} belongs in your cart.`,
    `If your setup still feels annoying, look at this.`,
    `This is the kind of affiliate find people actually save.`
  ];

  const scripts = [
    {
      title: "Problem to payoff",
      duration: "35s",
      lines: [
        `Open on the daily frustration your audience already recognizes.`,
        `Introduce ${productName} as the simple upgrade, not a miracle fix.`,
        "Show the product in use with one specific benefit per shot.",
        "Close with a direct, low-pressure call to check the link."
      ],
      shotList: ["Frustration close-up", "Product reveal", "Use-case demo", "Benefit detail", "CTA end frame"],
      cta: "Tap the link and compare it for yourself."
    },
    {
      title: "Creator review",
      duration: "42s",
      lines: [
        `Start with: "${hooks[1]}"`,
        `Give one reason ${productName} earned a place in your routine.`,
        "Mention the biggest practical feature in plain language.",
        "End with who should buy it and who can skip it."
      ],
      shotList: ["Hook frame", "Unboxing angle", "Hands-on use", "Pros and caveat", "Affiliate disclosure frame"],
      cta: "I linked the exact one I tested."
    },
    {
      title: "Giftable find",
      duration: "30s",
      lines: [
        `Position ${productName} as an easy gift for a specific person.`,
        "Show the product looking premium and practical.",
        "Add one social-proof line without inventing fake numbers.",
        "Finish with a save/share prompt."
      ],
      shotList: ["Gift setup", "Product beauty shot", "Feature close-up", "Lifestyle use", "Save/share frame"],
      cta: "Save this before your next gift panic."
    }
  ];

  const captions = [
    `${productName} is the kind of small upgrade that makes the whole routine feel easier. Linked for anyone comparing options.`,
    `Affiliate find: ${productName}. Simple problem, clean solution, and a pitch that does not need fake hype.`,
    `Would you use this? I would test ${productName} for the convenience angle alone.`
  ];

  const hashtags = [
    "#AffiliateFinds",
    "#TikTokMadeMeBuyIt",
    "#ProductReview",
    "#CreatorTools",
    "#ShoppingFinds",
    "#LinkInBio"
  ];

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
      sourceUrl: productContext.sourceUrl || normalizedUrl
    }),
    audience: "Affiliate shoppers",
    angle,
    tone,
    hooks,
    scripts,
    captions,
    hashtags,
    videoPrompt: buildVideoPrompt({
      productName,
      angle,
      tone,
      hook: hooks[0]
    })
  };
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
