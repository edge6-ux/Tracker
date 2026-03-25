import { useState, useEffect, useRef } from 'react'
import { SvgIcon } from '../components/IconSprite'
import { getTimeAgo } from '../lib/utils'

const TOPICS = [
  { label: 'Technology',    keyword: 'technology',    topicId: 'TECHNOLOGY',    color: '#b9a9ff' },
  { label: 'Business',      keyword: 'business',      topicId: 'BUSINESS',      color: '#60b4ff' },
  { label: 'Politics',      keyword: 'politics',      topicId: 'POLITICS',      color: '#ff6e7f' },
  { label: 'Science',       keyword: 'science',       topicId: 'SCIENCE',       color: '#4affaa' },
  { label: 'Sports',        keyword: 'sports',        topicId: 'SPORTS',        color: '#ffa050' },
  { label: 'Health',        keyword: 'health',        topicId: 'HEALTH',        color: '#ff78c8' },
  { label: 'Entertainment', keyword: 'entertainment', topicId: 'ENTERTAINMENT', color: '#ffdc50' },
]

const HOME_KEYWORDS = ['breaking news', 'world news', 'technology', 'business']

// Outlets that provide real thumbnails in their RSS feeds
const HERO_FEEDS = [
  { url: 'https://feeds.skynews.com/feeds/rss/home.xml', source: 'Sky News', domain: 'skynews.com' },
]

const KNOWN_DOMAINS = {
  politico: 'politico.com', reuters: 'reuters.com', cnn: 'cnn.com',
  nytimes: 'nytimes.com', washingtonpost: 'washingtonpost.com',
  bbc: 'bbc.com', foxnews: 'foxnews.com', apnews: 'apnews.com',
  npr: 'npr.org', axios: 'axios.com',
}

function parseFavicon(source) {
  if (!source) return ''
  const key = source.toLowerCase().replace(/[\s.\-'"]+/g, '')
  const domain = KNOWN_DOMAINS[key] || key + '.com'
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function extractThumbnail(item) {
  if (item.thumbnail?.startsWith?.('http')) return item.thumbnail
  if (item.enclosure?.type?.startsWith('image/') && item.enclosure?.link) return item.enclosure.link
  const m = (item.description || '').match(/<img[^>]+src=["']([^"']+)["']/i)
  return m?.[1]?.startsWith('http') ? m[1] : ''
}

function parseRSSText(text) {
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

async function rss2json(feedUrl) {
  // Primary: direct fetch via CORS proxy — no rate limits
  try {
    const res = await fetch(
      `https://corsproxy.io/?${encodeURIComponent(feedUrl)}`,
      { signal: AbortSignal.timeout(15000) }
    )
    if (res.ok) {
      const text = await res.text()
      const items = parseRSSText(text)
      if (items.length > 0) return items
    }
  } catch { /* fall through */ }

  // Fallback: rss2json API
  try {
    const res = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}&count=20`,
      { signal: AbortSignal.timeout(12000) }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.status === 'ok' && Array.isArray(data.items) ? data.items : []
  } catch { return [] }
}

async function fetchHero() {
  const results = await Promise.allSettled(
    HERO_FEEDS.map(async feed => {
      const items = await rss2json(feed.url)
      return items
        .filter(item => item.thumbnail?.startsWith?.('http'))
        .map(item => ({
          id: 'hero-' + Math.random().toString(36).slice(2),
          title: item.title || '',
          url: item.link || '',
          thumbnail: item.thumbnail,
          source: feed.source,
          favicon: `https://www.google.com/s2/favicons?domain=${feed.domain}&sz=64`,
          publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
        }))
    })
  )
  const all = []
  results.forEach(r => { if (r.status === 'fulfilled') all.push(...r.value) })
  // Sort newest first and take top 4
  all.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
  return all.slice(0, 4)
}

async function fetchTopicHero(topicId) {
  const feedUrl = `https://news.google.com/rss/headlines/section/topic/${topicId}?hl=en-US&gl=US&ceid=US:en`
  const items = await rss2json(feedUrl)
  const articles = items.map(item => {
    const title = item.title || ''
    let source = '', cleanTitle = title
    const dashIdx = title.lastIndexOf(' - ')
    if (dashIdx > 0) { source = title.slice(dashIdx + 3).trim(); cleanTitle = title.slice(0, dashIdx).trim() }
    return {
      id: 'hero-' + Math.random().toString(36).slice(2),
      title: cleanTitle, source,
      url: item.link || '',
      thumbnail: extractThumbnail(item),
      favicon: parseFavicon(source),
      publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
    }
  }).filter(a => a.thumbnail)
  articles.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
  return articles.slice(0, 4)
}

