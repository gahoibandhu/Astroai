// src/pages/PredictionsPage.jsx — prediction history + rating + accuracy stats
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getUserPredictions, submitPredictionFeedback, getAccuracyStats } from '../utils/firebase'

const DOMAIN_ICONS = { career:'💼', health:'🏥', marriage:'💑', finance:'💰', travel:'✈️', education:'📚', legal:'⚖️', general:'🔮' }
const STATUS_CFG = {
  pending:   { label: 'Pending',    bg: 'rgba(99,102,241,0.1)',  text: '#818cf8', border: 'rgba(99,102,241,0.25)' },
  correct:   { label: 'Correct ✓', bg: 'rgba(34,197,94,0.1)',   text: '#4ade80', border: 'rgba(34,197,94,0.25)'  },
  partial:   { label: 'Partial ≈', bg: 'rgba(251,191,36,0.1)',  text: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
  incorrect: { label: 'Wrong ✗',   bg: 'rgba(239,68,68,0.1)',   text: '#f87171', border: 'rgba(239,68,68,0.25)'  },
  too_early: { label: 'Too Early ⏳',bg: 'rgba(148,163,184,0.1)',text: '#94a3b8', border: 'rgba(148,163,184,0.25)'},
}

function AccuracyBar({ value }) {
  const pct = Math.round(value * 100)
  const color = pct >= 70 ? '#4ade80' : pct >= 40 ? '#fbbf24' : '#f87171'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem', fontFamily: 'sans-serif' }}>Accuracy</span>
        <span style={{ color, fontFamily: 'sans-serif', fontSize: '0.75rem', fontWeight: 700 }}>{pct}%</span>
      </div>
      <div style={{ height: 5, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

function PredictionCard({ pred, onUpdate }) {
  const [expanded, setExpanded] = useState(false)
  const [rating, setRating] = useState(pred.rating || 0)
  const [outcome, setOutcome] = useState(pred.userOutcome || '')
  const [status, setStatus] = useState(pred.status || 'pending')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(pred.status !== 'pending')
  const hover = useState(0)

  const sc = STATUS_CFG[status] || STATUS_CFG.pending
  const isPending = pred.status === 'pending'

  const save = async () => {
    if (!rating || status === 'pending') return
    setSaving(true)
    await submitPredictionFeedback({ predictionId: pred.id, rating, userOutcome: outcome, status })
    setSaved(true); setSaving(false)
    onUpdate(pred.id, { rating, userOutcome: outcome, status })
  }

  const formatDate = (ts) => {
    if (!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div style={{ background: '#1a0533', border: `1px solid ${sc.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 8, transition: 'all 0.15s' }}>
      <div onClick={() => setExpanded(e => !e)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0, marginTop: 1 }}>{DOMAIN_ICONS[pred.domain] || '🔮'}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#e8dcc8', fontSize: '0.88rem', lineHeight: 1.4, marginBottom: 4 }}>{pred.summary}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 4, padding: '1px 7px', fontSize: '0.68rem', fontFamily: 'sans-serif', fontWeight: 700 }}>{sc.label}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>{pred.domain}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>{formatDate(pred.createdAt)}</span>
            {pred.timeframe && <span style={{ color: 'rgba(201,168,76,0.55)', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>⏱ {pred.timeframe}</span>}
            {pred.rating > 0 && (
              <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>{'★'.repeat(pred.rating)}{'☆'.repeat(5 - pred.rating)}</span>
            )}
          </div>
        </div>
        <span style={{ color: 'rgba(201,168,76,0.4)', fontSize: '0.85rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(201,168,76,0.08)' }}>
          {pred.fullText && (
            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 7, padding: '9px 11px', margin: '10px 0', fontSize: '0.82rem', color: 'rgba(232,220,200,0.65)', lineHeight: 1.65, fontStyle: 'italic' }}>
              {pred.fullText.slice(0, 300)}{pred.fullText.length > 300 ? '...' : ''}
            </div>
          )}

          {!saved ? (
            <div>
              <div style={{ fontFamily: 'sans-serif', fontSize: '0.68rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.6)', marginBottom: 8 }}>RATE THIS PREDICTION</div>
              {/* Star rating */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                {[1,2,3,4,5].map(s => (
                  <span key={s} onClick={() => setRating(s)} style={{ fontSize: '1.3rem', cursor: 'pointer', color: s <= rating ? '#f59e0b' : 'rgba(255,255,255,0.15)', transition: 'color 0.1s' }}>★</span>
                ))}
                {rating > 0 && <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontFamily: 'sans-serif', alignSelf: 'center', marginLeft: 4 }}>{['','Very poor','Poor','Okay','Good','Excellent'][rating]}</span>}
              </div>
              {/* Status buttons */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {Object.entries(STATUS_CFG).filter(([k]) => k !== 'pending').map(([k, v]) => (
                  <button key={k} onClick={() => setStatus(k)}
                    style={{ padding: '4px 11px', borderRadius: 5, cursor: 'pointer', fontSize: '0.72rem', fontFamily: 'sans-serif', fontWeight: 700, border: 'none', transition: 'all 0.15s',
                      background: status === k ? v.bg : 'rgba(255,255,255,0.05)',
                      color: status === k ? v.text : 'rgba(255,255,255,0.35)',
                      outline: status === k ? `1px solid ${v.border}` : 'none'
                    }}>{v.label}</button>
                ))}
              </div>
              <textarea value={outcome} onChange={e => setOutcome(e.target.value)}
                placeholder="What actually happened? (optional — helps AI learn and improve)"
                rows={2}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '7px 10px', color: '#e8dcc8', fontFamily: 'var(--font-body)', fontSize: '0.82rem', outline: 'none', resize: 'none', marginBottom: 8 }}
              />
              <button onClick={save} disabled={!rating || status === 'pending' || saving}
                style={{ padding: '6px 18px', borderRadius: 6, border: 'none', cursor: (!rating || status === 'pending') ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em', transition: 'all 0.15s',
                  background: (!rating || status === 'pending') ? 'rgba(255,255,255,0.05)' : 'rgba(201,168,76,0.2)',
                  color: (!rating || status === 'pending') ? 'rgba(255,255,255,0.25)' : '#c9a84c' }}>
                {saving ? 'Saving...' : 'Submit Rating'}
              </button>
            </div>
          ) : (
            <div style={{ padding: '7px 10px', background: 'rgba(34,197,94,0.08)', borderRadius: 7, color: '#86efac', fontSize: '0.78rem', fontFamily: 'sans-serif' }}>
              ✓ Rated — {STATUS_CFG[pred.status || status]?.label}
              {pred.userOutcome && <div style={{ color: 'rgba(232,220,200,0.5)', marginTop: 4, fontStyle: 'italic' }}>"{pred.userOutcome}"</div>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PredictionsPage() {
  const { user } = useAuth()
  const [predictions, setPredictions] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (user?.uid) {
      Promise.all([getUserPredictions(user.uid), getAccuracyStats(user.uid)])
        .then(([preds, st]) => { setPredictions(preds); setStats(st) })
        .catch(console.error)
        .finally(() => setLoading(false))
    }
  }, [user])

  const handleUpdate = (id, updates) => {
    setPredictions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const filtered = filter === 'all' ? predictions : predictions.filter(p => p.status === filter)
  const pending = predictions.filter(p => p.status === 'pending').length

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '0.9rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.8rem', flexShrink: 0 }}>
        <span style={{ color: 'var(--gold)' }}>📊</span>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>PREDICTION TRACKER</span>
        {pending > 0 && <span style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', borderRadius: 10, padding: '2px 8px', fontSize: '0.68rem', fontFamily: 'sans-serif', fontWeight: 700 }}>{pending} to rate</span>}
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.4rem' }}>

        {/* Stats panel */}
        {stats && (
          <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', color: 'rgba(201,168,76,0.6)', fontSize: '0.68rem', letterSpacing: '0.1em', marginBottom: 14 }}>YOUR PREDICTION ACCURACY STATS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 14 }}>
              <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ color: '#c9a84c', fontSize: '1.6rem', fontFamily: 'sans-serif', fontWeight: 700 }}>{stats.total}</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>Total rated</div>
              </div>
              <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ color: stats.overall >= 0.7 ? '#4ade80' : stats.overall >= 0.4 ? '#fbbf24' : '#f87171', fontSize: '1.6rem', fontFamily: 'sans-serif', fontWeight: 700 }}>{Math.round(stats.overall * 100)}%</div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>Overall accuracy</div>
              </div>
              <div style={{ background: 'var(--bg-3)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                <div style={{ color: '#e8dcc8', fontSize: '1rem', fontFamily: 'sans-serif', fontWeight: 700 }}>
                  {stats.byDomain.sort((a,b) => b.avg - a.avg)[0]?.domain || '—'}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.68rem', fontFamily: 'sans-serif' }}>Best domain</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stats.byDomain.sort((a,b) => b.count - a.count).map(d => (
                <div key={d.domain} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 40px', gap: 10, alignItems: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontFamily: 'sans-serif' }}>{DOMAIN_ICONS[d.domain]} {d.domain}</div>
                  <AccuracyBar value={d.avg} />
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', fontFamily: 'sans-serif', textAlign: 'right' }}>{d.count}×</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {['all','pending','correct','partial','incorrect','too_early'].map(f => {
            const count = f === 'all' ? predictions.length : predictions.filter(p => p.status === f).length
            return (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s',
                  background: filter === f ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filter === f ? '#c9a84c' : 'rgba(255,255,255,0.35)',
                  outline: filter === f ? '1px solid rgba(201,168,76,0.3)' : 'none' }}>
                {f === 'all' ? 'All' : STATUS_CFG[f]?.label} {count > 0 && `(${count})`}
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1.5rem', animation: 'pulse 1.5s infinite', marginBottom: 8 }}>📊</div>
            <div style={{ fontFamily: 'sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Loading predictions...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>🔮</div>
            <div style={{ fontSize: '0.9rem', marginBottom: 6 }}>No predictions yet</div>
            <div style={{ fontSize: '0.78rem', fontStyle: 'italic' }}>Ask the chatbot about your career, health, or future — predictions will appear here for you to rate</div>
          </div>
        ) : (
          <div>
            {filtered.map(p => <PredictionCard key={p.id} pred={p} onUpdate={handleUpdate} />)}
          </div>
        )}
      </div>
    </div>
  )
}
