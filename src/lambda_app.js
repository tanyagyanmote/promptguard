import policy from "../policy.js";
import { redactPII } from "./redactor.js";
import { auditRecord } from "./audit.js";

const AUDIT_BUCKET = process.env.AUDIT_BUCKET || "";

function fakeModel(model, prompt) {
  const trimmed = prompt.slice(0, 200);
  return `[${model}] SUMMARY: ${trimmed}`;
}

export default async function app(req) {
  if (req.path === "/healthz" && req.method === "GET") {
    return { statusCode: 200, body: { ok: true } };
  }
  if (req.path === "/generate" && req.method === "POST") {
    const { model, prompt } = req.body || {};
    if (!model || !prompt) return { statusCode: 400, body: { error: "model and prompt required" } };

    if (!policy.allowModels.includes(model)) {
      await auditRecord({ toFile: false, toS3Bucket: AUDIT_BUCKET }, { event: "denyModel", model });
      return { statusCode: 403, body: { error: "model not allowed by policy" } };
    }
    if (prompt.length > policy.maxPromptChars) {
      await auditRecord({ toFile: false, toS3Bucket: AUDIT_BUCKET }, { event: "denySize", size: prompt.length });
      return { statusCode: 413, body: { error: "prompt too large" } };
    }

    const redacted = redactPII(prompt);
    await auditRecord({ toFile: false, toS3Bucket: AUDIT_BUCKET }, { event: "request", model, promptRedacted: redacted });

    const output = fakeModel(model, redacted);

    await auditRecord({ toFile: false, toS3Bucket: AUDIT_BUCKET }, { event: "response", model, bytes: output.length });

    return { statusCode: 200, body: { model, redactedPrompt: redacted, output } };
  }
  return { statusCode: 404, body: { error: "not found" } };
}
