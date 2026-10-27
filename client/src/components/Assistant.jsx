import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { inr, streamChat } from '../api.js';
import { useAuth } from '../context/Auth.jsx';
import { useCart } from '../context/Cart.jsx';

const SUGGESTIONS = [
  'What products are currently available?',
  'What is your return and refund policy?',
  'What are the shipping delivery times?',
];

export default function Assistant() {
  const { user } = useAuth();
  const { add } = useCart();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [msgs, open]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const patchLast = (fn) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? fn(x) : x)));

  async function ask(text) {
    const question = text.trim();
    if (!question || busy) return;
    const history = msgs.filter((m) => m.content && !m.error).map(({ role, content }) => ({ role, content }));
    setMsgs((m) => [...m, { role: 'user', content: question }, { role: 'assistant', content: '', sources: [] }]);
    setInput('');
    setBusy(true);
    abortRef.current = new AbortController();
    try {
      await streamChat({ question, history: history.slice(-6) }, {
        sources: (sources) => patchLast((x) => ({ ...x, sources })),
        token: ({ t }) => patchLast((x) => ({ ...x, content: x.content + t })),
        done: (meta) => patchLast((x) => ({ ...x, meta })),
        error: ({ message }) => patchLast((x) => ({ ...x, error: message })),
      }, abortRef.current.signal);
    } catch (err) {
      if (err.name !== 'AbortError') patchLast((x) => ({ ...x, error: err.message }));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        className={`ask-fab ${open ? 'fab-hidden' : ''}`}
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-label="Open AI Shopping Assistant"
      >
        <span className="fab-sparkle" aria-hidden="true">✨</span>
        <span>Ask ShopHappily</span>
      </button>
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Shopping assistant">
        <header>
          <div>
            <h2>Shopping assistant</h2>
            <p>Answers come from our catalogue and store policies.</p>
          </div>
          <button className="link" onClick={() => setOpen(false)}>Close</button>
        </header>

        {!user ? (
          <div className="drawer-empty"><p><Link to="/login" onClick={() => setOpen(false)}>Sign in</Link> to ask questions.</p></div>
        ) : (
          <>
            <div className="thread">
              {msgs.length === 0 && (
                <div className="drawer-empty">
                  <p>Describe what you need, a budget, or ask about shipping and returns.</p>
                  {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}
                </div>
              )}
              {msgs.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  {m.role === 'user' ? <p>{m.content}</p> : (
                    <>
                      {m.sources?.length > 0 && (
                        <ul className="sources" aria-label="Products used to answer">
                          {m.sources.map((s) => (
                            <li key={s.id}>
                              <span><b>{s.name}</b><small>{inr(s.price)} · {Math.round(s.similarity * 100)}% match</small></span>
                              <button className="btn tiny" disabled={s.stock === 0} onClick={() => add(s)}>Add</button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {m.content ? <ReactMarkdown>{m.content}</ReactMarkdown> : !m.error && <p className="muted">Searching the catalogue…</p>}
                      {m.error && <p className="error">{m.error}</p>}
                      {m.meta && (
                        <p className="meta">
                          {m.meta.filters?.maxPrice ? ` · price filter ≤ ${inr(m.meta.filters.maxPrice)}` : ''}

                        </p>
                      )}
                    </>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="composer" onSubmit={(e) => { e.preventDefault(); ask(input); }}>
              <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={500} placeholder="What are you looking for?" aria-label="Your question" />
              <button className="btn" disabled={busy || input.trim().length < 2}>Ask</button>
            </form>
          </>
        )}
      </aside>
    </>
  );
}
