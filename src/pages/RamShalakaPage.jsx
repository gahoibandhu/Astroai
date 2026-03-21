// src/pages/RamShalakaPage.jsx
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { saveRamShalakaReading } from '../utils/firebase'
import { useAuth } from '../hooks/useAuth'

const GRID = [
  ['ह','र','आ','ज','र','त'],
  ['न','म','स','ह','श','र'],
  ['च','ि','त','र','ा','ण'],
  ['म','क','र','म','ह','म'],
  ['ज','ा','न','क','ी','स'],
  ['भ','व','न','ि','ह','ा'],
]

export default function RamShalakaPage() {
  const { user } = useAuth()
  const [selected, setSelected] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [question, setQuestion] = useState('')
  const [phase, setPhase] = useState('question')

  const handleCellClick = (r, c) => {
    if (phase !== 'picking' || selected.length >= 9) return
    const key = `${r}-${c}`
    if (selected.find(s => s.key === key)) return
    const newSel = [...selected, { key, char: GRID[r][c], r, c }]
    setSelected(newSel)
    if (newSel.length === 9) fetchResult(newSel)
  }

  const fetchResult = async (sel) => {
    setLoading(true)
    try {
      const res = await fetch('/.netlify/functions/ramshalaka', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, selectedChars: sel.map(s => s.char).join(''), positions: sel.map(s => ({ r: s.r, c: s.c })) })
      })
      const data = await res.json()
      setResult(data.answer)
      setPhase('result')
      // Save to Firestore
      if (user?.uid) {
        saveRamShalakaReading({ uid: user.uid, question, selectedChars: sel.map(s => s.char).join(''), answer: data.answer }).catch(console.error)
      }
    } catch (e) {
      setResult('Could not fetch oracle reading. Please try again.')
      setPhase('result')
    }
    setLoading(false)
  }

  const reset = () => { setSelected([]); setResult(null); setQuestion(''); setPhase('question') }

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <span style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>ॐ</span>
        <span style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.85rem', letterSpacing: '0.08em' }}>RAM SHALAKA</span>
      </div>
      <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '1.5rem', fontStyle: 'italic' }}>
          Ask your question with a pure heart. Then pick 9 squares — trust your intuition.
        </p>

        {phase === 'question' && (
          <div className="fade-in">
            <textarea value={question} onChange={e => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              rows={3} style={{ width: '100%', background: 'var(--bg-2)', border: '1px solid var(--border)', borderRadius: '12px', padding: '0.8rem', color: 'var(--text)', fontFamily: 'var(--font-body)', fontSize: '1rem', outline: 'none', resize: 'none', marginBottom: '1rem' }} />
            <button className="btn btn-gold" disabled={!question.trim()} onClick={() => setPhase('picking')}
              style={{ width: '100%', justifyContent: 'center', fontSize: '0.82rem', padding: '0.9em' }}>
              ॐ Proceed to Oracle Grid
            </button>
          </div>
        )}

        {phase === 'picking' && (
          <div className="fade-in">
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>Your question: <em style={{ color: 'var(--text)' }}>{question}</em></div>
              <div style={{ color: 'var(--gold)', fontSize: '0.8rem', fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}>Pick {9 - selected.length} more squares</div>
            </div>
            <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(6, 52px)', gap: '6px', marginBottom: '1rem' }}>
              {GRID.map((row, r) => row.map((char, c) => {
                const key = `${r}-${c}`
                const isSelected = !!selected.find(s => s.key === key)
                const selIndex = isSelected ? selected.findIndex(s => s.key === key) + 1 : null
                return (
                  <div key={key} onClick={() => handleCellClick(r, c)} style={{
                    width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isSelected ? 'rgba(201,168,76,0.2)' : 'var(--bg-2)',
                    border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: '8px', cursor: 'pointer', fontSize: '1.3rem',
                    color: isSelected ? 'var(--gold)' : 'var(--text)', fontFamily: 'serif',
                    transition: 'all 0.15s', position: 'relative', userSelect: 'none'
                  }}>
                    {char}
                    {selIndex && <span style={{ position: 'absolute', top: 2, right: 4, fontSize: '0.6rem', color: 'var(--gold-dim)' }}>{selIndex}</span>}
                  </div>
                )
              }))}
            </div>
            {loading && <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', animation: 'pulse 1.5s infinite' }}>ॐ Reading the oracle...</div>}
          </div>
        )}

        {phase === 'result' && result && (
          <div className="fade-in">
            <div style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--gold)' }}>ॐ</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginBottom: '0.5rem', fontStyle: 'italic' }}>{question}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '1.2rem' }}>Selected: {selected.map(s => s.char).join(' · ')}</div>
            <div className="card" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-display)', color: 'var(--gold)', fontSize: '0.78rem', letterSpacing: '0.08em', marginBottom: '0.8rem' }}>✦ ORACLE SPEAKS</div>
              <div className="md-content" style={{ lineHeight: 1.8 }}><ReactMarkdown>{result}</ReactMarkdown></div>
            </div>
            <button className="btn btn-ghost" onClick={reset} style={{ margin: '0 auto', display: 'flex' }}>Ask Another Question</button>
          </div>
        )}
      </div>
    </div>
  )
}
