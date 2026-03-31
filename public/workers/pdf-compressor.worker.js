// ─── PDF Compressor Web Worker ───────────────────────────────────────────────
// 메인 스레드 UI 프리징 방지 — PDF 압축 연산은 이 워커에서만 실행

importScripts('https://unpkg.com/pdf-lib/dist/pdf-lib.min.js')
importScripts('https://unpkg.com/browser-image-compression@2.0.2/dist/browser-image-compression.js')

const { PDFDocument, PDFName, PDFRawStream } = globalThis.PDFLib

// ─── 진행률 보고 ─────────────────────────────────────────────────────────────
const reportProgress = (percent, message) => {
  self.postMessage({ type: 'progress', percent, message })
}

// ─── 이미지 스트림 압축 ───────────────────────────────────────────────────────
const compressImageStream = async (imageBytes, mimeType, quality, maxDimension) => {
  try {
    const blob = new Blob([imageBytes], { type: mimeType })
    const compressed = await imageCompression(blob, {
      maxSizeMB: 999,
      maxWidthOrHeight: maxDimension,
      useWebWorker: false, // 워커 내부에서는 false
      initialQuality: quality,
      fileType: mimeType,
    })
    return new Uint8Array(await compressed.arrayBuffer())
  } catch {
    // 압축 실패 시 원본 반환
    return imageBytes
  }
}

// ─── PDF 이미지 객체 추출 및 압축 ────────────────────────────────────────────
const compressPdfImages = async (pdfBytes, options) => {
  const { quality, maxDimension } = options

  const srcDoc = await PDFDocument.load(pdfBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  })

  const newDoc = await PDFDocument.create()

  // copyPages로 구조 유지하며 페이지 복사
  const pageIndices = srcDoc.getPageIndices()
  const copiedPages = await newDoc.copyPages(srcDoc, pageIndices)
  copiedPages.forEach((page) => newDoc.addPage(page))

  reportProgress(20, 'Analyzing PDF structure...')

  // 이미지 XObject 추출 및 압축
  const context = newDoc.context
  const processedRefs = new Set()
  let imageCount = 0
  let processedCount = 0

  // 모든 페이지의 리소스에서 이미지 XObject 찾기
  const pages = newDoc.getPages()

  // 전체 이미지 수 먼저 카운트
  for (const page of pages) {
    try {
      const resources = page.node.get(PDFName.of('Resources'))
      if (!resources) continue
      const xObjects = resources.get?.(PDFName.of('XObject'))
      if (!xObjects) continue
      const xObjMap = xObjects.dict ?? xObjects
      if (!xObjMap) continue
      for (const [, ref] of xObjMap.entries()) {
        const obj = context.lookup(ref)
        if (!obj) continue
        const subtype = obj.dict?.get?.(PDFName.of('Subtype'))
        if (subtype?.encodedName === '/Image') imageCount++
      }
    } catch { /* 무시 */ }
  }

  reportProgress(30, `Found ${imageCount} image(s) to compress...`)

  // 이미지 압축 실행
  for (const page of pages) {
    try {
      const resources = page.node.get(PDFName.of('Resources'))
      if (!resources) continue
      const xObjects = resources.get?.(PDFName.of('XObject'))
      if (!xObjects) continue
      const xObjMap = xObjects.dict ?? xObjects
      if (!xObjMap) continue

      for (const [, ref] of xObjMap.entries()) {
        const refStr = ref?.toString?.()
        if (refStr && processedRefs.has(refStr)) continue

        const obj = context.lookup(ref)
        if (!obj?.dict) continue

        const subtype = obj.dict.get(PDFName.of('Subtype'))
        if (subtype?.encodedName !== '/Image') continue

        const filter = obj.dict.get(PDFName.of('Filter'))
        const filterName = filter?.encodedName ?? ''

        // JPEG 이미지만 압축 (DCTDecode)
        if (filterName === '/DCTDecode' || filterName === 'DCTDecode') {
          try {
            const originalBytes = obj.contents ?? new Uint8Array()
            const compressed = await compressImageStream(
              originalBytes,
              'image/jpeg',
              quality,
              maxDimension
            )

            if (compressed.length < originalBytes.length) {
              // 압축된 이미지로 교체
              obj.contents = compressed
              obj.dict.set(PDFName.of('Length'), context.obj(compressed.length))
            }

            if (refStr) processedRefs.add(refStr)
          } catch { /* 개별 이미지 실패 시 무시 */ }
        }

        // PNG 이미지 (FlateDecode + ColorSpace)
        if (filterName === '/FlateDecode' || filterName === 'FlateDecode') {
          try {
            const colorSpace = obj.dict.get(PDFName.of('ColorSpace'))
            const bitsPerComponent = obj.dict.get(PDFName.of('BitsPerComponent'))

            // RGB 또는 CMYK 이미지만 처리
            if (colorSpace && bitsPerComponent) {
              const originalBytes = obj.contents ?? new Uint8Array()
              const compressed = await compressImageStream(
                originalBytes,
                'image/png',
                quality,
                maxDimension
              )

              if (compressed.length < originalBytes.length) {
                obj.contents = compressed
                obj.dict.set(PDFName.of('Length'), context.obj(compressed.length))
              }

              if (refStr) processedRefs.add(refStr)
            }
          } catch { /* 무시 */ }
        }

        processedCount++
        const progressPercent = 30 + Math.round((processedCount / Math.max(imageCount, 1)) * 50)
        reportProgress(progressPercent, `Compressing image ${processedCount}/${imageCount}...`)
      }
    } catch { /* 페이지 처리 실패 시 무시하고 계속 */ }
  }

  reportProgress(85, 'Rebuilding PDF structure...')

  // PDF 저장 (객체 압축 옵션 포함)
  const compressedBytes = await newDoc.save({
    useObjectStreams: true,  // 객체 스트림으로 추가 압축
    addDefaultPage: false,
    objectsPerTick: 50,      // 청크 처리로 메모리 최적화
  })

  reportProgress(100, 'Done!')

  return compressedBytes
}

// ─── 메시지 핸들러 ────────────────────────────────────────────────────────────
self.addEventListener('message', async (e) => {
  const { type, pdfBytes, options, id } = e.data

  if (type === 'compress') {
    try {
      reportProgress(5, 'Loading PDF...')
      const result = await compressPdfImages(pdfBytes, options)

      self.postMessage(
        { type: 'done', id, compressedBytes: result.buffer },
        [result.buffer] // Transferable
      )
    } catch (err) {
      self.postMessage({
        type: 'error',
        id,
        message: err?.message ?? 'Compression failed',
      })
    }
  }
})