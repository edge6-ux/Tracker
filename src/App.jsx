import { useState, useEffect, useCallback } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthScreen from './components/AuthScreen'
import IconSprite from './components/IconSprite'
import { SvgIcon } from './components/IconSprite'
import TrackerPage from './pages/TrackerPage'
import TrackerModal from './components/TrackerModal'
import { loadHue, saveHue } from './lib/storage'

function Shell() {
  const { user, loading, signOut } = useAuth()
  const [trackerModalOpen, setTrackerModalOpen] = useState(false)
  const [editingTrackerId, setEditingTrackerId] = useState(null)
  const [initialKeyword, setInitialKeyword] = useState('')
  const [toasts, setToasts] = useState([])
  const [avatarOpen, setAvatarOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [hue, setHue] = useState(() => loadHue())
  const [showHome, setShowHome] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [homeKey, setHomeKey] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-hue', hue)
    saveHue(hue)
  }, [hue])

  // Close auth modal when user signs in
  useEffect(() => {
    if (user) setAuthModalOpen(false)
  }, [user])

  const toast = useCallback((msg, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <div className="tracker-loading-spinner" style={{ width: 32, height: 32 }} />
      </div>
    )
  }

  const ctx = { user, toast, setTrackerModalOpen, setEditingTrackerId, initialKeyword, setInitialKeyword, showHome, setShowHome, showSaved, setShowSaved, homeKey }

  const hues = ['purple', 'blue', 'green', 'red', 'orange', 'pink', 'yellow', 'white']

  return (
    <>
      <IconSprite />

      {/* Topbar */}
      <div className="tracker-topbar">
        <button className="tracker-topbar-brand" onClick={() => { setShowHome(true); setShowSaved(false); setHomeKey(k => k + 1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div className="tracker-topbar-logo">
            <img src="/tracker1.png" alt="Tracker" style={{ width: 44, height: 44, objectFit: 'contain', display: 'block', filter: 'brightness(0) invert(1)' }} />
          </div>
          <span className="tracker-topbar-title">Tracker</span>
        </button>
        <div className="tracker-topbar-right">
          {/* Saved nav */}
          <button
            className={`btn btn-sm${showSaved ? ' btn-primary' : ''}`}
            onClick={() => { setShowSaved(s => !s); setShowHome(false) }}
            style={{ gap: 5 }}
          >
            <SvgIcon id={showSaved ? 'ico-bookmark-fill' : 'ico-bookmark'} size={14} />
            Saved
          </button>

          {/* Hue picker */}
          <div className="topbar-hue" style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {hues.map(h => (
              <button
                key={h}
                onClick={() => setHue(h)}
                title={h}
                style={{
                  width: 14, height: 14, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                  background: h === 'purple' ? '#b9a9ff' : h === 'blue' ? '#60b4ff' : h === 'green' ? '#4affaa' : h === 'red' ? '#ff6e7f' : h === 'orange' ? '#ffa050' : h === 'pink' ? '#ff78c8' : h === 'yellow' ? '#ffdc50' : '#d2daf0',
                  boxShadow: hue === h ? `0 0 0 2px var(--bg), 0 0 0 3px ${h === 'purple' ? '#b9a9ff' : 'currentColor'}` : 'none',
                  opacity: hue === h ? 1 : 0.5,
                  transition: 'all 0.15s ease'
                }}
              />
            ))}
          </div>

          {/* Avatar / sign-out (logged in) or Sign In button (guest) */}
          {user ? (
            <div className="topbar-avatar-wrap">
              <div className="topbar-avatar" onClick={() => setAvatarOpen(o => !o)}>
                {user.email?.[0]?.toUpperCase() || '?'}
              </div>
              {avatarOpen && (
                <div className="signout-popover" onClick={() => setAvatarOpen(false)}>
                  <div className="signout-email">{user.email}</div>
                  <button className="btn btn-sm btn-danger" style={{ width: '100%', justifyContent: 'center' }} onClick={signOut}>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setAuthModalOpen(true)}>
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Guest banner */}
      {!user && !bannerDismissed && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 20px', background: 'var(--accent-subtle)',
          borderBottom: '1px solid var(--border)', fontSize: 13, gap: 12
        }}>
          <span style={{ color: 'var(--text)' }}>
            Create a free account to save your trackers across devices.
          </span>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button className="btn btn-primary btn-sm" onClick={() => setAuthModalOpen(true)}>Create Account</button>
            <button
              onClick={() => setBannerDismissed(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: '2px 4px', fontSize: 16, lineHeight: 1 }}
              title="Dismiss"
            >×</button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="tracker-main">
        <TrackerPage ctx={ctx} />
      </div>

      {/* Tracker Modal */}
      {trackerModalOpen && <TrackerModal ctx={ctx} />}

      {/* Auth Modal */}
      {authModalOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 8000 }}
          onClick={e => { if (e.target === e.currentTarget) setAuthModalOpen(false) }}
        >
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setAuthModalOpen(false)}
              style={{ position: 'absolute', top: -12, right: -12, zIndex: 1, background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--muted)', fontSize: 16, lineHeight: 1 }}
              title="Close"
            >×</button>
            <AuthScreen onContinueAsGuest={() => setAuthModalOpen(false)} />
          </div>
        </div>
      )}

      {/* Toasts */}
      <div className="toast-container" style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9000 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  )
}
