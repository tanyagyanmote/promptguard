A tiny API that enforces model allow-lists, redacts PII from prompts, and writes audit logs — simulating a governed AI integration.

## Run
npm i
cp .env.sample .env
npm start

## Try it
curl -X POST http://localhost:8080/generate \
  -H "Content-Type: application/json" \
  -d '{"model":"internal:demo","prompt":"Email me at jane.doe@lab.gov about 555-123-4567"}'