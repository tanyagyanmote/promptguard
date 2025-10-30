import app from "./lambda_app.js";

export const handler = async (event) => {
  const path = event.rawPath || event.path || "/";
  const method = (event.requestContext?.http?.method || event.httpMethod || "GET").toUpperCase();
  const body = event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : null;

  const req = { path, method, body: body && JSON.parse(body) };
  const resp = await app(req);
  return {
    statusCode: resp.statusCode,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(resp.body)
  };
};
