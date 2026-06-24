import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createOpenAIRouter } from "./openaiRoutes.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 8877);
const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const projectRoot = path.resolve(currentDir, "..");
const distDir = path.join(projectRoot, "dist");

app.use(cors({ origin: true }));
app.use(express.json({ limit: "1mb" }));
app.use((error, _request, response, next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ error: "Request body must be valid JSON." });
  }

  return next(error);
});
app.use("/api", createOpenAIRouter());

if (existsSync(distDir)) {
  app.use(express.static(distDir));
}

app.listen(port, () => {
  console.log(`LinkFlick API server running on http://127.0.0.1:${port}`);
});
