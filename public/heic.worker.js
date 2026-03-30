// heic.worker.js
// 메인 스레드 UI 프리징 방지를 위해 변환 로직을 별도 워커에서 처리

let heic2any = null

// heic2any 동적 로드 (워커 내부에서)
const loadHeic2Any = async () => {
  if (heic2any) return heic2any
  // 워커 내부에서는 importScripts 사용
  self.importScripts('https://unpkg.com/heic2any@0.0.4/dist/heic2any.min.js')
  heic2any = self.heic2any
  return heic2any
}

self.addEventListener('message', async (e) => {
  const { id, file, format, quality } = e.data

  try {
    // 엔진 로드 알림
    self.postMessage({ type: 'loading', id })

    const converter = await loadHeic2Any()

    // 변환 실행
    const result = await converter({
      blob: file,
      toType: `image/${format.toLowerCase()}`,
      quality: quality / 100,
    })

    // 결과가 배열인 경우 (멀티 프레임 HEIC)
    const blob = Array.isArray(result) ? result[0] : result

    // Blob을 ArrayBuffer로 변환해서 전송 (Transferable로 효율적 전달)
    const arrayBuffer = await blob.arrayBuffer()

    self.postMessage(
      {
        type: 'done',
        id,
        arrayBuffer,
        mimeType: `image/${format.toLowerCase()}`,
        size: blob.size,
      },
      [arrayBuffer] // Transferable — 복사 없이 소유권 이전
    )
  } catch (err) {
    self.postMessage({
      type: 'error',
      id,
      message: err?.message ?? 'Conversion failed',
    })
  }
})
self.postMessage({ type: 'ready' })