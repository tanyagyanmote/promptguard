import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const policy = require("../policy.json");
import { redactPII } from "./redactor.js";
import { auditRecord } from "./audit.js";

dotenv.config();

const app = express();
app.use(helmet());
app.use(express.json({ limit: "256kb" }));

const PORT = process.env.PORT || 8080;
const AUDIT_BUCKET = process.env.AUDIT_BUCKET || ""; // empty locally

// health
app.get("/healthz", (_req, res) => res.json({ ok: true }));

function fakeModel(model, prompt) {
  const trimmed = prompt.slice(0, 200);
  return `[${model}] SUMMARY: ${trimmed}`;
}

app.post("/generate", async (req, res) => {
  const { model, prompt } = req.body || {};
  if (!model || !prompt) return res.status(400).json({ error: "model and prompt required" });

  if (!policy.allowModels.includes(model)) {
    await auditRecord({ toFile: true, toS3Bucket: AUDIT_BUCKET }, { event: "denyModel", model });
    return res.status(403).json({ error: "model not allowed by policy" });
  }
  if (prompt.length > policy.maxPromptChars) {
    await auditRecord({ toFile: true, toS3Bucket: AUDIT_BUCKET }, { event: "denySize", size: prompt.length });
    return res.status(413).json({ error: "prompt too large" });
  }

  const redacted = redactPII(prompt);
  await auditRecord({ toFile: true, toS3Bucket: AUDIT_BUCKET }, { event: "request", model, promptRedacted: redacted });

  const output = fakeModel(model, redacted);

  await auditRecord({ toFile: true, toS3Bucket: AUDIT_BUCKET }, { event: "response", model, bytes: output.length });

  res.json({ model, redactedPrompt: redacted, output });
});

app.listen(PORT, () => console.log(`PromptGuard on :${PORT}`));
