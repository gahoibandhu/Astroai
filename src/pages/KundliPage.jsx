// src/pages/KundliPage.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { saveKundli, getUserKundlis } from '../utils/firebase'
import ReactMarkdown from 'react-markdown'

const FIELDS = [
  { key: 'name', label: 'Full Name', type: 'text', placeholder: 'As on birth certificate' },
  { key: 'dob', label: 'Date of Birth', type: 'date' },
  { key: 'tob', label: 'Time of Birth', type: 'time' },
  { key: 'pob', label: 'Place of Birth', type: 'text', placeholder: 'City, Country (e.g. Delhi, India)' },
]

export default function KundliPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({ name: '', dob: '', tob: '', pob: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [savedKundlis, setSavedKundlis] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  useEffect(() => {
    if (user?.uid) {
      getUserKundlis(user.uid)
        .then(setSavedKundlis)
        .catch(console.error)
        .finally(() => setLoadingHistory(false))
    }
  }, [user])

  const generate = async () => {
    if (!form.name || !form.dob || !form.tob || !form.pob) {
      setError('Please fill all fields.'); return
    }
    setError(''); setLoading(true); setResult(null); setSaved(false)
    try {
      const res = await fetch('/.netlify/functions/kundli', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, userId: user.uid })
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setResult(data)
      // Save to Firestore
      const id = await saveKundli({ uid: user.uid, ...form, chartData: data })
      setSaved(true)
      setSavedKundlis(prev => [{ id, ...form, createdAt: { toDate: () => new Date() } }, ...prev])
    } catch (e) {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar: saved kundlis */}
      <div style={{ width: '220px', flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--bg-1)', overflowY: 'auto', padding: '1rem' }}>
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.72rem', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>SAVED KUNDLIS</div>
        {loadingHistory
          ? <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
          : savedKundlis.length === 0
            ? <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>None yet</div>
            : savedKundlis.map(k => (
              <div key={k.id} style={{ padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.5rem', cursor: 'pointer', background: 'var(--bg-2)' }}>
                <div style={{ color: 'var(--text)', fontSize: '0.85rem', fontWeight: 600 }}>{k.name}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{k.dob} · {k.pob}</div>
              </div>
            ))
        }
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', maxWidth: '680px' }}>
        <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '1.2rem' }}>⊕ KUNDLI GENERATOR</div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '1rem', letterSpacing: '0.08em', marginBottom: '1.2rem' }}>✦ BIRTH DETAILS</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {FIELDS.map(f => (
              <div key={f.key} style={{ gridColumn: f.key === 'name' || f.key === 'pob' ? 'span 2' : 'span 1' }}>
                <label style={{ display: 'block', color: 'var(--text-dim)', fontSize: '0.75rem', letterSpacing: '0.06em', marginBottom: '0.4rem', fontFamily: 'var(--font-display)' }}>
                  {f.label.toUpperCase()}
                </label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder || ''} className="input-field" style={{ colorScheme: 'dark' }} />
              </div>
            ))}
          </div>
          {error && <div style={{ marginTop: '0.8rem', color: '#f87171', fontSize: '0.85rem', padding: '0.6rem', background: 'rgba(248,113,113,0.08)', borderRadius: '6px' }}>⚠ {error}</div>}
          <button onClick={generate} disabled={loading} className="btn btn-gold"
            style={{ marginTop: '1.2rem', width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '0.8em' }}>
            {loading ? 'Generating...' : '✦ Generate Kundli & Analysis'}
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '2rem', animation: 'pulse 1.5s infinite', marginBottom: '0.8rem' }}>✦</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>READING THE COSMIC MAP...</div>
          </div>
        )}

        {result && (
          <div className="fade-in">
            {saved && <div style={{ padding: '0.6rem 1rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', marginBottom: '1rem', color: '#86efac', fontSize: '0.82rem' }}>✓ Saved to Firestore</div>}
            {result.planets && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '1rem' }}>PLANET POSITIONS</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem' }}>
                  {result.planets.map(p => (
                    <div key={p.name} style={{ background: 'var(--bg-3)', borderRadius: '8px', padding: '0.6rem 0.8rem', border: '1px solid var(--border)' }}>
                      <div style={{ color: 'var(--gold)', fontSize: '0.75rem', fontFamily: 'var(--font-display)' }}>{p.name}</div>
                      <div style={{ color: 'var(--text)', fontSize: '0.9rem', marginTop: '0.2rem' }}>{p.rashi}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>House {p.house}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result.analysis && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.08em', marginBottom: '1rem' }}>✦ AI ANALYSIS</h3>
                <div className="md-content" style={{ lineHeight: 1.8 }}>
                  <ReactMarkdown>{result.analysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
