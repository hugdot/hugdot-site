// functions/api/mihomo-img.js
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const imagePath = url.searchParams.get('img');

  if (!imagePath) {
    return new Response('Path missing', { status: 400 });
  }

  const targetUrl = `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${imagePath}`;

  try {
    const res = await fetch(targetUrl);
    if (!res.ok) return new Response('Not Found', { status: 404 });

    const buffer = await res.arrayBuffer();
    return new Response(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/png",
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response('Error', { status: 500 });
  }
}