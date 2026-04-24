// functions/api/mihomo.js
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const uid = url.searchParams.get('uid');
  const lang = url.searchParams.get('lang') || 'kr';

  if (!uid) {
    return new Response(JSON.stringify({ error: 'UID is required' }), { status: 400 });
  }

  try {
    const response = await fetch(`https://api.mihomo.me/sr_info_parsed/${uid}?lang=${lang}`);
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=60"
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Mihomo API Error' }), { status: 500 });
  }
}