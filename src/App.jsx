import { useState, useEffect, useCallback, useRef } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthScreen from './components/AuthScreen'
import IconSprite from './components/IconSprite'
import { SvgIcon } from './components/IconSprite'
import TrackerPage from './pages/TrackerPage'
import TrackerModal from './components/TrackerModal'
import { loadHue, saveHue, loadPrefs, savePrefs } from './lib/storage'

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
  const [prefs, setPrefs] = useState(() => loadPrefs())
  const [customizeOpen, setCustomizeOpen] = useState(false)
  const customizeRef = useRef(null)
  const [showHome, setShowHome] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [homeKey, setHomeKey] = useState(0)
  const [newTrackerId, setNewTrackerId] = useState(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-hue', hue)
    saveHue(hue)
  }, [hue])

  useEffect(() => {
    const html = document.documentElement
    prefs.compact ? html.setAttribute('data-compact', '') : html.removeAttribute('data-compact')
    prefs.hideHero ? html.setAttribute('data-hide-hero', '') : html.removeAttribute('data-hide-hero')
    savePrefs(prefs)
  }, [prefs])

  const togglePref = key => setPrefs(p => ({ ...p, [key]: !p[key] }))

  useEffect(() => {
    if (!customizeOpen) return
    const handler = e => { if (customizeRef.current && !customizeRef.current.contains(e.target)) setCustomizeOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [customizeOpen])

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

  const ctx = { user, toast, setTrackerModalOpen, setEditingTrackerId, initialKeyword, setInitialKeyword, showHome, setShowHome, showSaved, setShowSaved, homeKey, newTrackerId, setNewTrackerId }

  const hues = ['purple', 'blue', 'green', 'red', 'orange', 'pink', 'yellow', 'white']

  return (
    <>
      <IconSprite />

      {/* Topbar */}
      <div className="tracker-topbar">
        <button className="tracker-topbar-brand" onClick={() => { setShowHome(true); setShowSaved(false); setHomeKey(k => k + 1) }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <div className="tracker-topbar-logo">
            <div style={{
              width: 44, height: 44,
              background: 'var(--accent)',
              WebkitMaskImage: 'url(/tracker1.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskImage: 'url(/tracker1.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
            }} />
          </div>
          <span className="tracker-topbar-title">Tracker</span>
        </button>
        <div className="tracker-topbar-right">
          {/* My Trackers nav */}
          <button
            className={`btn btn-sm${!showHome && !showSaved ? ' btn-primary' : ''}`}
            onClick={() => { setShowHome(false); setShowSaved(false) }}
            style={{ gap: 5 }}
          >
            <SvgIcon id="ico-rss" size={14} />
            My Trackers
          </button>

          {/* Saved nav */}
          <button
            className={`btn btn-sm${showSaved ? ' btn-primary' : ''}`}
            onClick={() => { setShowSaved(s => !s); setShowHome(false) }}
            style={{ gap: 5 }}
          >
            <SvgIcon id={showSaved ? 'ico-bookmark-fill' : 'ico-bookmark'} size={14} />
            Saved
          </button>

          {/* Customize button */}
          <div ref={customizeRef} style={{ position: 'relative' }}>
            <button
              className={`btn btn-sm${customizeOpen ? ' btn-primary' : ''}`}
              onClick={() => setCustomizeOpen(o => !o)}
              title="Customize"
            >
              <SvgIcon id="ico-sliders" size={13} />
              Customize
            </button>
            {customizeOpen && (
              <div
                style={{
                  position: 'absolute', top: 'calc(100% + 10px)', right: 0,
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                  borderRadius: 'var(--radius-lg)', padding: '20px', width: 260,
                  boxShadow: 'var(--shadow-lg)', zIndex: 200, animation: 'slideModal 0.2s ease',
                }}
              >
                {/* Tagline */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>Your tracker, your way.</div>
                  <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 3 }}>Personalise the look and feel.</div>
                </div>

                {/* Accent colour */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Accent colour</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {hues.map(h => {
                      const color = h === 'purple' ? '#b9a9ff' : h === 'blue' ? '#60b4ff' : h === 'green' ? '#4affaa' : h === 'red' ? '#ff6e7f' : h === 'orange' ? '#ffa050' : h === 'pink' ? '#ff78c8' : h === 'yellow' ? '#ffdc50' : '#d2daf0'
                      return (
                        <button key={h} onClick={() => setHue(h)} title={h} style={{
                          width: 22, height: 22, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
                          background: color,
                          boxShadow: hue === h ? `0 0 0 2px var(--bg-elevated), 0 0 0 3.5px ${color}` : 'none',
                          opacity: hue === h ? 1 : 0.45,
                          transition: 'all 0.15s ease',
                        }} />
                      )
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Display</div>
                  {[
                    { key: 'compact', label: 'Compact mode', sub: 'Tighter spacing throughout' },
                    { key: 'hideHero', label: 'Show article list only', sub: 'Hides the hero image section' },
                  ].map(({ key, label, sub }) => (
                    <button key={key} onClick={() => togglePref(key)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      background: 'none', border: 'none', cursor: 'pointer', padding: '10px 0',
                      borderBottom: '1px solid var(--border)', width: '100%', textAlign: 'left',
                    }}>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-strong)' }}>{label}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted-fg)', marginTop: 1 }}>{sub}</div>
                      </div>
                      {/* Toggle pill */}
                      <div style={{
                        width: 36, height: 20, borderRadius: 10, flexShrink: 0, marginLeft: 12,
                        background: prefs[key] ? 'var(--accent)' : 'var(--border-strong)',
                        position: 'relative', transition: 'background 0.2s ease',
                      }}>
                        <div style={{
                          position: 'absolute', top: 3, left: prefs[key] ? 19 : 3,
                          width: 14, height: 14, borderRadius: '50%', background: '#fff',
                          transition: 'left 0.2s ease',
                        }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
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
