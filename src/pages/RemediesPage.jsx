// src/pages/RemediesPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { saveRemedy, getUserRemedies } from '../utils/firebase'

const PLANETS = [
  { name: 'Sun',     hindi: 'Surya',   color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)', icon: '☀️' },
  { name: 'Moon',    hindi: 'Chandra', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)', icon: '🌙' },
  { name: 'Mars',    hindi: 'Mangal',  color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)', icon: '♂' },
  { name: 'Mercury', hindi: 'Budh',    color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   border: 'rgba(34,197,94,0.25)', icon: '☿' },
  { name: 'Jupiter', hindi: 'Guru',    color: '#eab308', bg: 'rgba(234,179,8,0.1)',   border: 'rgba(234,179,8,0.25)', icon: '♃' },
  { name: 'Venus',   hindi: 'Shukra',  color: '#ec4899', bg: 'rgba(236,72,153,0.1)',  border: 'rgba(236,72,153,0.25)', icon: '♀' },
  { name: 'Saturn',  hindi: 'Shani',   color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.25)', icon: '♄' },
  { name: 'Rahu',    hindi: 'Rahu',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',  border: 'rgba(139,92,246,0.25)', icon: '☊' },
  { name: 'Ketu',    hindi: 'Ketu',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)', icon: '☋' },
]

const PROBLEMS = [
  '💼 Career stuck / no growth',
  '💰 Financial problems / debt',
  '💑 Delayed marriage',
  '👶 Child / fertility issues',
  '🏥 Chronic health problems',
  '🧠 Mental stress / anxiety',
  '🏠 Property / home disputes',
  '👨‍👩‍👧 Family conflicts',
  '❤️ Love / relationship issues',
  '✈️ Foreign travel / settlement',
  '📚 Education / exam failure',
  '⚖️ Legal / court cases',
]

const SYSTEM_COLORS = {
  'Vedic':          { bg: 'rgba(251,191,36,0.1)',  text: '#f59e0b',  border: 'rgba(251,191,36,0.2)'  },
  'Lal Kitab':      { bg: 'rgba(239,68,68,0.1)',   text: '#ef4444',  border: 'rgba(239,68,68,0.2)'   },
  'Bhrigu Nadi':    { bg: 'rgba(139,92,246,0.1)',  text: '#8b5cf6',  border: 'rgba(139,92,246,0.2)'  },
  'Numerology':     { bg: 'rgba(34,197,94,0.1)',   text: '#22c55e',  border: 'rgba(34,197,94,0.2)'   },
  'Tantric Vedic':  { bg: 'rgba(236,72,153,0.1)',  text: '#ec4899',  border: 'rgba(236,72,153,0.2)'  },
  'Shaiva Vedic':   { bg: 'rgba(99,102,241,0.1)',  text: '#6366f1',  border: 'rgba(99,102,241,0.2)'  },
  'Yogic':          { bg: 'rgba(20,184,166,0.1)',  text: '#14b8a6',  border: 'rgba(20,184,166,0.2)'  },
}

const LEVEL_COLORS = {
  beginner:    { bg: 'rgba(34,197,94,0.12)',  text: '#4ade80'  },
  intermediate:{ bg: 'rgba(251,191,36,0.12)', text: '#fbbf24'  },
  advanced:    { bg: 'rgba(239,68,68,0.12)',  text: '#f87171'  },
}

function SystemBadge({ system }) {
  const s = Object.keys(SYSTEM_COLORS).find(k => system?.includes(k)) || 'Vedic'
  const c = SYSTEM_COLORS[s] || SYSTEM_COLORS['Vedic']
  return (
    <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 4, padding: '2px 7px', fontSize: '0.68rem', letterSpacing: '0.05em', fontFamily: 'sans-serif', fontWeight: 600 }}>
      {system}
    </span>
  )
}

function LevelBadge({ level }) {
  const c = LEVEL_COLORS[level] || LEVEL_COLORS.beginner
  return (
    <span style={{ background: c.bg, color: c.text, borderRadius: 4, padding: '2px 7px', fontSize: '0.66rem', fontFamily: 'sans-serif', fontWeight: 600 }}>
      {level}
    </span>
  )
}

