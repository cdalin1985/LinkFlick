import { Router } from "express";
import {
  handleCreateVideo,
  handleGenerateBrief,
  handleGetVideoContent,
  handleGetVideoJob
} from "./linkflickApi.js";

export function createOpenAIRouter() {
  const router = Router();

  router.post("/generate-brief", async (request, response) => {
    return sendResult(response, await handleGenerateBrief(request.body));
  });

  router.post("/videos", async (request, response) => {
    return sendResult(response, await handleCreateVideo(request.body));
  });

  router.get("/videos/:id", async (request, response) => {
    return sendResult(response, await handleGetVideoJob(request.params.id));
  });

  router.get("/videos/:id/content", async (request, response) => {
    return sendResult(response, await handleGetVideoContent(request.params.id));
  });

  return router;
}

function sendResult(response, result) {
  Object.entries(result.headers || {}).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  return response.status(result.status).send(result.body);
}
