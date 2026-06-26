import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import {
  buildFallbackBrief,
  extractProductMetadataFromHtml,
  normalizeAffiliateUrl
} from "../src/lib/linkflick.js";

const BriefRequestSchema = z.object({
  productUrl: z.string().min(1),
  angle: z.string().default("Problem-solution"),
  tone: z.string().default("Punchy")
});

const GeneratedBriefSchema = z.object({
  productName: z.string(),
  audience: z.string(),
  angle: z.string(),
  tone: z.string(),
  hooks: z.array(z.string()).min(5).max(8),
  scripts: z
    .array(
      z.object({
        title: z.string(),
        duration: z.string(),
        lines: z.array(z.string()).min(3).max(6),
        shotList: z.array(z.string()).min(4).max(7),
        cta: z.string()
      })
    )
    .min(3)
    .max(4),
  captions: z.array(z.string()).min(3).max(5),
  hashtags: z.array(z.string()).min(6).max(12),
  videoPrompt: z.string()
});

export async function handleGenerateBrief(payload) {
  const parsed = BriefRequestSchema.safeParse(payload);

  if (!parsed.success) {
    return jsonResult(400, {
      error: "Enter a valid affiliate product URL."
    });
  }

  try {
    const normalizedUrl = normalizeAffiliateUrl(parsed.data.productUrl);
    const productContext = await fetchProductContext(normalizedUrl);

    if (!hasApiKey() || process.env.LINKFLICK_DEMO_MODE === "true") {
      return jsonResult(
        200,
        buildFallbackBrief({
          ...parsed.data,
          productUrl: normalizedUrl,
          productContext
        })
      );
    }

    const client = new OpenAI({ apiKey: envValue("OPENAI_API_KEY") });
    const model = envValue("OPENAI_SCRIPT_MODEL") || "gpt-4.1";
    const completion = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content:
            "You are LinkFlick, an affiliate marketing short-form creative strategist. Generate practical, compliant short-video assets. Avoid fake metrics, unsupported claims, trademark misuse, and platform-logo references. Keep copy specific, punchy, and suitable for code-native UI rendering."
        },
        {
          role: "user",
          content: [
            `Affiliate product URL: ${normalizedUrl}`,
            `Selling angle: ${parsed.data.angle}`,
            `Tone: ${parsed.data.tone}`,
            productContextPrompt(productContext),
            "Return hooks, 30-45 second scripts, captions, hashtags, and one Sora-ready 9:16 video prompt."
          ]
            .filter(Boolean)
            .join("\n")
        }
      ],
      text: {
        format: zodTextFormat(GeneratedBriefSchema, "linkflick_affiliate_short_brief")
      }
    });

    return jsonResult(200, {
      source: "openai",
      productUrl: normalizedUrl,
      productContext,
      ...completion.output_parsed
    });
  } catch (error) {
    return jsonResult(500, {
      error: error.message || "Unable to generate LinkFlick assets."
    });
  }
}

export async function handleCreateVideo(payload) {
  if (!hasApiKey()) {
    return jsonResult(400, {
      error: "Set OPENAI_API_KEY in .env to create real OpenAI video jobs."
    });
  }

  const { prompt, seconds, size, model } = payload || {};

  if (!prompt || typeof prompt !== "string") {
    return jsonResult(400, {
      error: "A video prompt is required."
    });
  }

  try {
    const formData = new FormData();
    formData.append("model", model || envValue("OPENAI_VIDEO_MODEL") || "sora-2");
    formData.append("prompt", prompt);
    formData.append("seconds", String(seconds || envValue("OPENAI_VIDEO_SECONDS") || 8));
    formData.append("size", size || envValue("OPENAI_VIDEO_SIZE") || "720x1280");

    const videoJob = await openAIRequest("/videos", {
      method: "POST",
      body: formData
    });

    return jsonResult(202, videoJob);
  } catch (error) {
    return jsonResult(500, {
      error: error.message || "Unable to create OpenAI video job."
    });
  }
}

export async function handleGetVideoJob(id) {
  if (!hasApiKey()) {
    return jsonResult(400, {
      error: "Set OPENAI_API_KEY in .env to poll real OpenAI video jobs."
    });
  }

  try {
    const videoJob = await openAIRequest(`/videos/${encodeURIComponent(id)}`);
    return jsonResult(200, videoJob);
  } catch (error) {
    return jsonResult(500, {
      error: error.message || "Unable to retrieve OpenAI video job."
    });
  }
}

export async function handleGetVideoContent(id) {
  if (!hasApiKey()) {
    return jsonResult(400, {
      error: "Set OPENAI_API_KEY in .env to download real OpenAI videos."
    });
  }

  try {
    const content = await openAIRequest(`/videos/${encodeURIComponent(id)}/content`, {
      expectBinary: true
    });

    return {
      status: 200,
      body: Buffer.from(content.buffer),
      headers: {
        "content-type": content.contentType || "video/mp4"
      }
    };
  } catch (error) {
    return jsonResult(500, {
      error: error.message || "Unable to download OpenAI video content."
    });
  }
}

async function fetchProductContext(productUrl) {
  const normalizedUrl = normalizeAffiliateUrl(productUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": "LinkFlickBot/0.1 product metadata fetcher"
      }
    });

    if (!response.ok) {
      return { sourceUrl: normalizedUrl };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return { sourceUrl: normalizedUrl };
    }

    const html = await response.text();
    return extractProductMetadataFromHtml(html.slice(0, 500_000), normalizedUrl);
  } catch {
    return { sourceUrl: normalizedUrl };
  } finally {
    clearTimeout(timeout);
  }
}

function productContextPrompt(productContext) {
  const lines = [
    productContext.title ? `Product title: ${productContext.title}` : "",
    productContext.description ? `Product description: ${productContext.description}` : "",
    productContext.brand ? `Brand: ${productContext.brand}` : "",
    productContext.price ? `Price: ${productContext.currency || ""} ${productContext.price}`.trim() : ""
  ].filter(Boolean);

  return lines.length ? `Extracted product context:\n${lines.join("\n")}` : "";
}

function hasApiKey() {
  return Boolean(envValue("OPENAI_API_KEY"));
}

export function sanitizeEnvValue(value) {
  return String(value || "")
    .replace(/\uFEFF/g, "")
    .trim();
}

function envValue(name) {
  return sanitizeEnvValue(process.env[name]);
}

function jsonResult(status, body) {
  return {
    status,
    body,
    headers: {
      "content-type": "application/json"
    }
  };
}

async function openAIRequest(path, { expectBinary = false, ...init } = {}) {
  const apiResponse = await fetch(`https://api.openai.com/v1${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${envValue("OPENAI_API_KEY")}`
    }
  });

  if (!apiResponse.ok) {
    const errorText = await apiResponse.text();
    throw new Error(errorText || `OpenAI request failed with ${apiResponse.status}`);
  }

  if (expectBinary) {
    return {
      buffer: await apiResponse.arrayBuffer(),
      contentType: apiResponse.headers.get("content-type")
    };
  }

  return apiResponse.json();
}
