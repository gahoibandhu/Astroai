// src/pages/ChatPage.jsx
// Auto-suggests remedies after predictions + manual button fallback
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { saveChatMessage, savePrediction } from '../utils/firebase'
import ReactMarkdown from 'react-markdown'

const SUGGESTIONS = [
  'What is my current Mahadasha?',
  'What are remedies for a weak Moon?',
  'How does Saturn transit affect me?',
  'What does 2026 look like for my career?',
  'Explain the 7th house in Vedic astrology',
  'What is Lal Kitab astrology?',
  'Tell me about Rahu-Ketu axis',
  'What is today\'s panchang?',
]

const IS_PREDICTION = (text, intent) => {
  const lower = text?.toLowerCase() || ''
  const predIntents = ['dasha_query','transit_query','kundli_query','prediction_career','prediction_health','prediction_marriage']
  if (predIntents.includes(intent)) return true
  return ['will ', 'year ', 'period', 'upcoming', 'forecast', 'predict', 'expect', '2025','2026','2027','months'].some(w => lower.includes(w))
}

function genSessionId() { return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` }

// ── Remedy Options Panel ──────────────────────────────────────────────────
function RemedyPanel({ messageId, content, intent, autoLoad }) {
  const [state, setState] = useState('idle') // idle | loading | ready | closed
  const [remedies, setRemedies] = useState(null)
  const [selected, setSelected] = useState(null)
  const timerRef = useRef(null)

  const load = useCallback(async () => {
    if (state !== 'idle') return
    setState('loading')
    try {
      const res = await fetch('/.netlify/functions/chat-remedies', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction: content, intent })
      })
      const data = await res.json()
      setRemedies(data)
      setState('ready')
    } catch { setState('idle') }
  }, [state, content, intent])

  // Auto-load after 1.5s delay if this is a prediction
  useEffect(() => {
    if (autoLoad && state === 'idle') {
      timerRef.current = setTimeout(() => load(), 1500)
    }
    return () => clearTimeout(timerRef.current)
  }, [autoLoad])

  if (state === 'closed') return null

  return (
    <div style={{ marginTop: 8, marginLeft: 38 }}>
      {state === 'idle' && (
        <button onClick={load} style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 18, padding: '4px 13px', color: '#c9a84c', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'sans-serif', fontWeight: 600, letterSpacing: '0.05em' }}>
          ✦ Show Remedy Options
        </button>
      )}

      {state === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: '#c9a84c', animation: `pulse 1.2s ${i*0.2}s infinite` }}/>)}
          </div>
          <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.72rem', fontFamily: 'sans-serif' }}>Finding your remedy options...</span>
        </div>
      )}

      {state === 'ready' && remedies?.options && (
        <div style={{ background: '#0e0220', border: '1px solid rgba(201,168,76,0.22)', borderRadius: 12, padding: '12px 13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <div>
              <div style={{ color: '#c9a84c', fontSize: '0.72rem', letterSpacing: '0.08em', fontFamily: 'sans-serif', fontWeight: 700 }}>✦ REMEDY OPTIONS — PICK THE ONE THAT FEELS RIGHT</div>
              {remedies.context && <div style={{ color: 'rgba(232,220,200,0.4)', fontSize: '0.75rem', fontStyle: 'italic', marginTop: 2 }}>{remedies.context}</div>}
            </div>
            <button onClick={() => setState('closed')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontSize: '0.85rem', padding: '0 0 0 8px', lineHeight: 1 }}>✕</button>
          </div>
          <div style={{ color: 'rgba(232,220,200,0.3)', fontSize: '0.7rem', marginBottom: 10, fontStyle: 'italic' }}>Each option is complete on its own — follow only one</div>

          <div style={{ display: 'flex', gap: 8 }}>
            {remedies.options.map(opt => {
              const isSel = selected === opt.id
              const diffColor = { Easy: '#22c55e', Medium: '#f59e0b', Moderate: '#f59e0b' }[opt.difficulty] || '#94a3b8'
              return (
                <div key={opt.id} onClick={() => setSelected(isSel ? null : opt.id)}
                  style={{ flex: 1, padding: '10px 10px', borderRadius: 9, cursor: 'pointer', transition: 'all 0.18s',
                    background: isSel ? 'rgba(201,168,76,0.1)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSel ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    position: 'relative'
                  }}>
                  {isSel && <div style={{ position: 'absolute', top: 7, right: 7, width: 14, height: 14, borderRadius: '50%', background: '#c9a84c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', color: '#0b0118', fontWeight: 700 }}>✓</div>}
                  <div style={{ fontSize: '1.15rem', marginBottom: 3 }}>{opt.icon}</div>
                  <div style={{ color: '#c9a84c', fontSize: '0.62rem', fontFamily: 'sans-serif', fontWeight: 700, marginBottom: 2, letterSpacing: '0.05em' }}>OPTION {opt.id}</div>
                  <div style={{ color: '#e8dcc8', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{opt.label}</div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 5, flexWrap: 'wrap' }}>
                    <span style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(232,220,200,0.5)', borderRadius: 3, padding: '1px 5px', fontSize: '0.62rem', fontFamily: 'sans-serif' }}>{opt.system}</span>
                    <span style={{ background: `${diffColor}15`, color: diffColor, borderRadius: 3, padding: '1px 5px', fontSize: '0.62rem', fontFamily: 'sans-serif', fontWeight: 600 }}>{opt.difficulty}</span>
                    <span style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(232,220,200,0.4)', borderRadius: 3, padding: '1px 5px', fontSize: '0.62rem', fontFamily: 'sans-serif' }}>{opt.time}</span>
                  </div>
                  <div style={{ color: 'rgba(232,220,200,0.65)', fontSize: '0.78rem', lineHeight: 1.5 }}>{opt.remedy}</div>

                  {isSel && (
                    <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px solid rgba(201,168,76,0.12)' }}>
                      <div style={{ color: 'rgba(201,168,76,0.55)', fontSize: '0.62rem', letterSpacing: '0.08em', fontFamily: 'sans-serif', marginBottom: 4 }}>HOW TO DO IT</div>
                      <div style={{ color: '#e8dcc8', fontSize: '0.78rem', lineHeight: 1.6, marginBottom: 7 }}>{opt.howto}</div>
                      <div style={{ background: 'rgba(201,168,76,0.07)', borderRadius: 6, padding: '6px 8px', marginBottom: 5 }}>
                        <div style={{ color: '#f0d080', fontSize: '0.76rem', fontStyle: 'italic' }}>✦ {opt.benefit}</div>
                      </div>
                      <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.63rem', fontFamily: 'sans-serif' }}>Follow for: {opt.duration}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Message ────────────────────────────────────────────────────────────────
function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className="fade-in" style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', marginBottom: '1.1rem', alignItems: 'flex-start', gap: '0.7rem' }}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, marginTop: 2, background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--gold)' }}>✦</div>
      )}
      <div style={{ maxWidth: isUser ? '68%' : '80%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ background: isUser ? 'rgba(201,168,76,0.12)' : 'var(--bg-2)', border: `1px solid ${isUser ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`, borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px', padding: '0.75rem 1rem', color: 'var(--text)', fontSize: '1rem', lineHeight: 1.7 }}>
          {isUser ? <span>{msg.content}</span> : <div className="md-content"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', textAlign: isUser ? 'right' : 'left' }}>{msg.time}</div>
        </div>
        {/* Auto-suggest + manual button for prediction messages */}
        {!isUser && msg.isPrediction && (
          <RemedyPanel
            messageId={msg.id}
            content={msg.content}
            intent={msg.intent}
            autoLoad={msg.autoLoadRemedies}
          />
        )}
      </div>
    </div>
  )
}

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.7rem', marginBottom: '1.1rem' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', color: 'var(--gold)', flexShrink: 0 }}>✦</div>
      <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '16px 16px 16px 4px', padding: '0.85rem 1.1rem', display: 'flex', gap: '5px', alignItems: 'center' }}>
        {[0,1,2].map(i => <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', animation: `pulse 1.2s ${i*0.2}s infinite` }}/>)}
      </div>
    </div>
  )
}

// ── Main Chat Page ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([{
    id: 'welcome',
    role: 'assistant',
    content: `Namaste 🙏 Welcome to **Astro AI**.\n\nI can answer any astrology question. When I make a **prediction**, remedy options will automatically appear below my reply — pick the one that feels right.\n\nAsk me anything!`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isPrediction: false,
    autoLoadRemedies: false
  }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId] = useState(() => genSessionId())
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const send = async (text) => {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user', content: msg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          userId: user.uid, userName: user.name
        })
      })
      const data = await res.json()
      const reply = data.reply || 'Something went wrong. Please try again.'
      const isPrediction = IS_PREDICTION(reply, data.intent)

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: 'assistant', content: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: data.intent,
        isPrediction,
        autoLoadRemedies: isPrediction  // auto-trigger remedy load
      }
      setMessages(prev => [...prev, aiMsg])

      // Save to Firestore
      saveChatMessage({ uid: user.uid, sessionId, userMessage: msg, aiReply: reply, intent: data.intent || 'general' }).catch(console.error)
      if (isPrediction) {
        savePrediction({ uid: user.uid, chatId: aiMsg.id, sessionId, predictionText: reply, intent: data.intent || 'general_astro', engine: 'gemini' }).catch(console.error)
      }
    } catch {
      setMessages(prev => [...prev, {
        id: `err_${Date.now()}`, role: 'assistant',
        content: '⚠️ Connection error. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isPrediction: false
      }])
    }
    setLoading(false)
    inputRef.current?.focus()
  }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'var(--bg-1)', flexShrink: 0 }}>
        <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>◎</span>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.82rem', letterSpacing: '0.08em' }}>ASTROLOGY CHAT</span>
        <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Namaste, {user?.name?.split(' ')[0]} ✦</span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '1.4rem 1.5rem' }}>
        {messages.map(m => <Message key={m.id} msg={m} />)}
        {loading && <TypingDots />}
        {messages.length === 1 && !loading && (
          <div style={{ marginTop: '0.5rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginBottom: '0.7rem', letterSpacing: '0.05em' }}>SUGGESTED QUESTIONS</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '20px', padding: '0.35em 0.85em', color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--gold-dim)'; e.currentTarget.style.color = 'var(--text)' }}
                  onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-dim)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ padding: '0.9rem 1.5rem', borderTop: '1px solid var(--border)', background: 'var(--bg-1)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-end' }}>
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
            placeholder="Ask about kundli, dashas, transits, predictions..."
            rows={1} style={{ flex: 1, background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.7rem 1rem', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '1rem', outline: 'none', resize: 'none', lineHeight: 1.5, maxHeight: '130px', overflowY: 'auto', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = 'var(--gold-dim)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
            onInput={e => { e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 130) + 'px' }} />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            style={{ width: 42, height: 42, borderRadius: '10px', flexShrink: 0, background: input.trim() && !loading ? 'var(--gold)' : 'var(--bg-3)', border: '1px solid var(--border)', cursor: input.trim() && !loading ? 'pointer' : 'default', color: input.trim() && !loading ? 'var(--bg-0)' : 'var(--text-muted)', fontSize: '1.1rem', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {loading ? <span style={{ animation: 'spin 1s linear infinite', display: 'block' }}>◌</span> : '↑'}
          </button>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginTop: '0.4rem', textAlign: 'center' }}>
          Predictions auto-save for testing · Remedy options appear automatically · Powered by Gemini AI
        </div>
      </div>
    </div>
  )
}
