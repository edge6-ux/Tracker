import { useState, useEffect, useRef } from 'react'

function TrackerThumbnail({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <div className="article-thumb" style={{ width: 96, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setFailed(true)} />
    </div>
  )
}
import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo } from '../lib/utils'
import { loadTrackers, saveTrackers, loadTrackerArticles, saveTrackerArticles, loadSavedArticles, saveSavedArticles } from '../lib/storage'
import { supabase } from '../lib/supabase'
import DiscoveryPage from './DiscoveryPage'
import SavedArticlesPage from './SavedArticlesPage'

function parseRSSItems(text) {
  const items = text.match(/<item[\s>][\s\S]*?<\/item>/gi) || []
  return items.map(chunk => {
    const get = tag => {
      const m = chunk.match(new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, 'i'))
      return m ? m[1].trim() : ''
    }
    const thumbnail = (
      chunk.match(/media:thumbnail[^>]+url=["']([^"']+)["']/i)?.[1] ||
      chunk.match(/enclosure[^>]+type=["']image\/[^"']*["'][^>]*url=["']([^"']+)["']/i)?.[1] ||
      chunk.match(/enclosure[^>]+url=["']([^"']+)["'][^>]*type=["']image\/[^"']*["']/i)?.[1] ||
      chunk.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] || ''
    )
    const enclosureType = chunk.match(/enclosure[^>]+type=["']([^"']+)["']/i)?.[1] || ''
    const enclosureLink = chunk.match(/enclosure[^>]+url=["']([^"']+)["']/i)?.[1] || ''
    return {
      title: get('title'),
      link: chunk.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim() || chunk.match(/<link[^>]+href=["']([^"']+)["']/i)?.[1] || '',
      pubDate: get('pubDate'),
      thumbnail: thumbnail?.startsWith('http') ? thumbnail : '',
      description: get('description'),
      enclosure: { type: enclosureType, link: enclosureLink },
    }
  })
}

async function fetchRSS(feedUrl) {
  try {
    const res = await fetch(`/api/rss?url=${encodeURIComponent(feedUrl)}`, { signal: AbortSignal.timeout(15000) })
    if (res.ok) {
      const items = parseRSSItems(await res.text())
      if (items.length > 0) return items
    }
  } catch { /* fall through */ }
  return []
}

const SOURCE_NORM = {
  foxnews: 'Fox News', foxnewsdigital: 'Fox News', foxsports: 'Fox Sports', foxbusiness: 'Fox Business',
  cnn: 'CNN', msnbc: 'MSNBC',
  nbcnews: 'NBC News', nbc: 'NBC News', nbcsports: 'NBC Sports',
  abcnews: 'ABC News', abc: 'ABC News',
  cbsnews: 'CBS News', cbs: 'CBS News', cbssports: 'CBS Sports',
  nytimes: 'New York Times', newyorktimes: 'New York Times', thenewyorktimes: 'New York Times',
  washingtonpost: 'Washington Post', thewashingtonpost: 'Washington Post',
  wsj: 'Wall Street Journal', wallstreetjournal: 'Wall Street Journal',
  reuters: 'Reuters',
  apnews: 'AP News', associatedpress: 'AP News',
  bbc: 'BBC', bbcnews: 'BBC', bbcsport: 'BBC Sport',
  espn: 'ESPN', theathletic: 'The Athletic', bleacherreport: 'Bleacher Report',
  sportingnews: 'Sporting News', sbnation: 'SB Nation',
  npr: 'NPR', axios: 'Axios', politico: 'Politico',
  bloomberg: 'Bloomberg', forbes: 'Forbes', fortune: 'Fortune',
  businessinsider: 'Business Insider', techcrunch: 'TechCrunch',
  theverge: 'The Verge', verge: 'The Verge', wired: 'Wired',
  zerohedge: 'ZeroHedge', marketwatch: 'MarketWatch',
  theguardian: 'The Guardian', guardian: 'The Guardian',
  theindependent: 'The Independent', independent: 'The Independent',
  dailymail: 'Daily Mail', nypost: 'New York Post', newyorkpost: 'New York Post',
  usatoday: 'USA Today', newsweek: 'Newsweek',
  thehill: 'The Hill', hill: 'The Hill',
  huffpost: 'HuffPost', huffingtonpost: 'HuffPost',
  breitbart: 'Breitbart', nationalreview: 'National Review',
  thedailybeast: 'The Daily Beast', dailybeast: 'The Daily Beast',
  slate: 'Slate', salon: 'Salon', vox: 'Vox',
  theatlantic: 'The Atlantic', atlantic: 'The Atlantic',
  yahoonews: 'Yahoo News', yahoofinance: 'Yahoo Finance', yahoo: 'Yahoo News',
  msn: 'MSN', time: 'TIME', variety: 'Variety', deadline: 'Deadline',
  rollingstone: 'Rolling Stone', people: 'People',
  propublica: 'ProPublica', fivethirtyeight: 'FiveThirtyEight',
}

