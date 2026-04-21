export async function onRequestGet(context) {
  const url  = new URL(context.request.url)
  const uid  = url.searchParams.get('uid')?.trim()
  const lang = url.searchParams.get('lang') || 'kr'

  if (!uid || !/^\d{7,10}$/.test(uid)) {
    return new Response(JSON.stringify({ error: 'Invalid UID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const res  = await fetch(`https://api.mihomo.me/sr_info_parsed/${uid}?lang=${lang}`, {
      headers: { 'User-Agent': 'HugDot/1.0 (hugdot.com)' },
    })
    const data = await res.json()

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Error ${res.status}` }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
}