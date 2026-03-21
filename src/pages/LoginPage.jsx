// src/pages/LoginPage.jsx — Google OAuth, no Firebase
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      await login()
      navigate('/')
    } catch (e) {
      setError('Sign-in was cancelled or blocked. Please try again.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: '2rem'
    }}>
      {/* Radial glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 50% at 50% 60%, rgba(139,92,246,0.12) 0%, transparent 70%)'
      }} />

      <div className="fade-in" style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        {/* Star */}
        <div style={{
          fontSize: '3.5rem', marginBottom: '1.2rem', color: 'var(--gold)',
          filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.4))'
        }}>✦</div>

        <h1 style={{
          fontFamily: 'var(--font-display)', color: 'var(--gold)',
          fontSize: '2rem', letterSpacing: '0.15em', marginBottom: '0.4rem'
        }}>ASTRO AI</h1>

        <p style={{ color: 'var(--text-dim)', fontSize: '1rem', marginBottom: '0.8rem', fontStyle: 'italic' }}>
          Your Personal Vedic Astrology Guide
        </p>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          Ask about your kundli, dashas, transits, remedies,<br />
          panchang, matchmaking, and more.
        </p>

        {/* Decorative divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span style={{ color: 'var(--gold)', fontSize: '0.7rem', letterSpacing: '0.1em' }}>BEGIN YOUR JOURNEY</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Google Sign-In button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
            width: '100%', padding: '0.9em 1.5em',
            background: loading ? 'var(--bg-3)' : 'var(--bg-2)',
            border: '1px solid var(--border-hover)',
            borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-display)', fontSize: '0.8rem', letterSpacing: '0.08em',
            color: 'var(--text)', transition: 'all 0.2s'
          }}
          onMouseOver={e => { if (!loading) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--bg-3)' }}}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-hover)'; e.currentTarget.style.background = loading ? 'var(--bg-3)' : 'var(--bg-2)' }}
        >
          {loading ? (
            <span style={{ animation: 'spin 1s linear infinite', display: 'block', fontSize: '1rem' }}>◌</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
          )}
          {loading ? 'SIGNING IN...' : 'CONTINUE WITH GOOGLE'}
        </button>

        {/* Fallback container for Google's rendered button if popup blocked */}
        <div id="google-signin-container" style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }} />

        {error && (
          <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '1rem' }}>⚠ {error}</p>
        )}

        <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '1.5rem', lineHeight: 1.6 }}>
          Your data is stored privately. We never share your information.
        </p>
      </div>
    </div>
  )
}
