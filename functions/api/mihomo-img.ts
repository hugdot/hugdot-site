export const onRequestGet: PagesFunction = async (context) => {
  const url  = new URL(context.request.url)
  const path = url.pathname.replace('/api/mihomo-img', '')
  const res  = await fetch(`https://api.mihomo.me${path}`)
  const blob = await res.arrayBuffer()
  return new Response(blob, {
    headers: {
      'Content-Type': res.headers.get('Content-Type') || 'image/png',
      'Cache-Control': 'public, max-age=86400',
      'Access-Control-Allow-Origin': '*',
    },
  })
}