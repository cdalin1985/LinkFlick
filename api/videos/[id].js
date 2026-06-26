import { handleGetVideoJob } from "../../server/linkflickApi.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("allow", "GET");
    return response.status(405).json({ error: "Method not allowed." });
  }

  return sendResult(response, await handleGetVideoJob(request.query.id));
}

function sendResult(response, result) {
  Object.entries(result.headers || {}).forEach(([key, value]) => {
    response.setHeader(key, value);
  });

  return response.status(result.status).send(result.body);
}
