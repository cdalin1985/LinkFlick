import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import { Router } from "express";
import { buildFallbackBrief, normalizeAffiliateUrl } from "../src/lib/linkflick.js";

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

export function createOpenAIRouter() {
  const router = Router();

  router.post("/generate-brief", async (request, response) => {
    const parsed = BriefRequestSchema.safeParse(request.body);

    if (!parsed.success) {
      return response.status(400).json({
        error: "Enter a valid affiliate product URL."
      });
    }

    try {
      const normalizedUrl = normalizeAffiliateUrl(parsed.data.productUrl);

      if (!hasApiKey() || process.env.LINKFLICK_DEMO_MODE === "true") {
        return response.json(
          buildFallbackBrief({
            ...parsed.data,
            productUrl: normalizedUrl
          })
        );
      }

      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const model = process.env.OPENAI_SCRIPT_MODEL || "gpt-5.5";
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
              "Return hooks, 30-45 second scripts, captions, hashtags, and one Sora-ready 9:16 video prompt."
            ].join("\n")
          }
        ],
        text: {
          format: zodTextFormat(GeneratedBriefSchema, "linkflick_affiliate_short_brief")
        }
      });

      return response.json({
        source: "openai",
        productUrl: normalizedUrl,
        ...completion.output_parsed
      });
    } catch (error) {
      return response.status(500).json({
        error: error.message || "Unable to generate LinkFlick assets."
      });
    }
  });

  router.post("/videos", async (request, response) => {
    if (!hasApiKey()) {
      return response.status(400).json({
        error: "Set OPENAI_API_KEY in .env to create real OpenAI video jobs."
      });
    }

    const { prompt, seconds, size, model } = request.body || {};

    if (!prompt || typeof prompt !== "string") {
      return response.status(400).json({
        error: "A video prompt is required."
      });
    }

    try {
      const formData = new FormData();
      formData.append("model", model || process.env.OPENAI_VIDEO_MODEL || "sora-2");
      formData.append("prompt", prompt);
      formData.append("seconds", String(seconds || process.env.OPENAI_VIDEO_SECONDS || 8));
      formData.append("size", size || process.env.OPENAI_VIDEO_SIZE || "720x1280");

      const videoJob = await openAIRequest("/videos", {
        method: "POST",
        body: formData
      });

      return response.status(202).json(videoJob);
    } catch (error) {
      return response.status(500).json({
        error: error.message || "Unable to create OpenAI video job."
      });
    }
  });

  router.get("/videos/:id", async (request, response) => {
    if (!hasApiKey()) {
      return response.status(400).json({
        error: "Set OPENAI_API_KEY in .env to poll real OpenAI video jobs."
      });
    }

    try {
      const videoJob = await openAIRequest(`/videos/${encodeURIComponent(request.params.id)}`);
      return response.json(videoJob);
    } catch (error) {
      return response.status(500).json({
        error: error.message || "Unable to retrieve OpenAI video job."
      });
    }
  });

  router.get("/videos/:id/content", async (request, response) => {
    if (!hasApiKey()) {
      return response.status(400).json({
        error: "Set OPENAI_API_KEY in .env to download real OpenAI videos."
      });
    }

    try {
      const content = await openAIRequest(`/videos/${encodeURIComponent(request.params.id)}/content`, {
        expectBinary: true
      });

      response.type(content.contentType || "video/mp4");
      return response.send(Buffer.from(content.buffer));
    } catch (error) {
      return response.status(500).json({
        error: error.message || "Unable to download OpenAI video content."
      });
    }
  });

  return router;
}

function hasApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function openAIRequest(path, { expectBinary = false, ...init } = {}) {
  const apiResponse = await fetch(`https://api.openai.com/v1${path}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
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
