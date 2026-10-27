import { config } from '../config.js';

const API_URL = 'https://api.anthropic.com/v1/messages';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Async generator that yields text chunks as the model produces them (Server-Sent Events upstream).
// With no API key it streams `fallback` instead so the whole app is demo-able offline.
export async function* streamAnswer({ system, messages, fallback, signal }) {
  if (!config.anthropicKey) {
    for (const word of fallback.split(/(\s+)/)) {
      yield word;
      await sleep(12);
    }
    return;
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    signal,
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.anthropicKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: config.model, max_tokens: 700, system, messages, stream: true }),
  });

  if (!res.ok) {
    console.error('[llm] upstream error', res.status, await res.text());
    const err = new Error(`The AI service returned an error (${res.status}). Check ANTHROPIC_API_KEY and ANTHROPIC_MODEL.`);
    err.status = 502;
    err.expose = true;
    throw err;
  }

  const decoder = new TextDecoder();
  let buf = '';
  for await (const chunk of res.body) {
    buf += decoder.decode(chunk, { stream: true });
    let end;
    while ((end = buf.indexOf('\n\n')) !== -1) {
      const block = buf.slice(0, end);
      buf = buf.slice(end + 2);
      const line = block.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      let evt;
      try { evt = JSON.parse(line.slice(6)); } catch { continue; }
      if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') yield evt.delta.text;
      if (evt.type === 'error') throw new Error(evt.error?.message || 'Upstream stream error');
    }
  }
}
