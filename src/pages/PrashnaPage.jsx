// src/pages/PrashnaPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../utils/firebase'
import ReactMarkdown from 'react-markdown'

const CATEGORIES = [
  { id: 'career',   label: 'Career & Job',      icon: '💼' },
  { id: 'finance',  label: 'Finance & Money',    icon: '💰' },
  { id: 'marriage', label: 'Marriage & Love',    icon: '💑' },
  { id: 'health',   label: 'Health',             icon: '🏥' },
  { id: 'travel',   label: 'Travel & Move',      icon: '✈️' },
  { id: 'legal',    label: 'Legal & Court',      icon: '⚖️' },
  { id: 'education',label: 'Education & Exams',  icon: '📚' },
  { id: 'general',  label: 'General Query',      icon: '🔮' },
]

const QUICK_QUESTIONS = [
  'Will I get the job I interviewed for?',
  'Will my business succeed?',
  'Is this the right time to invest?',
  'Will I get married this year?',
  'Should I accept this offer?',
  'Will I recover from my illness soon?',
  'Is my legal case going to be resolved in my favour?',
  'Will I travel abroad this year?',
]

function VerdictBadge({ verdict, confidence }) {
  const cfg = {
    YES:         { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  text: '#4ade80',  label: 'YES ✓' },
    NO:          { bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.4)',   text: '#f87171',  label: 'NO ✗' },
    CONDITIONAL: { bg: 'rgba(251,191,36,0.15)',  border: 'rgba(251,191,36,0.4)',  text: '#fbbf24',  label: 'CONDITIONAL ≈' },
  }
  const c = cfg[verdict] || cfg.CONDITIONAL
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ background: c.bg, border: `2px solid ${c.border}`, borderRadius: 10, padding: '10px 20px', textAlign: 'center' }}>
        <div style={{ color: c.text, fontFamily: 'sans-serif', fontSize: '1.3rem', fontWeight: 800, letterSpacing: '0.08em' }}>{c.label}</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.72rem', fontFamily: 'sans-serif', marginTop: 3 }}>Prashna verdict</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: c.text, fontFamily: 'sans-serif', fontSize: '1.8rem', fontWeight: 700 }}>{confidence}%</div>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontFamily: 'sans-serif' }}>confidence</div>
      </div>
    </div>
  )
}

