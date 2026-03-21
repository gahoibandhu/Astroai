import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { to: '/',            icon: '◎',  label: 'Chat' },
  { to: '/kundli',      icon: '⊕',  label: 'Kundli' },
  { to: '/prashna',     icon: '🔮', label: 'Prashna' },
  { to: '/panchang',    icon: '☽',  label: 'Panchang' },
  { to: '/remedies',    icon: '✦',  label: 'Remedies' },
  { to: '/ramshalaka',  icon: 'ॐ',  label: 'Ram Shalaka' },
  { to: '/predictions', icon: '📊', label: 'Test Predictions' },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = async () => { await logout(); navigate('/login') }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      <aside style={{ width:'210px', flexShrink:0, background:'var(--bg-1)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'1.2rem 0.9rem' }}>
        <div style={{ textAlign:'center', marginBottom:'1.5rem' }}>
          <div style={{ fontSize:'1.5rem', marginBottom:'0.25rem' }}>✦</div>
          <div style={{ fontFamily:'var(--font-display)', color:'var(--gold)', fontSize:'0.95rem', letterSpacing:'0.12em' }}>ASTRO AI</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.62rem', letterSpacing:'0.08em', marginTop:'0.15rem' }}>VEDIC GUIDE</div>
        </div>
        <div style={{ borderTop:'1px solid var(--border)', marginBottom:'1rem' }} />
        <nav style={{ flex:1 }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to==='/'} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:'9px',
              padding:'0.55rem 0.75rem', borderRadius:'8px', marginBottom:'0.22rem',
              textDecoration:'none', fontFamily:'var(--font-display)',
              fontSize:'0.72rem', letterSpacing:'0.07em',
              color: isActive ? 'var(--gold)' : 'var(--text-dim)',
              background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(201,168,76,0.2)' : '1px solid transparent',
              transition:'all 0.2s'
            })}>
              <span style={{ fontSize:'0.95rem', width:18, textAlign:'center' }}>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
          <div style={{ borderTop:'1px solid var(--border)', margin:'0.5rem 0' }} />
          <NavLink to="/admin" style={({ isActive }) => ({
            display:'flex', alignItems:'center', gap:'9px',
            padding:'0.55rem 0.75rem', borderRadius:'8px',
            textDecoration:'none', fontFamily:'var(--font-display)',
            fontSize:'0.68rem', letterSpacing:'0.06em',
            color: isActive ? '#ef4444' : 'rgba(255,255,255,0.2)',
            background: isActive ? 'rgba(239,68,68,0.08)' : 'transparent',
            border: isActive ? '1px solid rgba(239,68,68,0.15)' : '1px solid transparent',
            transition:'all 0.2s'
          })}>
            <span style={{ fontSize:'0.95rem', width:18, textAlign:'center' }}>🔐</span>
            Admin
          </NavLink>
        </nav>
        <div style={{ borderTop:'1px solid var(--border)', paddingTop:'0.9rem' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'0.55rem', marginBottom:'0.7rem' }}>
            {user?.photoURL
              ? <img src={user.photoURL} alt="" style={{ width:28, height:28, borderRadius:'50%', border:'1px solid var(--border)' }} />
              : <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.8rem', color:'var(--gold)' }}>✦</div>
            }
            <div style={{ overflow:'hidden', minWidth:0 }}>
              <div style={{ color:'var(--text)', fontSize:'0.82rem', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name?.split(' ')[0]}</div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.64rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-ghost" onClick={handleLogout} style={{ width:'100%', fontSize:'0.65rem', justifyContent:'center', padding:'0.45em' }}>Sign out</button>
        </div>
      </aside>
      <main style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column' }}>{children}</main>
    </div>
  )
}
