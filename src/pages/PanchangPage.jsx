// src/pages/PanchangPage.jsx
import { useState, useEffect } from 'react'
import { getCachedPanchang, cachePanchang } from '../utils/firebase'

const WEEKDAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export default function PanchangPage() {
  const [panchang, setPanchang] = useState(null)
  const [loading, setLoading] = useState(true)
  const [inputLoc, setInputLoc] = useState('Delhi, India')
  const [location, setLocation] = useState('Delhi, India')

  const fetchPanchang = async (loc) => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const cacheKey = `${today}_${loc.replace(/\s+/g, '_').toLowerCase()}`
    try {
      // Check Firestore cache first
      const cached = await getCachedPanchang(cacheKey)
      if (cached) { setPanchang(cached); setLoading(false); return }

      const res = await fetch('/.netlify/functions/panchang', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: loc, date: today })
      })
      const data = await res.json()
      setPanchang(data)
      // Cache in Firestore
      cachePanchang(cacheKey, data).catch(console.error)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { fetchPanchang(location) }, [])

  const today = new Date()
  const InfoCard = ({ label, value, icon }) => (
    <div style={{ background: 'var(--bg-3)', border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem' }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', letterSpacing: '0.08em', fontFamily: 'var(--font-display)', marginBottom: '0.3rem' }}>{icon} {label}</div>
      <div style={{ color: 'var(--text)', fontSize: '1.05rem', fontWeight: 600 }}>{value || '—'}</div>
    </div>
  )

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>☽</span>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>PANCHANG</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: 'auto' }}>
          {WEEKDAYS[today.getDay()]}, {today.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div style={{ padding: '2rem', maxWidth: '700px', margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.5rem' }}>
          <input className="input-field" value={inputLoc} onChange={e => setInputLoc(e.target.value)} placeholder="Enter your city" />
          <button className="btn btn-gold" onClick={() => { setLocation(inputLoc); fetchPanchang(inputLoc) }} style={{ flexShrink: 0, fontSize: '0.78rem' }}>Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '2.5rem', animation: 'pulse 1.5s infinite', marginBottom: '0.8rem' }}>☽</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>READING THE HEAVENS...</div>
          </div>
        ) : panchang ? (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              <InfoCard icon="🌙" label="TITHI" value={panchang.tithi} />
              <InfoCard icon="⭐" label="NAKSHATRA" value={panchang.nakshatra} />
              <InfoCard icon="☀" label="YOGA" value={panchang.yoga} />
              <InfoCard icon="◑" label="KARAN" value={panchang.karan} />
              <InfoCard icon="🌞" label="SUNRISE" value={panchang.sunrise} />
              <InfoCard icon="🌇" label="SUNSET" value={panchang.sunset} />
            </div>
            <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ fontSize: '1.5rem' }}>⚠️</div>
              <div>
                <div style={{ color: '#f43f5e', fontSize: '0.72rem', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>RAHU KAAL — AVOID AUSPICIOUS WORK</div>
                <div style={{ color: 'var(--text)', fontSize: '1.05rem', fontWeight: 600, marginTop: '0.2rem' }}>{panchang.rahukaal}</div>
              </div>
            </div>
            {panchang.abhijitMuhurat && (
              <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: '10px', padding: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ fontSize: '1.5rem' }}>✨</div>
                <div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.72rem', letterSpacing: '0.08em', fontFamily: 'var(--font-display)' }}>ABHIJIT MUHURAT — MOST AUSPICIOUS</div>
                  <div style={{ color: 'var(--text)', fontSize: '1.05rem', fontWeight: 600, marginTop: '0.2rem' }}>{panchang.abhijitMuhurat}</div>
                </div>
              </div>
            )}
            {panchang.guidance && (
              <div className="card">
                <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.78rem', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>✦ COSMIC GUIDANCE FOR TODAY</div>
                <div style={{ color: 'var(--text)', lineHeight: 1.7, fontStyle: 'italic' }}>{panchang.guidance}</div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Could not load. Please try again.</div>
        )}
      </div>
    </div>
  )
}