export default function PrashnaPage() {
  const { user } = useAuth()
  const [question, setQuestion] = useState('')
  const [category, setCategory] = useState('general')
  const [location, setLocation] = useState('Delhi, India')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [askTime, setAskTime] = useState(null)

  const generate = async () => {
    if (!question.trim()) { setError('Please enter your question.'); return }
    setError(''); setLoading(true); setResult(null)
    const now = new Date()
    setAskTime(now)

    try {
      const res = await fetch('/.netlify/functions/prashna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.trim(),
          category,
          location,
          datetime: now.toLocaleString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' }),
          userName: user?.name
        })
      })
      const data = await res.json()
      if (data.error) { setError('Could not generate. Please try again.'); setLoading(false); return }
      setResult(data)

      // Save to Firestore
      await addDoc(collection(db, 'prashna'), {
        uid: user.uid,
        question: question.trim(),
        category,
        location,
        askedAt: serverTimestamp(),
        result: data
      }).catch(console.error)

    } catch { setError('Something went wrong. Please try again.') }
    setLoading(false)
  }

  const catData = CATEGORIES.find(c => c.id === category)

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
        <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>🔮</span>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>PRASHNA KUNDLI</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>Horary Astrology · Vedic · KP · Nadi · Lal Kitab</span>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.6rem 1.4rem' }}>

        {/* Intro */}
        <div style={{ background: 'rgba(201,168,76,0.05)', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 12 }}>
          <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>🔮</span>
          <div>
            <div style={{ color: '#c9a84c', fontFamily: 'var(--font-display)', fontSize: '0.82rem', letterSpacing: '0.06em', marginBottom: 4 }}>WHAT IS PRASHNA KUNDLI?</div>
            <div style={{ color: 'rgba(232,220,200,0.65)', fontSize: '0.85rem', lineHeight: 1.7 }}>
              Prashna Kundli (Horary Astrology) creates a birth chart for the <em>exact moment you ask a question</em>. This chart reveals the answer hidden in the cosmic configuration of that precise instant — no birth details needed.
            </div>
          </div>
        </div>

        {/* Category selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.6)', marginBottom: 8 }}>QUESTION CATEGORY</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {CATEGORIES.map(c => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ padding: '7px 6px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s',
                  background: category === c.id ? 'rgba(201,168,76,0.12)' : '#130228',
                  border: `1px solid ${category === c.id ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.1)'}` }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 2 }}>{c.icon}</div>
                <div style={{ color: category === c.id ? '#c9a84c' : 'rgba(232,220,200,0.5)', fontSize: '0.68rem', fontFamily: 'sans-serif', fontWeight: 600 }}>{c.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Question input */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.6)', marginBottom: 6 }}>YOUR QUESTION</div>
          <textarea value={question} onChange={e => setQuestion(e.target.value)}
            placeholder="Ask your question with full sincerity. The more specific, the better the answer..."
            rows={3}
            style={{ width: '100%', background: '#1a0533', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '10px 13px', color: '#e8dcc8', fontFamily: 'var(--font-body)', fontSize: '1rem', outline: 'none', resize: 'none', lineHeight: 1.6 }}
          />
          {/* Quick question pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
            {QUICK_QUESTIONS.slice(0, 4).map(q => (
              <button key={q} onClick={() => setQuestion(q)}
                style={{ padding: '3px 9px', borderRadius: 12, background: 'transparent', border: '1px solid rgba(201,168,76,0.12)', color: 'rgba(232,220,200,0.45)', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.3)'; e.currentTarget.style.color = 'rgba(232,220,200,0.75)' }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.12)'; e.currentTarget.style.color = 'rgba(232,220,200,0.45)' }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.6)', marginBottom: 6 }}>YOUR LOCATION (for accurate lagna)</div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country"
            className="input-field" />
        </div>

        {error && <div style={{ padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.82rem', marginBottom: 12 }}>⚠ {error}</div>}

        <button onClick={generate} disabled={loading || !question.trim()}
          className="btn btn-gold"
          style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '0.85em', marginBottom: 24 }}>
          {loading ? '🔮 Reading the cosmic moment...' : `🔮 ASK THE PRASHNA KUNDLI — ${catData?.icon} ${catData?.label}`}
        </button>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '2.5rem 0' }}>
            <div style={{ fontSize: '2rem', animation: 'pulse 1.5s infinite', marginBottom: 10, color: 'var(--gold)' }}>🔮</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.75rem', letterSpacing: '0.12em', color: 'var(--gold)', marginBottom: 6 }}>CASTING THE PRASHNA CHART</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              {askTime && `Moment of asking: ${askTime.toLocaleTimeString()}`}
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="fade-in">
            {/* Moment info */}
            <div style={{ background: '#130228', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '8px 14px', marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.78rem' }}>
              <div><span style={{ color: 'rgba(201,168,76,0.5)', fontFamily: 'sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em' }}>MOMENT: </span><span style={{ color: '#e8dcc8' }}>{askTime?.toLocaleString()}</span></div>
              <div><span style={{ color: 'rgba(201,168,76,0.5)', fontFamily: 'sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em' }}>PRASHNA LAGNA: </span><span style={{ color: '#c9a84c' }}>{result.prashna_lagna?.split('—')[0]?.split('(')[0]?.trim()}</span></div>
              <div><span style={{ color: 'rgba(201,168,76,0.5)', fontFamily: 'sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em' }}>MOON: </span><span style={{ color: '#e8dcc8' }}>{result.moon_position?.split('(')[0]?.split(',')[0]?.trim()}</span></div>
            </div>

            {/* Verdict */}
            <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-display)', color: 'rgba(201,168,76,0.6)', fontSize: '0.68rem', letterSpacing: '0.1em', marginBottom: 12 }}>PRASHNA VERDICT</div>
              <VerdictBadge verdict={result.verdict} confidence={result.confidence} />
              {result.verdict_reason && (
                <div style={{ color: '#e8dcc8', fontSize: '0.9rem', marginTop: 12, lineHeight: 1.7, fontStyle: 'italic', borderTop: '1px solid rgba(201,168,76,0.1)', paddingTop: 10 }}>
                  {result.verdict_reason}
                </div>
              )}
              {result.timing && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.7rem', fontFamily: 'sans-serif', letterSpacing: '0.08em' }}>TIMING:</span>
                  <span style={{ color: '#c9a84c', fontSize: '0.85rem', fontWeight: 600 }}>{result.timing}</span>
                </div>
              )}
            </div>

            {/* Key planets */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
              {result.prashna_lagna && (
                <div style={{ background: '#130228', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ color: 'rgba(201,168,76,0.55)', fontSize: '0.65rem', fontFamily: 'sans-serif', letterSpacing: '0.08em', marginBottom: 4 }}>PRASHNA LAGNA</div>
                  <div style={{ color: '#e8dcc8', fontSize: '0.85rem', lineHeight: 1.5 }}>{result.prashna_lagna}</div>
                </div>
              )}
              {result.key_planet && (
                <div style={{ background: '#130228', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 8, padding: '9px 12px' }}>
                  <div style={{ color: 'rgba(201,168,76,0.55)', fontSize: '0.65rem', fontFamily: 'sans-serif', letterSpacing: '0.08em', marginBottom: 4 }}>KEY PLANET</div>
                  <div style={{ color: '#e8dcc8', fontSize: '0.85rem', lineHeight: 1.5 }}>{result.key_planet}</div>
                </div>
              )}
            </div>

            {/* Detailed answer */}
            {result.detailed_answer && (
              <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '16px 18px', marginBottom: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', color: 'rgba(201,168,76,0.6)', fontSize: '0.68rem', letterSpacing: '0.1em', marginBottom: 12 }}>✦ DETAILED PRASHNA READING</div>
                <div className="md-content" style={{ lineHeight: 1.8 }}>
                  <ReactMarkdown>{result.detailed_answer}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Remedies for this prashna */}
            {result.remedies?.length > 0 && (
              <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontFamily: 'var(--font-display)', color: 'rgba(201,168,76,0.6)', fontSize: '0.68rem', letterSpacing: '0.1em', marginBottom: 12 }}>✦ PRASHNA REMEDIES — CHOOSE ONE OR ALL</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.remedies.map((r, i) => (
                    <div key={i} style={{ background: '#110228', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontSize: '1rem' }}>{r.icon}</span>
                        <span style={{ color: '#c9a84c', fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.04em' }}>{r.title}</span>
                        <span style={{ marginLeft: 'auto', fontSize: '0.65rem', fontFamily: 'sans-serif', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)', color: 'rgba(201,168,76,0.6)', padding: '1px 6px', borderRadius: 3 }}>{r.system}</span>
                      </div>
                      <div style={{ color: '#e8dcc8', fontSize: '0.85rem', lineHeight: 1.65 }}>{r.action}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
