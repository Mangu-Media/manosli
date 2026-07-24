// Minimal Vercel-style request/response plumbing.
// Vercel serverless functions receive req/res objects that are compatible
// with node's IncomingMessage/ServerResponse (plus helpers). We type against
// the node interfaces and add our own tiny helpers so no @vercel/node dep is
// required; the handlers run unchanged on Vercel.
import type { IncomingMessage, ServerResponse } from 'node:http';

export type ApiRequest = IncomingMessage & {
  body?: unknown;
  query?: Record<string, string | string[]>;
};

export type ApiResponse = ServerResponse;

/** Send a JSON response and end the request. */
export function sendJson(res: ApiResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(body);
}

/** Read and JSON-parse the request body (Vercel pre-parses when possible). */
export async function readJsonBody(req: ApiRequest): Promise<unknown> {
  if (req.body !== undefined && req.body !== null) return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf-8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** True when the request uses one of the allowed methods; otherwise 405s. */
export function allowMethods(
  req: ApiRequest,
  res: ApiResponse,
  methods: string[],
): boolean {
  if (methods.includes(req.method ?? '')) return true;
  res.setHeader('Allow', methods.join(', '));
  sendJson(res, 405, { error: 'method_not_allowed' });
  return false;
}