const normalizeSource = (raw) => {
  if (!raw) return raw
  const key = raw.toLowerCase().replace(/[^a-z0-9]/g, '')
  return SOURCE_NORM[key] || raw
}


const AUTO_REFRESH_OPTIONS = [0, 15, 30, 60]

export default function TrackerPage({ ctx }) {
  const { toast, setTrackerModalOpen, setEditingTrackerId, user, showHome, setShowHome, showSaved } = ctx
  const [activeTrackerId, setActiveTrackerId] = useState(null)
  const [fetching, setFetching] = useState(false)
  const [keywordFilters, setKeywordFilters] = useState(new Set())
  const [sortNewest, setSortNewest] = useState(true)
  const [synced, setSynced] = useState(false)
  const [autoRefreshMins, setAutoRefreshMins] = useState(0)
  const [, forceUpdate] = useState(0)
  const refresh = () => forceUpdate(n => n + 1)
  const fetchArticlesRef = useRef(null)

  // Sync trackers from Supabase on mount
  useEffect(() => {
    if (!user?.id || synced) return
    ;(async () => {
      try {
        const { data, error } = await supabase.from('trackers').select('*').eq('user_id', user.id)
        if (error || !data) return
        const remoteIds = new Set(data.map(r => r.id))
        const local = loadTrackers()
        const localOnly = local.filter(t => !remoteIds.has(t.id))
        const remote = data.map(row => ({
          id: row.id, name: row.name, keywords: row.keywords || [],
          color: row.color || '#b9a9ff', createdAt: row.created_at,
          updatedAt: row.updated_at, lastFetched: row.last_fetched
        }))
        saveTrackers([...remote, ...localOnly])
        setSynced(true)
        refresh()
      } catch (e) { console.warn('Tracker sync from Supabase failed:', e) }
    })()
  }, [user?.id, synced])

  const trackers = loadTrackers()
  const allArticles = loadTrackerArticles()
  const trackerId = activeTrackerId || trackers[0]?.id
  const tracker = trackers.find(t => t.id === trackerId)
  const articles = trackerId ? (allArticles[trackerId] || []) : []

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshMins || !trackerId) return
    const ms = autoRefreshMins * 60 * 1000
    const id = setInterval(() => { fetchArticlesRef.current?.(trackerId) }, ms)
    return () => clearInterval(id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefreshMins, trackerId])

  const cycleAutoRefresh = () => {
    const idx = AUTO_REFRESH_OPTIONS.indexOf(autoRefreshMins)
    setAutoRefreshMins(AUTO_REFRESH_OPTIONS[(idx + 1) % AUTO_REFRESH_OPTIONS.length])
  }

  const fetchArticles = async (tId) => {
    const t = trackers.find(tr => tr.id === tId)
    if (!t) return
    setFetching(true)
    refresh()

    if (!t.keywords || t.keywords.length === 0) {
      toast('This tracker has no keywords. Edit it to add some.', 'error')
      setFetching(false)
      refresh()
      return
    }

    const fetchedArticles = []
    let fetchErrors = 0
    for (const keyword of t.keywords) {
      try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`
        const items = await fetchRSS(rssUrl)
        if (items.length === 0) { fetchErrors++; continue }

        items.slice(0, 10).forEach(item => {
          const title = item.title || ''
          let source = '', cleanTitle = title
          const dashIdx = title.lastIndexOf(' - ')
          if (dashIdx > 0) { source = normalizeSource(title.slice(dashIdx + 3).trim()); cleanTitle = title.slice(0, dashIdx).trim() }

          let favicon = ''
          if (source) {
            const knownDomains = { 'politico': 'politico.com', 'reuters': 'reuters.com', 'cnn': 'cnn.com', 'nytimes': 'nytimes.com', 'washingtonpost': 'washingtonpost.com', 'bbc': 'bbc.com', 'foxnews': 'foxnews.com', 'apnews': 'apnews.com', 'npr': 'npr.org', 'axios': 'axios.com', 'zerohedge': 'zerohedge.com' }
            const key = source.toLowerCase().replace(/[\s.\-'"]+/g, '')
            const domain = knownDomains[key] || key + '.com'
            favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
          }

          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = item.description || ''
          const snippet = (tempDiv.textContent || '').replace(/<[^>]*>/g, '').replace(/&[#a-z][a-z0-9]*;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)

          // Extract thumbnail: direct field → enclosure → first <img> in description
          let thumbnail = ''
          if (item.thumbnail?.startsWith?.('http')) thumbnail = item.thumbnail
          else if (item.enclosure?.type?.startsWith('image/') && item.enclosure.link) thumbnail = item.enclosure.link
          else { const m = (item.description || '').match(/<img[^>]+src=["']([^"']+)["']/i); if (m?.[1]?.startsWith('http')) thumbnail = m[1] }

          fetchedArticles.push({
            id: 'art-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
            title: cleanTitle, source, snippet, url: item.link || '', thumbnail,
            favicon, publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(), keyword
          })
        })
      } catch (e) { console.warn(`Fetch failed for "${keyword}":`, e); fetchErrors++ }
    }

    // Fetch ZeroHedge RSS and filter by keyword relevance
    try {
      const zhItems = await fetchRSS('https://feeds.feedburner.com/zerohedge/feed')
      const kwLower = t.keywords.map(k => k.toLowerCase())
      zhItems.forEach(item => {
        const titleLower = (item.title || '').toLowerCase()
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = item.description || ''
        const bodyText = (tempDiv.textContent || '').toLowerCase()
        if (!kwLower.some(k => titleLower.includes(k) || bodyText.includes(k))) return
        const snippet = (tempDiv.textContent || '').replace(/<[^>]*>/g, '').replace(/&[#a-z][a-z0-9]*;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
        const thumbnail = item.thumbnail || (item.enclosure?.type?.startsWith('image/') ? item.enclosure.link : '') || ''
        fetchedArticles.push({
          id: 'art-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
          title: item.title || '', source: 'ZeroHedge', snippet, url: item.link || '', thumbnail,
          favicon: 'https://www.google.com/s2/favicons?domain=zerohedge.com&sz=64',
          publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
          keyword: 'ZeroHedge'
        })
      })
    } catch (e) { console.warn('ZeroHedge fetch failed:', e) }

    if (fetchErrors > 0 && fetchedArticles.length === 0) {
      toast('Failed to fetch articles. The news API may be rate-limited — try again in a moment.', 'error')
    } else if (fetchedArticles.length === 0) {
      toast('No articles found for these keywords.', 'error')
    }

    // Deduplicate
    const seen = new Set()
    const deduped = fetchedArticles.filter(a => { const k = a.title.toLowerCase().trim(); if (seen.has(k)) return false; seen.add(k); return true })

    // Round-robin interleave
    const byKeyword = {}
    deduped.forEach(a => { if (!byKeyword[a.keyword]) byKeyword[a.keyword] = []; byKeyword[a.keyword].push(a) })
    Object.values(byKeyword).forEach(g => g.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0)))
    const balanced = []
    const keys = Object.keys(byKeyword)
    const indices = keys.map(() => 0)
    let remaining = true
    while (remaining) {
      remaining = false
      for (let i = 0; i < keys.length; i++) {
        const group = byKeyword[keys[i]]
        if (indices[i] < group.length) { balanced.push(group[indices[i]]); indices[i]++; remaining = true }
      }
    }

    const all = loadTrackerArticles()
    all[tId] = balanced
    saveTrackerArticles(all)

    const updatedTrackers = loadTrackers()
    const ut = updatedTrackers.find(tr => tr.id === tId)
    if (ut) { ut.lastFetched = Date.now(); saveTrackers(updatedTrackers) }

    try {
      const { data: existing } = await supabase.from('trackers').select('id').eq('id', tId).single()
      const trackerData = { id: tId, user_id: user?.id, name: ut?.name, keywords: ut?.keywords, color: ut?.color, created_at: ut?.createdAt, updated_at: Date.now(), last_fetched: Date.now() }
      if (existing) {
        await supabase.from('trackers').update(trackerData).eq('id', tId)
      } else {
        await supabase.from('trackers').insert(trackerData)
      }
    } catch (e) { console.warn('Tracker Supabase sync failed:', e) }

    setFetching(false)
    refresh()
  }

  // Keep ref current so auto-refresh interval can call latest version
  fetchArticlesRef.current = fetchArticles

  const deleteTracker = async (id) => {
    const updated = loadTrackers().filter(t => t.id !== id)
    saveTrackers(updated)
    const arts = loadTrackerArticles()
    delete arts[id]
    saveTrackerArticles(arts)
    if (activeTrackerId === id) setActiveTrackerId(updated[0]?.id || null)
    try { await supabase.from('trackers').delete().eq('id', id) } catch (e) { console.warn('Tracker delete from Supabase failed:', e) }
    toast('Tracker deleted', 'success')
    refresh()
  }

  const isArticleSaved = (articleId) => loadSavedArticles().some(s => s.id === articleId)

  const toggleSave = (articleId) => {
    const saved = loadSavedArticles()
    const idx = saved.findIndex(s => s.id === articleId)
    if (idx >= 0) { saved.splice(idx, 1) }
    else {
      const article = articles.find(a => a.id === articleId)
      if (article) saved.unshift({ ...article, savedAt: Date.now(), fromTracker: trackerId })
    }
    saveSavedArticles(saved)
    refresh()
  }

  const toggleKeywordFilter = (keyword) => {
    const next = new Set(keywordFilters)
    if (next.has(keyword)) next.delete(keyword)
    else next.add(keyword)
    setKeywordFilters(next)
  }

  let filteredArticles = keywordFilters.size > 0 ? articles.filter(a => keywordFilters.has(a.keyword)) : [...articles]
  if (!sortNewest) filteredArticles.reverse()

  if (showSaved) {
    return <SavedArticlesPage ctx={ctx} />
  }

  if (trackers.length === 0 || showHome) {
    return <DiscoveryPage key={ctx.homeKey} ctx={ctx} />
  }

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="section-header anim anim-1">
        <div>
          <div className="section-title"><span className="title-ico"><SvgIcon id="ico-rss" size={22} /></span>Tracker</div>
          <div className="section-sub">Track keywords and topics across the web</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingTrackerId(null); setTrackerModalOpen(true) }}><SvgIcon id="ico-plus" size={16} /> New Tracker</button>
      </div>

      {/* Tabs */}
      <div className="anim anim-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {trackers.map(t => (
          <button key={t.id} className={`tracker-tab ${t.id === trackerId ? 'active' : ''}`} onClick={() => { setActiveTrackerId(t.id); setKeywordFilters(new Set()); setShowHome(false) }}>
            <span className="tracker-tab-dot" style={{ background: t.color || 'var(--accent)' }} />
            {t.name}
            <span className="tracker-tab-count">{(allArticles[t.id] || []).length}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="anim anim-3">
        {tracker && (
          <div className="card">
            <div className="tracker-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: tracker.color || 'var(--accent)', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-strong)', letterSpacing: '-0.02em' }}>{tracker.name}</span>
                </div>
                <div className="tracker-keywords">
                  <span className={`tracker-keyword ${keywordFilters.size === 0 ? 'active' : 'dimmed'}`} onClick={() => setKeywordFilters(new Set())}>
                    <SvgIcon id="ico-rss" size={11} /><span>All</span><span className="tracker-tab-count">{articles.length}</span>
                  </span>
                  {tracker.keywords.map((k, i) => {
                    const count = articles.filter(a => a.keyword === k).length
                    return (
                      <span key={i} className={`tracker-keyword ${keywordFilters.has(k) ? 'active' : (keywordFilters.size > 0 ? 'dimmed' : '')}`} onClick={() => toggleKeywordFilter(k)}>
                        <SvgIcon id="ico-tag" size={11} /><span>{k}</span><span className="tracker-tab-count">{count}</span>
                      </span>
                    )
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button className="btn btn-sm" onClick={() => setSortNewest(!sortNewest)}><SvgIcon id="ico-sort" size={14} />{sortNewest ? 'Newest' : 'Oldest'}</button>
                  <button className="btn btn-sm" onClick={() => fetchArticles(trackerId)} disabled={fetching}><SvgIcon id="ico-refresh" size={14} />{fetching ? 'Fetching...' : 'Refresh'}</button>
                  <button
                    className="btn btn-sm"
                    onClick={cycleAutoRefresh}
                    style={autoRefreshMins > 0 ? { borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
                    title="Cycle auto-refresh interval"
                  >
                    <SvgIcon id="ico-clock" size={14} />
                    {autoRefreshMins === 0 ? 'Auto: Off' : `Auto: ${autoRefreshMins}m`}
                  </button>
                  <button className="btn btn-sm" onClick={() => { setEditingTrackerId(trackerId); setTrackerModalOpen(true) }}><SvgIcon id="ico-pencil" size={14} />Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteTracker(trackerId)}><SvgIcon id="ico-trash" size={14} />Delete</button>
                </div>
                <div className="tracker-meta">
                  <SvgIcon id="ico-clock" size={12} />
                  <span>Last updated: {tracker.lastFetched ? new Date(tracker.lastFetched).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'short', timeStyle: 'short' }) : 'Never'}</span>
                </div>
              </div>
            </div>

            {fetching ? (
              <div className="tracker-loading"><div className="tracker-loading-spinner" /><div>Searching for articles...</div></div>
            ) : filteredArticles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }}><SvgIcon id="ico-search" size={28} /></div>
                <div style={{ color: 'var(--muted-fg)', fontSize: 13, marginBottom: 16 }}>No articles found yet</div>
                <button className="btn btn-primary btn-sm" onClick={() => fetchArticles(trackerId)}><SvgIcon id="ico-search" size={14} /> Search Now</button>
              </div>
            ) : (
              <div className="article-list">
                {filteredArticles.map(a => {
                  const saved = isArticleSaved(a.id)
                  return (
                    <div key={a.id} className="article-card" style={{ position: 'relative' }}>
                      <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                              {a.favicon ? <img src={a.favicon} alt="" style={{ width: 14, height: 14 }} onError={e => { e.target.style.display = 'none' }} /> : <SvgIcon id="ico-rss" size={11} />}
                            </div>
                            <div className="article-source">{a.source || 'Web'}</div>
                          </div>
                          <div className="article-title" style={{ paddingRight: a.thumbnail ? 0 : 28 }}>{a.title}</div>
                          {a.snippet && <div className="article-snippet">{a.snippet}</div>}
                          <div className="article-time">{a.keyword} · {a.publishedAt ? getTimeAgo(a.publishedAt) : ''}</div>
                        </div>
                        <TrackerThumbnail src={a.thumbnail} />
                      </a>
                      <button onClick={() => toggleSave(a.id)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: saved ? 'var(--accent)' : 'var(--muted)', padding: 4, transition: 'color 0.15s' }} title={saved ? 'Unsave' : 'Save'}>
                        <SvgIcon id={saved ? 'ico-bookmark-fill' : 'ico-bookmark'} size={16} />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
