// src/pages/api/mihomo-img.js

export const prerender = false;

export async function GET({ request }) {
  const url = new URL(request.url);
  // ?img= 뒤에 오는 경로를 가져옵니다.
  const imagePath = url.searchParams.get('img');

  if (!imagePath) {
    return new Response('이미지 경로가 없습니다.', { status: 400 });
  }

  // Mihomo 원본 이미지 저장소 주소
  const targetUrl = `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/${imagePath}`;

  try {
    const res = await fetch(targetUrl);

    if (!res.ok) {
      return new Response('이미지를 찾을 수 없습니다.', { status: 404 });
    }

    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") || "image/png",
        "Cache-Control": "public, max-age=86400", // 24시간 캐시
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (e) {
    return new Response('이미지 로딩 오류', { status: 500 });
  }
}