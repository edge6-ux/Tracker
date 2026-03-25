import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AuthScreen({ onContinueAsGuest }) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setError('')
    setSuccess('')
    if (!email || !password) { setError('Enter email and password'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }

    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
      } else {
        const data = await signUp(email, password)
        if (!data.session) {
          setSuccess('Account created! Check your email to confirm, then sign in.')
          setMode('signin')
          return
        }
      }
    } catch (e) {
      setError(e.message || 'Authentication failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-screen">
      <div style={{ width: 380, maxWidth: '90vw' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--gradient-accent-chrome)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 28px var(--accent-glow)'
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M4 11a9 9 0 019 9M4 4a16 16 0 0116 16" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.9"/>
              <circle cx="5" cy="19" r="1.5" fill="#000" opacity="0.9"/>
            </svg>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.04em' }}>
            Tracker
          </div>
          <div style={{ color: 'var(--muted-fg)', fontSize: 13, marginTop: 4 }}>
            Track keywords and topics across the web
          </div>
        </div>

        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)', padding: 28,
          boxShadow: 'var(--shadow-card)'
        }}>
          {error && (
            <div style={{
              padding: '10px 14px', background: 'var(--danger-subtle)',
              border: '1px solid rgba(251,113,133,0.2)', borderRadius: 'var(--radius)',
              color: 'var(--danger)', fontSize: 12, marginBottom: 16
            }}>{error}</div>
          )}
          {success && (
            <div style={{
              padding: '10px 14px', background: 'var(--ok-subtle)',
              border: '1px solid rgba(74,222,128,0.2)', borderRadius: 'var(--radius)',
              color: 'var(--ok)', fontSize: 12, marginBottom: 16
            }}>{success}</div>
          )}

          <div className="form-group" style={{ marginBottom: 14 }}>
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 12 }} onClick={handleSubmit} disabled={submitting}>
            {submitting
              ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
              : (mode === 'signin' ? 'Sign In' : 'Create Account')
            }
          </button>

          <div style={{ textAlign: 'center', marginTop: 14 }}>
            <span style={{ color: 'var(--muted-fg)', fontSize: 12 }}>
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
            </span>
            <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setSuccess(''); }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0, marginLeft: 4 }}>
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </div>

          {onContinueAsGuest && (
            <div style={{ textAlign: 'center', marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
              <button onClick={onContinueAsGuest} style={{ background: 'none', border: 'none', color: 'var(--muted-fg)', fontSize: 12, cursor: 'pointer', padding: 0 }}>
                Continue without an account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
