export const onRequestPost: PagesFunction<{ RESEND_API_KEY: string }> = async (context) => {
  try {
    const formData = await context.request.formData();
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // Cloudflare 설정에서 넣은 그 키를 가져옵니다.
    const API_KEY = context.env.RESEND_API_KEY;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        from: 'HugDot <onboarding@resend.dev>', // 나중에 도메인 인증 후 수정 가능
        to: 'admin@hugdot.com', // 메시지 받을 실제 메일 주소
        reply_to: email as string,
        subject: `[HugDot Inquiry] from ${name}`,
        html: `
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${message}</p>
        `,
      }),
    });

    if (res.ok) {
      // 전송 성공 시 'Thank You' 페이지로 리다이렉트
      return Response.redirect(new URL('/thank-you', context.request.url), 303);
    } else {
      return new Response('Failed to send email', { status: 500 });
    }
  } catch (error) {
    return new Response('Server Error', { status: 500 });
  }
};