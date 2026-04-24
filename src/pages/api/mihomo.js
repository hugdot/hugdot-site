// src/pages/api/mihomo.js

// 중요: 이 파일은 빌드 시점에 미리 만들지 않고, 
// 사용자가 호출할 때마다 실시간으로 서버(Cloudflare)에서 실행되게 합니다.
export const prerender = false;

export async function GET({ request }) {
  // 1. URL 파라미터에서 uid와 lang 추출
  const url = new URL(request.url);
  const uid = url.searchParams.get('uid')?.trim();
  const lang = url.searchParams.get('lang') || 'kr';

  // 2. UID 유효성 검사 (숫자 7~10자리)
  if (!uid || !/^\d{7,10}$/.test(uid)) {
    return new Response(
      JSON.stringify({ detail: '유효하지 않은 UID입니다.' }), 
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 3. Mihomo 공식 API 호출 (서버 대 서버 통신이므로 CORS 에러가 없습니다)
    const mihomoRes = await fetch(`https://api.mihomo.me/sr_info_parsed/${uid}?lang=${lang}`, {
      headers: { 'User-Agent': 'HugDot/1.0' }
    });

    if (!mihomoRes.ok) {
      return new Response(
        JSON.stringify({ detail: 'Mihomo 서버에서 데이터를 가져올 수 없습니다.' }), 
        { status: mihomoRes.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const data = await mihomoRes.json();

    // 4. 결과를 브라우저에 반환
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        // 브라우저에서 직접 호출 시 에러 방지를 위해 CORS 헤더 추가
        'Access-Control-Allow-Origin': '*',
        // 불필요한 재요청을 줄이기 위해 1분간 캐시 처리 (선택사항)
        'Cache-Control': 'public, max-age=60'
      }
    });

  } catch (e) {
    // 5. 네트워크 에러 등 예외 처리
    return new Response(
      JSON.stringify({ detail: '서버 내부 오류가 발생했습니다.' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}