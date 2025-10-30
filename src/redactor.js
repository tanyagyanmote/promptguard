export function redactPII(text) {
    if (!text) return text;
    return text
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
      .replace(/\+?\d[\d\s().-]{7,}\d/g, "[REDACTED_PHONE]")
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED_SSN]");
  }  