import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { inr, streamChat } from '../api.js';
import { useAuth } from '../context/Auth.jsx';
import { useCart } from '../context/Cart.jsx';
import { Bot, X, Send, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [msgs, open]);

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
      {/* Floating Chatbot Action Button */}
      <button
        className={`chatbot-fab ${open ? 'open' : ''}`}
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label={open ? 'Close Shopping Assistant' : 'Open AI Chatbot'}
        title={open ? 'Close Chatbot' : 'Chat with AI Shopping Assistant'}
      >
        <span className="chatbot-fab-inner">
          {open ? <X size={24} className="chatbot-close-icon" /> : <Bot size={28} className="chatbot-icon" />}
        </span>
        {!open && <span className="chatbot-status-dot" aria-hidden="true" />}
        <span className="chatbot-fab-tooltip" role="tooltip">
          Chat with AI
        </span>
      </button>

      {/* Assistant Drawer */}
      <aside className={`drawer ${open ? 'open' : ''}`} aria-hidden={!open} aria-label="Shopping assistant">
        <header>
          <div className="drawer-header-left">
            <div className="drawer-bot-avatar">
              <Bot size={20} />
            </div>
            <div>
              <h2>Shopping Assistant</h2>
              <p>Powered by Redis Vector Search & AI</p>
            </div>
          </div>
          <button className="btn-close-drawer" onClick={() => setOpen(false)} aria-label="Close assistant" title="Close assistant">
            <X size={18} />
          </button>
        </header>

        <div className="thread">
          {!user && (
            <div className="drawer-guest-banner">
              <Sparkles size={14} className="banner-sparkle-icon" />
              <span>
                <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link> to save your cart and access order history.
              </span>
            </div>
          )}
          {msgs.length === 0 && (
            <div className="drawer-empty">
              <div className="drawer-empty-bot-icon">
                <Bot size={36} />
              </div>
              <p>Describe what you need, your budget, or ask about shipping and returns.</p>
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="chip suggestion-chip" onClick={() => ask(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              {m.role === 'user' ? (
                <p>{m.content}</p>
              ) : (
                <>
                  {m.sources?.length > 0 && (
                    <ul className="sources" aria-label="Products used to answer">
                      {m.sources.map((s) => (
                        <li key={s.id}>
                          <span>
                            <b>{s.name}</b>
                            <small>{inr(s.price)} · {Math.round(s.similarity * 100)}% match</small>
                          </span>
                          <button className="btn tiny" disabled={s.stock === 0} onClick={() => add(s)}>
                            Add
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {m.content ? (
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  ) : !m.error && (
                    <p className="muted searching-text">
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      <span className="typing-dot" />
                      Searching the catalogue…
                    </p>
                  )}
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
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={500}
            placeholder="Ask about products, styles, budget..."
            aria-label="Your question"
          />
          <button className="btn composer-btn" disabled={busy || input.trim().length < 2} aria-label="Send message">
            <Send size={15} />
            <span>Ask</span>
          </button>
        </form>
      </aside>
    </>
  );
}
