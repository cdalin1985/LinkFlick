import { describe, expect, it } from "vitest";
import { sanitizeEnvValue } from "../server/linkflickApi.js";

describe("LinkFlick API helpers", () => {
  it("strips BOM characters and surrounding whitespace from env values", () => {
    expect(sanitizeEnvValue(" \uFEFFsk-test-value\r\n")).toBe("sk-test-value");
  });
});