function RemedyCard({ remedy, isPriority }) {
  const [open, setOpen] = useState(isPriority)
  return (
    <div style={{
      background: open ? '#1a0533' : '#130228',
      border: `1px solid ${isPriority ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.12)'}`,
      borderRadius: 10, overflow: 'hidden',
      transition: 'all 0.2s'
    }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ padding: '11px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{remedy.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ color: '#e8dcc8', fontSize: '0.88rem', fontFamily: 'var(--font-display, sans-serif)', fontWeight: 600, letterSpacing: '0.05em' }}>
              {remedy.category}
            </span>
            {isPriority && <span style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 4, padding: '1px 7px', fontSize: '0.62rem', fontFamily: 'sans-serif', fontWeight: 700, letterSpacing: '0.06em' }}>START HERE</span>}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <SystemBadge system={remedy.system} />
            <LevelBadge level={remedy.level} />
          </div>
        </div>
        {!open && <div style={{ fontSize: '0.78rem', flexShrink: 0, maxWidth: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic', color: 'rgba(232,220,200,0.4)' }}>{remedy.primary}</div>}
        <span style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.9rem', flexShrink: 0, marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(201,168,76,0.1)' }}>
          {/* Primary remedy */}
          <div style={{ background: 'rgba(201,168,76,0.07)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 8, padding: '10px 12px', margin: '12px 0 10px' }}>
            <div style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.68rem', letterSpacing: '0.1em', fontFamily: 'sans-serif', marginBottom: 4 }}>PRIMARY REMEDY</div>
            <div style={{ color: '#f0d080', fontSize: '0.95rem', lineHeight: 1.6, fontWeight: 500 }}>{remedy.primary}</div>
          </div>

          {/* How to do it */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ color: 'rgba(201,168,76,0.6)', fontSize: '0.68rem', letterSpacing: '0.1em', fontFamily: 'sans-serif', marginBottom: 5 }}>HOW TO DO IT</div>
            <div style={{ color: '#e8dcc8', fontSize: '0.85rem', lineHeight: 1.7 }}>{remedy.detail}</div>
          </div>

          {/* Why it works */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px', borderLeft: '2px solid rgba(201,168,76,0.25)' }}>
            <div style={{ color: 'rgba(201,168,76,0.5)', fontSize: '0.66rem', letterSpacing: '0.1em', fontFamily: 'sans-serif', marginBottom: 3 }}>WHY IT WORKS</div>
            <div style={{ color: 'rgba(232,220,200,0.6)', fontSize: '0.8rem', lineHeight: 1.6, fontStyle: 'italic' }}>{remedy.power}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RemediesPage() {
  const { user } = useAuth()
  const [mode, setMode] = useState('planet')     // 'planet' | 'problem'
  const [selectedPlanet, setSelectedPlanet] = useState(null)
  const [selectedProblem, setSelectedProblem] = useState(null)
  const [customProblem, setCustomProblem] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [activeHistoryId, setActiveHistoryId] = useState(null)

  useEffect(() => {
    if (user?.uid) {
      getUserRemedies(user.uid)
        .then(r => { setHistory(r); setLoadingHistory(false) })
        .catch(() => setLoadingHistory(false))
    }
  }, [user])

  const generate = async () => {
    const query = mode === 'planet' ? selectedPlanet : (selectedProblem || customProblem)
    if (!query) { setError('Please select a planet or describe your problem.'); return }
    setError(''); setLoading(true); setResult(null); setSaved(false)

    try {
      const res = await fetch('/.netlify/functions/remedies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planet: mode === 'planet' ? query : null,
          problem: mode === 'problem' ? query : null,
          userName: user?.name,
          birthDate: null
        })
      })
      const data = await res.json()
      if (data.error) { setError('Could not generate. Please try again.'); setLoading(false); return }
      setResult(data)

      // Save to Firestore
      const id = await saveRemedy({
        uid: user.uid,
        query,
        queryType: mode,
        remedyData: data
      })
      setSaved(true)
      setHistory(prev => [{ id, query, queryType: mode, remedyData: data, createdAt: { toDate: () => new Date() } }, ...prev])
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  const loadHistory = (item) => {
    setResult(item.remedyData)
    setActiveHistoryId(item.id)
    setSaved(true)
    setError('')
  }

  const currentQuery = mode === 'planet' ? selectedPlanet : (selectedProblem || customProblem)
  const planetData = PLANETS.find(p => p.name === selectedPlanet)

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', fontFamily: "'Crimson Pro', Georgia, serif" }}>

      {/* History sidebar */}
      <div style={{ width: 200, flexShrink: 0, background: '#110228', borderRight: '1px solid rgba(201,168,76,0.12)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '12px 10px 8px', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
          <div style={{ fontFamily: 'sans-serif', fontSize: '0.68rem', letterSpacing: '0.1em', color: 'rgba(201,168,76,0.6)' }}>MY SAVED REMEDIES</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {loadingHistory ? (
            <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.78rem', padding: '8px', fontStyle: 'italic' }}>Loading...</div>
          ) : history.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.78rem', padding: '8px', fontStyle: 'italic', lineHeight: 1.5 }}>Your generated remedy plans will appear here</div>
          ) : history.map(item => (
            <div key={item.id} onClick={() => loadHistory(item)}
              style={{ padding: '8px 9px', borderRadius: 7, marginBottom: 5, cursor: 'pointer', background: activeHistoryId === item.id ? 'rgba(201,168,76,0.1)' : 'transparent', border: `1px solid ${activeHistoryId === item.id ? 'rgba(201,168,76,0.25)' : 'transparent'}`, transition: 'all 0.15s' }}>
              <div style={{ color: '#e8dcc8', fontSize: '0.82rem', fontWeight: 600 }}>{item.query}</div>
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', fontFamily: 'sans-serif', marginTop: 2 }}>
                {item.queryType === 'planet' ? '🪐 Planet' : '🔍 Problem'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '10px 18px', background: '#110228', borderBottom: '1px solid rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <span style={{ color: '#c9a84c', fontSize: '1.1rem' }}>✦</span>
          <span style={{ fontFamily: 'sans-serif', fontSize: '0.82rem', letterSpacing: '0.1em', color: '#c9a84c', fontWeight: 600 }}>REMEDIES ENGINE</span>
          <span style={{ marginLeft: 'auto', fontFamily: 'sans-serif', fontSize: '0.72rem', color: 'rgba(255,255,255,0.25)' }}>Vedic · Lal Kitab · Bhrigu · Numerology</span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ maxWidth: 780, margin: '0 auto', padding: '18px 20px' }}>

            {/* Mode toggle */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 18, background: '#110228', padding: 4, borderRadius: 10, border: '1px solid rgba(201,168,76,0.12)' }}>
              {['planet', 'problem'].map(m => (
                <button key={m} onClick={() => { setMode(m); setResult(null); setError('') }}
                  style={{ flex: 1, padding: '8px', borderRadius: 7, cursor: 'pointer', fontFamily: 'sans-serif', fontSize: '0.78rem', letterSpacing: '0.07em', fontWeight: 600, transition: 'all 0.15s',
                    background: mode === m ? 'rgba(201,168,76,0.15)' : 'transparent',
                    color: mode === m ? '#c9a84c' : 'rgba(232,220,200,0.4)',
                    border: mode === m ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent'
                  }}>
                  {m === 'planet' ? '🪐 Search by Planet' : '🔍 Search by Problem'}
                </button>
              ))}
            </div>

            {/* Planet selector */}
            {mode === 'planet' && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.6)', marginBottom: 10 }}>SELECT THE PLANET</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {PLANETS.map(p => (
                    <button key={p.name} onClick={() => setSelectedPlanet(p.name)}
                      style={{ padding: '10px 8px', borderRadius: 9, cursor: 'pointer', transition: 'all 0.15s', textAlign: 'center',
                        background: selectedPlanet === p.name ? p.bg : '#130228',
                        border: `1px solid ${selectedPlanet === p.name ? p.border : 'rgba(201,168,76,0.1)'}`,
                      }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: 3 }}>{p.icon}</div>
                      <div style={{ color: selectedPlanet === p.name ? p.color : '#e8dcc8', fontFamily: 'sans-serif', fontSize: '0.78rem', fontWeight: 600 }}>{p.name}</div>
                      <div style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'sans-serif', fontSize: '0.65rem' }}>{p.hindi}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Problem selector */}
            {mode === 'problem' && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em', color: 'rgba(201,168,76,0.6)', marginBottom: 10 }}>SELECT YOUR PROBLEM OR TYPE BELOW</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 12 }}>
                  {PROBLEMS.map(p => (
                    <button key={p} onClick={() => { setSelectedProblem(p); setCustomProblem('') }}
                      style={{ padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'serif', transition: 'all 0.15s',
                        background: selectedProblem === p ? 'rgba(201,168,76,0.12)' : '#130228',
                        border: `1px solid ${selectedProblem === p ? 'rgba(201,168,76,0.35)' : 'rgba(201,168,76,0.12)'}`,
                        color: selectedProblem === p ? '#c9a84c' : 'rgba(232,220,200,0.6)'
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
                <input
                  value={customProblem}
                  onChange={e => { setCustomProblem(e.target.value); setSelectedProblem(null) }}
                  placeholder="Or describe your specific problem in your own words..."
                  style={{ width: '100%', background: '#1a0533', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 9, padding: '9px 13px', color: '#e8dcc8', fontFamily: 'serif', fontSize: '0.95rem', outline: 'none' }}
                />
              </div>
            )}

            {error && <div style={{ padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, color: '#f87171', fontSize: '0.82rem', marginBottom: 14 }}>⚠ {error}</div>}

            {/* Generate button */}
            <button onClick={generate} disabled={loading || !currentQuery}
              style={{ width: '100%', padding: '12px', borderRadius: 9, border: 'none', cursor: loading || !currentQuery ? 'not-allowed' : 'pointer', fontFamily: 'sans-serif', fontSize: '0.82rem', letterSpacing: '0.08em', fontWeight: 700, marginBottom: 22, transition: 'all 0.2s',
                background: loading || !currentQuery ? '#240740' : 'linear-gradient(135deg, #8a6e2e, #c9a84c)',
                color: loading || !currentQuery ? 'rgba(255,255,255,0.3)' : '#0b0118'
              }}>
              {loading ? '✦ CONSULTING THE COSMIC LIBRARY...' : `✦ GENERATE REMEDY PLAN${currentQuery ? ` FOR ${currentQuery.toUpperCase().replace(/[^A-Z\s]/g,'').trim()}` : ''}`}
            </button>

            {/* Loading shimmer */}
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'rgba(201,168,76,0.6)' }}>
                <div style={{ fontSize: '2.5rem', animation: 'pulse 1.5s infinite', marginBottom: 12 }}>✦</div>
                <div style={{ fontFamily: 'sans-serif', fontSize: '0.75rem', letterSpacing: '0.12em', marginBottom: 6 }}>CONSULTING VEDIC · LAL KITAB · BHRIGU · NUMEROLOGY</div>
                <div style={{ fontFamily: 'serif', fontSize: '0.85rem', color: 'rgba(232,220,200,0.4)', fontStyle: 'italic' }}>Preparing your personalised remedy plan...</div>
              </div>
            )}

            {/* Results */}
            {result && !loading && (
              <div className="fade-in">
                {saved && (
                  <div style={{ padding: '7px 12px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, color: '#86efac', fontSize: '0.8rem', fontFamily: 'sans-serif', marginBottom: 14 }}>
                    ✓ Saved to your profile in Firestore
                  </div>
                )}

                {/* Title & summary */}
                <div style={{ background: '#1a0533', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {planetData && <span style={{ fontSize: '2rem', flexShrink: 0 }}>{planetData.icon}</span>}
                    <div>
                      <h2 style={{ color: '#c9a84c', fontFamily: 'sans-serif', fontSize: '1rem', letterSpacing: '0.06em', fontWeight: 700, marginBottom: 6 }}>{result.title}</h2>
                      <p style={{ color: 'rgba(232,220,200,0.75)', fontSize: '0.9rem', lineHeight: 1.7 }}>{result.summary}</p>
                    </div>
                  </div>
                  {result.timeline && (
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(201,168,76,0.1)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <div><span style={{ color: 'rgba(201,168,76,0.55)', fontSize: '0.68rem', fontFamily: 'sans-serif', letterSpacing: '0.08em' }}>EXPECTED RESULTS</span><br/><span style={{ color: '#e8dcc8', fontSize: '0.85rem' }}>{result.timeline}</span></div>
                      {result.cautions && <div style={{ flex: 1 }}><span style={{ color: 'rgba(239,68,68,0.7)', fontSize: '0.68rem', fontFamily: 'sans-serif', letterSpacing: '0.08em' }}>CAUTIONS</span><br/><span style={{ color: 'rgba(232,220,200,0.65)', fontSize: '0.82rem' }}>{result.cautions}</span></div>}
                    </div>
                  )}
                </div>

                {/* Priority notice */}
                {result.priority?.length > 0 && (
                  <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 8, padding: '9px 13px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: '1rem' }}>⚡</span>
                    <div>
                      <span style={{ color: 'rgba(201,168,76,0.8)', fontFamily: 'sans-serif', fontSize: '0.7rem', letterSpacing: '0.08em' }}>BEGIN WITH THESE 3 REMEDIES FIRST: </span>
                      <span style={{ color: '#c9a84c', fontSize: '0.82rem', fontWeight: 600 }}>{result.priority?.join(' · ')}</span>
                    </div>
                  </div>
                )}

                {/* Remedy cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.remedies?.map((remedy, i) => (
                    <RemedyCard
                      key={i}
                      remedy={remedy}
                      isPriority={result.priority?.includes(remedy.category)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
