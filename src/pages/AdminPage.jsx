// src/pages/AdminPage.jsx — Admin dashboard for prediction accuracy
import { useState } from 'react'

function StatBox({ label, value, color, sub }) {
  return (
    <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 10, padding: '14px', textAlign: 'center' }}>
      <div style={{ color: color || '#c9a84c', fontFamily: 'sans-serif', fontSize: '1.7rem', fontWeight: 700, lineHeight: 1 }}>{value ?? '—'}</div>
      <div style={{ color: 'rgba(201,168,76,0.55)', fontFamily: 'sans-serif', fontSize: '0.65rem', letterSpacing: '0.08em', marginTop: 5 }}>{label}</div>
      {sub && <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

function AccBar({ pct, color }) {
  return (
    <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color || '#c9a84c', borderRadius: 3, transition: 'width 0.5s ease' }} />
    </div>
  )
}

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const login = async () => {
    if (!secret.trim()) return
    setLoading(true); setError('')
    try {
      const res = await fetch('/.netlify/functions/admin-stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim(), action: 'overview' })
      })
      const json = await res.json()
      if (!res.ok || json.error) { setError(json.error || 'Wrong password'); setLoading(false); return }
      setData(json); setAuthed(true)
    } catch (e) { setError('Connection failed') }
    setLoading(false)
  }

  const refresh = async () => {
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/admin-stats', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim(), action: 'overview' })
      })
      const json = await res.json()
      if (!json.error) setData(json)
    } catch {}
    setLoading(false)
  }

  const accColor = (pct) => pct >= 70 ? '#22c55e' : pct >= 40 ? '#f59e0b' : '#ef4444'

  if (!authed) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b0118' }}>
      <div style={{ textAlign: 'center', maxWidth: 320 }}>
        <div style={{ fontSize: '2rem', color: '#c9a84c', marginBottom: 12 }}>🔐</div>
        <div style={{ fontFamily: 'sans-serif', color: '#c9a84c', fontSize: '0.9rem', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 6 }}>ADMIN PANEL</div>
        <div style={{ color: 'rgba(232,220,200,0.45)', fontSize: '0.82rem', marginBottom: 20, fontStyle: 'italic' }}>Enter admin password to access</div>
        <input type="password" value={secret} onChange={e => setSecret(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
          placeholder="Admin password"
          style={{ width: '100%', background: '#1a0533', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, padding: '10px 14px', color: '#e8dcc8', fontFamily: 'sans-serif', fontSize: '0.9rem', outline: 'none', marginBottom: 10 }} />
        {error && <div style={{ color: '#f87171', fontSize: '0.8rem', marginBottom: 10 }}>⚠ {error}</div>}
        <button onClick={login} disabled={loading}
          style={{ width: '100%', padding: '11px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#8a6e2e,#c9a84c)', color: '#0b0118', fontFamily: 'sans-serif', fontSize: '0.8rem', letterSpacing: '0.1em', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Checking...' : 'ENTER ADMIN'}
        </button>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', marginTop: 12, fontFamily: 'sans-serif' }}>Set ADMIN_SECRET in Netlify env vars</div>
      </div>
    </div>
  )

  return (
    <div style={{ height: '100vh', overflowY: 'auto', fontFamily: "'Crimson Pro', Georgia, serif" }}>
      {/* Header */}
      <div style={{ padding: '10px 20px', background: '#110228', borderBottom: '1px solid rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: '#c9a84c', fontSize: '1.1rem' }}>🔐</span>
        <span style={{ fontFamily: 'sans-serif', fontSize: '0.82rem', letterSpacing: '0.1em', color: '#c9a84c', fontWeight: 700 }}>ADMIN PANEL</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.72rem', fontFamily: 'sans-serif' }}>Astro AI Control Centre</span>
          <button onClick={refresh} disabled={loading} style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 6, padding: '4px 10px', color: '#c9a84c', fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'sans-serif' }}>
            {loading ? '⟳ Loading' : '⟳ Refresh'}
          </button>
        </span>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, background: '#0b0118', borderBottom: '1px solid rgba(201,168,76,0.1)', padding: '0 16px' }}>
        {[['overview','Overview'], ['accuracy','Accuracy by Type'], ['wrong','Wrong Predictions'], ['users','Users']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ padding: '8px 14px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === id ? '#c9a84c' : 'transparent'}`, color: activeTab === id ? '#c9a84c' : 'rgba(232,220,200,0.4)', fontSize: '0.75rem', fontFamily: 'sans-serif', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.06em', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '18px 20px' }}>
        {data && activeTab === 'overview' && (
          <div>
            {/* Top stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              <StatBox label="REGISTERED USERS" value={data.totals.registeredUsers} />
              <StatBox label="TOTAL PREDICTIONS" value={data.totals.predictions} />
              <StatBox label="TESTED" value={data.totals.tested} sub={`${data.totals.predictions - data.totals.tested} pending`} />
              <StatBox label="OVERALL ACCURACY" value={`${data.totals.overallAccuracy}%`} color={accColor(data.totals.overallAccuracy)} />
            </div>

            {/* Verdict breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              <StatBox label="CORRECT" value={data.totals.correct} color="#22c55e" sub={`${data.totals.tested > 0 ? Math.round(data.totals.correct/data.totals.tested*100) : 0}% of tested`} />
              <StatBox label="PARTIALLY CORRECT" value={data.totals.partial} color="#f59e0b" sub={`${data.totals.tested > 0 ? Math.round(data.totals.partial/data.totals.tested*100) : 0}% of tested`} />
              <StatBox label="WRONG" value={data.totals.wrong} color="#ef4444" sub={`${data.totals.tested > 0 ? Math.round(data.totals.wrong/data.totals.tested*100) : 0}% of tested`} />
            </div>

            {/* Overall accuracy bar */}
            <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 10, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.7rem', fontFamily: 'sans-serif', letterSpacing: '0.08em' }}>PLATFORM-WIDE PREDICTION ACCURACY</span>
                <span style={{ color: accColor(data.totals.overallAccuracy), fontFamily: 'sans-serif', fontWeight: 700 }}>{data.totals.overallAccuracy}%</span>
              </div>
              <AccBar pct={data.totals.overallAccuracy} color={accColor(data.totals.overallAccuracy)} />
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[['Correct', data.totals.correct, '#22c55e'], ['Partial', data.totals.partial, '#f59e0b'], ['Wrong', data.totals.wrong, '#ef4444'], ['Untested', data.totals.predictions - data.totals.tested, '#94a3b8']].map(([l, v, c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                    <span style={{ color: 'rgba(232,220,200,0.5)', fontSize: '0.72rem', fontFamily: 'sans-serif' }}>{l}: {v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {data && activeTab === 'accuracy' && (
          <div>
            <div style={{ color: 'rgba(232,220,200,0.4)', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 16 }}>Accuracy broken down by prediction type. Use this to identify which areas need improvement.</div>
            {data.intentStats.length === 0
              ? <div style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '40px', fontStyle: 'italic' }}>No tested predictions yet</div>
              : data.intentStats.map(s => (
                <div key={s.intent} style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 9, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: '#c9a84c', fontFamily: 'sans-serif', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.04em' }}>{s.intent.replace(/_/g,' ')}</span>
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif', fontSize: '0.7rem' }}>{s.total} tested</span>
                      {s.avgRating && <span style={{ color: '#c9a84c', fontSize: '0.72rem' }}>★ {s.avgRating}</span>}
                    </div>
                    <span style={{ color: accColor(s.accuracy), fontFamily: 'sans-serif', fontWeight: 700, fontSize: '1rem' }}>{s.accuracy}%</span>
                  </div>
                  <AccBar pct={s.accuracy} color={accColor(s.accuracy)} />
                  <div style={{ display: 'flex', gap: 12, marginTop: 7 }}>
                    {[['✓ Correct', s.correct, '#22c55e'], ['⚖ Partial', s.partial, '#f59e0b'], ['✗ Wrong', s.wrong, '#ef4444']].map(([l, v, c]) => (
                      <span key={l} style={{ color: c, fontSize: '0.72rem', fontFamily: 'sans-serif' }}>{l}: {v}</span>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {data && activeTab === 'wrong' && (
          <div>
            <div style={{ color: 'rgba(232,220,200,0.4)', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 16 }}>Review wrong predictions to understand where the AI fails. Use this to improve prompts.</div>
            {data.topWrong.length === 0
              ? <div style={{ color: 'rgba(255,255,255,0.25)', textAlign: 'center', padding: '40px', fontStyle: 'italic' }}>No wrong predictions recorded yet — great!</div>
              : data.topWrong.map((p, i) => (
                <div key={p.id} style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 9, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4, padding: '1px 8px', fontSize: '0.68rem', fontFamily: 'sans-serif', fontWeight: 600 }}>{p.intent?.replace(/_/g,' ')}</span>
                    <span style={{ display: 'flex', gap: 2 }}>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '0.9rem', color: s <= (p.rating||0) ? '#c9a84c' : 'rgba(255,255,255,0.1)' }}>★</span>)}</span>
                  </div>
                  <div style={{ color: '#e8dcc8', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: p.userNote ? 8 : 0 }}>{p.prediction}...</div>
                  {p.userNote && (
                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '7px 9px', borderLeft: '2px solid rgba(239,68,68,0.3)' }}>
                      <div style={{ color: 'rgba(239,68,68,0.6)', fontSize: '0.65rem', fontFamily: 'sans-serif', letterSpacing: '0.07em', marginBottom: 3 }}>WHAT ACTUALLY HAPPENED</div>
                      <div style={{ color: 'rgba(232,220,200,0.6)', fontSize: '0.82rem', fontStyle: 'italic' }}>{p.userNote}</div>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {data && activeTab === 'users' && (
          <div>
            <div style={{ color: 'rgba(232,220,200,0.4)', fontSize: '0.82rem', fontStyle: 'italic', marginBottom: 16 }}>Registered users — {data.totals.registeredUsers} total</div>
            <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.12)', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', background: 'rgba(201,168,76,0.08)', padding: '8px 14px', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                {['Name', 'Email', 'Logins', 'Last seen'].map(h => <div key={h} style={{ color: 'rgba(201,168,76,0.7)', fontSize: '0.68rem', letterSpacing: '0.08em', fontFamily: 'sans-serif', fontWeight: 700 }}>{h}</div>)}
              </div>
              {data.recentUsers.map((u, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', padding: '9px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                  <div style={{ color: '#e8dcc8', fontSize: '0.85rem' }}>{u.name}</div>
                  <div style={{ color: 'rgba(232,220,200,0.5)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                  <div style={{ color: '#c9a84c', fontFamily: 'sans-serif', fontSize: '0.82rem', fontWeight: 600 }}>{u.loginCount}</div>
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'sans-serif', fontSize: '0.72rem' }}>{u.lastSeen}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
