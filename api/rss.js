export default async function handler(req, res) {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'Missing url parameter' })

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
      },
      signal: AbortSignal.timeout(12000),
    })

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` })
    }

    const text = await response.text()
    res.setHeader('Content-Type', 'text/xml; charset=utf-8')
    res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60')
    res.status(200).send(text)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch feed' })
  }
}