async function fetchForKeyword(keyword) {
  const items = await rss2json(
    `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`
  )
  return items.map(item => {
    const title = item.title || ''
    let source = '', cleanTitle = title
    const dashIdx = title.lastIndexOf(' - ')
    if (dashIdx > 0) { source = title.slice(dashIdx + 3).trim(); cleanTitle = title.slice(0, dashIdx).trim() }
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = item.description || ''
    const snippet = (tempDiv.textContent || '').replace(/<[^>]*>/g, '').replace(/&[#a-z][a-z0-9]*;/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 200)
    return {
      id: 'art-' + Math.random().toString(36).slice(2),
      title: cleanTitle, source, snippet,
      url: item.link || '', favicon: parseFavicon(source), thumbnail: extractThumbnail(item),
      publishedAt: item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
      keyword,
    }
  })
}

async function fetchHomeFeed() {
  const results = await Promise.allSettled(HOME_KEYWORDS.map(fetchForKeyword))
  const all = []
  results.forEach(r => { if (r.status === 'fulfilled') all.push(...r.value) })
  const seen = new Set()
  const deduped = all.filter(a => {
    const k = a.title.toLowerCase().trim()
    if (seen.has(k)) return false
    seen.add(k); return true
  })
  deduped.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
  return deduped
}

// A single hero card — image fills the card, text sits over a dark gradient
function HeroCard({ article, large }) {
  const [imgFailed, setImgFailed] = useState(false)
  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'relative', borderRadius: 12, overflow: 'hidden', display: 'block',
        textDecoration: 'none', height: large ? 300 : 140,
        background: 'var(--bg-hover)', border: '1px solid var(--border)', flexShrink: 0,
      }}
    >
      {!imgFailed && (
        <img
          src={article.thumbnail} alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onError={() => setImgFailed(true)}
        />
      )}
      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0) 100%)',
      }} />
      {/* Text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: large ? '18px 18px' : '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: large ? 6 : 4 }}>
          <img
            src={article.favicon} alt=""
            style={{ width: 13, height: 13, borderRadius: 2, opacity: 0.85 }}
            onError={e => { e.target.style.display = 'none' }}
          />
          <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: 500 }}>{article.source}</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>· {getTimeAgo(article.publishedAt)}</span>
        </div>
        <div style={{
          color: '#fff', fontFamily: 'var(--font-display)',
          fontSize: large ? 17 : 13, fontWeight: 700,
          lineHeight: 1.3, letterSpacing: '-0.02em',
          display: '-webkit-box', WebkitLineClamp: large ? 3 : 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {article.title}
        </div>
      </div>
    </a>
  )
}

// Inline thumbnail for the article list
function ArticleThumbnail({ src }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return null
  return (
    <div className="article-thumb" style={{ width: 96, height: 72, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border)', background: 'var(--bg-hover)' }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} onError={() => setFailed(true)} />
    </div>
  )
}

export default function DiscoveryPage({ ctx }) {
  const { setTrackerModalOpen, setEditingTrackerId, setInitialKeyword } = ctx
  const [searchInput, setSearchInput] = useState('')
  const [activeTopic, setActiveTopic] = useState(null) // null = home
  const [heroArticles, setHeroArticles] = useState([])
  const [articles, setArticles] = useState([])
  const [fetching, setFetching] = useState(true)
  const mounted = useRef(false)

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    // Fetch hero and home feed in parallel
    Promise.allSettled([fetchHero(), fetchHomeFeed()]).then(([heroRes, feedRes]) => {
      if (heroRes.status === 'fulfilled') setHeroArticles(heroRes.value)
      if (feedRes.status === 'fulfilled') setArticles(feedRes.value)
      setFetching(false)
    })
  }, [])

  const loadTopic = async (topic) => {
    setActiveTopic(topic)
    setFetching(true)
    setArticles([])
    setHeroArticles([])
    try {
      const [articlesRes, heroRes] = await Promise.allSettled([
        fetchForKeyword(topic.keyword),
        topic.topicId ? fetchTopicHero(topic.topicId) : Promise.resolve([]),
      ])
      if (articlesRes.status === 'fulfilled') setArticles(articlesRes.value)
      if (heroRes.status === 'fulfilled') setHeroArticles(heroRes.value)
    } catch (e) { console.warn('Topic fetch failed:', e) }
    setFetching(false)
  }

  const loadHome = () => {
    if (activeTopic === null) return
    setActiveTopic(null)
    setFetching(true)
    setArticles([])
    setHeroArticles([])
    Promise.allSettled([fetchHero(), fetchHomeFeed()]).then(([heroRes, feedRes]) => {
      if (heroRes.status === 'fulfilled') setHeroArticles(heroRes.value)
      if (feedRes.status === 'fulfilled') setArticles(feedRes.value)
      setFetching(false)
    })
  }

  const handleSearch = () => {
    const q = searchInput.trim()
    if (!q) return
    loadTopic({ label: q, keyword: q, color: 'var(--accent)', isSearch: true })
  }

  const openTracker = (keyword) => {
    setInitialKeyword(keyword || '')
    setEditingTrackerId(null)
    setTrackerModalOpen(true)
  }

  const isHome = activeTopic === null

  return (
    <div className="page active" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Search bar */}
      <div className="anim anim-1 discovery-search" style={{ display: 'flex', gap: 8, paddingTop: 8 }}>
        <input
          className="form-input"
          style={{ flex: 1, fontSize: 14 }}
          placeholder="Search a keyword or topic..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <button className="btn btn-primary" onClick={handleSearch} disabled={fetching || !searchInput.trim()}>
          <SvgIcon id="ico-search" size={15} /> Search
        </button>
        <button className="btn" onClick={() => openTracker('')}>
          <SvgIcon id="ico-plus" size={15} /> New Tracker
        </button>
      </div>

      {/* Topic pills */}
      <div className="anim anim-2" style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <button className={`tracker-tab ${isHome ? 'active' : ''}`} onClick={loadHome} disabled={fetching}>
          <span className="tracker-tab-dot" style={{ background: 'var(--accent)' }} />
          Top Stories
        </button>
        {TOPICS.map(t => (
          <button
            key={t.label}
            className={`tracker-tab ${activeTopic?.label === t.label ? 'active' : ''}`}
            onClick={() => loadTopic(t)}
            disabled={fetching}
          >
            <span className="tracker-tab-dot" style={{ background: t.color }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero section — home feed and topic pages */}
      {heroArticles.length > 0 && (
        <div className="anim anim-3">
          {/* Large featured card */}
          <HeroCard article={heroArticles[0]} large />
          {/* Row of smaller cards */}
          {heroArticles.length > 1 && (
            <div className="hero-sub-grid" style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(heroArticles.length - 1, 3)}, 1fr)`, gap: 10, marginTop: 10 }}>
              {heroArticles.slice(1, 4).map(a => <HeroCard key={a.id} article={a} />)}
            </div>
          )}
        </div>
      )}

      {/* Track-this prompt after a search */}
      {activeTopic?.isSearch && !fetching && articles.length > 0 && (
        <div className="card anim anim-3" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 20px' }}>
          <div>
            <span style={{ color: 'var(--text-strong)', fontWeight: 600 }}>Track "{activeTopic.keyword}"?</span>
            <span style={{ color: 'var(--muted-fg)', fontSize: 13, marginLeft: 8 }}>Get automatic updates whenever new articles are published.</span>
          </div>
          <button className="btn btn-primary btn-sm" style={{ flexShrink: 0 }} onClick={() => openTracker(activeTopic.keyword)}>
            <SvgIcon id="ico-rss" size={14} /> Create Tracker
          </button>
        </div>
      )}

      {/* Article feed */}
      {fetching ? (
        <div className="tracker-loading anim anim-3">
          <div className="tracker-loading-spinner" />
          <div>Loading articles...</div>
        </div>
      ) : articles.length > 0 ? (
        <div className="card anim anim-3">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, color: 'var(--text-strong)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: activeTopic?.color || 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />
              {activeTopic ? activeTopic.label : 'Top Stories'}
            </div>
            {activeTopic && !activeTopic.isSearch && (
              <button className="btn btn-sm" onClick={() => openTracker(activeTopic.keyword)}>
                <SvgIcon id="ico-plus" size={13} /> Track This
              </button>
            )}
          </div>
          <div className="article-list">
            {articles.map(a => (
              <div key={a.id} className="article-card">
                <a
                  href={a.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0, textDecoration: 'none', color: 'inherit', alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {a.favicon ? <img src={a.favicon} alt="" style={{ width: 14, height: 14 }} onError={e => { e.target.style.display = 'none' }} /> : <SvgIcon id="ico-rss" size={11} />}
                      </div>
                      <div className="article-source">{a.source || 'Web'}</div>
                    </div>
                    <div className="article-title">{a.title}</div>
                    {a.snippet && <div className="article-snippet">{a.snippet}</div>}
                    <div className="article-time">{a.publishedAt ? getTimeAgo(a.publishedAt) : ''}</div>
                  </div>
                  <ArticleThumbnail src={a.thumbnail} />
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : !fetching && (
        <div className="anim anim-3" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted-fg)', fontSize: 13 }}>
          No articles found
        </div>
      )}

    </div>
  )
}
