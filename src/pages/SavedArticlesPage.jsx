import { useState } from 'react'
import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo } from '../lib/utils'
import { loadSavedArticles, saveSavedArticles, loadTrackers } from '../lib/storage'

function Thumbnail({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <div className="article-thumb" style={{ width: 96, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setFailed(true)} />
    </div>
  )
}

export default function SavedArticlesPage({ ctx }) {
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)

  const savedArticles = loadSavedArticles()
  const trackers = loadTrackers()

  const unsave = (id) => {
    saveSavedArticles(loadSavedArticles().filter(a => a.id !== id))
    refresh()
  }

  const getTrackerName = (trackerId) => trackers.find(t => t.id === trackerId)?.name || null

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title">
            <span className="title-ico"><SvgIcon id="ico-bookmark-fill" size={22} /></span>
            Saved
          </div>
          <div className="section-sub">{savedArticles.length} bookmarked article{savedArticles.length !== 1 ? 's' : ''}</div>
        </div>
        {savedArticles.length > 0 && (
          <button
            className="btn btn-sm btn-danger"
            onClick={() => { saveSavedArticles([]); refresh() }}
          >
            <SvgIcon id="ico-trash" size={14} /> Clear All
          </button>
        )}
      </div>

      {savedArticles.length === 0 ? (
        <div className="anim anim-2" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ marginBottom: 12, opacity: 0.3 }}><SvgIcon id="ico-bookmark" size={36} /></div>
          <div style={{ color: 'var(--muted-fg)', fontSize: 14, marginBottom: 6 }}>No saved articles yet</div>
          <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>Bookmark articles from your trackers using the <SvgIcon id="ico-bookmark" size={11} /> icon</div>
        </div>
      ) : (
        <div className="anim anim-2">
          <div className="card">
            <div className="article-list">
              {savedArticles.map(a => {
                const trackerName = getTrackerName(a.fromTracker)
                return (
                  <div key={a.id} className="article-card" style={{ position: 'relative' }}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit', alignItems: 'flex-start' }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                            {a.favicon
                              ? <img src={a.favicon} alt="" style={{ width: 14, height: 14 }} onError={e => { e.target.style.display = 'none' }} />
                              : <SvgIcon id="ico-rss" size={11} />}
                          </div>
                          <div className="article-source">{a.source || 'Web'}</div>
                        </div>
                        <div className="article-title" style={{ paddingRight: a.thumbnail ? 0 : 28 }}>{a.title}</div>
                        {a.snippet && <div className="article-snippet">{a.snippet}</div>}
                        <div className="article-time">
                          {trackerName && <><span style={{ color: 'var(--accent)', opacity: 0.8 }}>{trackerName}</span> · </>}
                          {a.keyword && <>{a.keyword} · </>}
                          {a.publishedAt ? getTimeAgo(a.publishedAt) : ''}
                          {a.savedAt && <> · saved {getTimeAgo(a.savedAt)}</>}
                        </div>
                      </div>
                      <Thumbnail src={a.thumbnail} />
                    </a>
                    <button
                      onClick={() => unsave(a.id)}
                      style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 4, transition: 'color 0.15s' }}
                      title="Unsave"
                    >
                      <SvgIcon id="ico-bookmark-fill" size={16} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
