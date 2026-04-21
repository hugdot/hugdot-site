export async function onRequestGet(context) {
  const url  = new URL(context.request.url)
  const path = url.pathname.replace('/api/mihomo-img', '')
  const imgUrl = `https://api.mihomo.me${path}${url.search}`

  try {
    const res = await fetch(imgUrl, {
      headers: { 'User-Agent': 'HugDot/1.0 (hugdot.com)' },
    })
    if (!res.ok) {
      return new Response('Not found', { status: 404 })
    }
    const contentType = res.headers.get('content-type') || 'image/webp'
    return new Response(res.body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e) {
    return new Response('Failed', { status: 502 })
  }
}