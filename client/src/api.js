export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const API_BASE = import.meta.env.VITE_API_URL?.replace(/\/$/, '') || '';

export async function api(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new ApiError(
      res.ok
        ? 'Backend API not reachable. Non-JSON response received. Make sure backend is running and VITE_API_URL is configured.'
        : `Request failed with status ${res.status}.`,
      res.status
    );
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || 'Request failed.', res.status);
  const cache = res.headers.get('X-Cache');
  if (cache && data && !Array.isArray(data)) data._cache = cache; // surfaced in the UI
  return data;
}

// POST + read the response as a stream of Server-Sent Events.
// (EventSource only supports GET, so we parse the SSE frames ourselves.)
export async function streamChat(body, handlers, signal) {
  const res = await fetch(`${API_BASE}/api/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(data.error || 'Request failed.', res.status);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let end;
    while ((end = buf.indexOf('\n\n')) !== -1) {
      const frame = buf.slice(0, end);
      buf = buf.slice(end + 2);
      const event = /^event: (.*)$/m.exec(frame)?.[1];
      const data = /^data: (.*)$/m.exec(frame)?.[1];
      if (event && data) handlers[event]?.(JSON.parse(data));
    }
  }
}

export const inr = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const newKey = () =>
  globalThis.crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
