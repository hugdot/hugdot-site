// src/pages/api/enka.ts
export const prerender = false

export async function GET({ url }: { url: URL }) {
  const uid = url.searchParams.get('uid')?.trim()

  if (!uid || !/^\d{7,10}$/.test(uid)) {
    return new Response(JSON.stringify({ error: 'Invalid UID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await fetch(`https://enka.network/api/hsr/uid/${uid}`, {
      headers: { 'User-Agent': 'HugDot/1.0 (hugdot.com)' },
    })

    const data = await res.json()

    if (!res.ok) {
      const msg =
        res.status === 404 ? 'Player not found or showcase is empty' :
        res.status === 429 ? 'Rate limited. Please try again later.' :
        `Error ${res.status}`
      return new Response(JSON.stringify({ error: msg }), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Failed to fetch' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}