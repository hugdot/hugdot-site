export type ToolCategory = 'text' | 'image' | 'pdf' | 'generator' | 'file' | 'sns'

export interface Tool {
  id: string
  category: ToolCategory
  slug: string
  href: string
  icon: string
  available: boolean
  label: string
}

export const tools: Tool[] = [
  // Text
  {
    id: 'word-counter',
  label: 'Word Counter',
    category: 'text',
    slug: 'word-counter',
    href: '/tools/text/word-counter',
    icon: 'lucide:type',
    available: true,
  },

  // Image
  {
    id: 'image-compressor',
    category: 'image',
    slug: 'compressor',
    href: '/tools/image/compressor',
    icon: 'lucide:image',
    available: true,
    label: 'Image Compressor',
  },
  {
    id: 'image-resizer',
    category: 'image',
    slug: 'resizer',
    href: '/tools/image/resizer',
    icon: 'lucide:maximize',
    available: true,
    label: 'Image Resizer',
  },
  {
    id: 'image-blur',
    category: 'image',
    slug: 'blur',
    href: '/tools/image/blur',
    icon: 'lucide:blend',
    available: true,
    label: 'Image Blur',
  },
  {
    id: 'image-crop',
    category: 'image',
    slug: 'crop',
    href: '/tools/image/crop',
    icon: 'lucide:crop',
    available: true,
    label: 'Image Crop',
  },
  {
    id: 'image-to-pdf',
    category: 'image',
    slug: 'to-pdf',
    href: '/tools/image/to-pdf',
    icon: 'lucide:file-output',
    available: true,
    label: 'Image to PDF',
  },
  {
    id: 'exif-remover',
    category: 'image',
    slug: 'exif-remover',
    href: '/tools/image/exif-remover',
    icon: 'lucide:shield-check',
    available: true,
    label: 'EXIF Remover',
  },

  // PDF
  {
    id: 'pdf-merger',
    category: 'pdf',
    slug: 'merger',
    href: '/tools/pdf/merger',
    icon: 'lucide:file-plus',
    available: true,
    label: 'PDF Merger',
  },
  {
    id: 'pdf-splitter',
    category: 'pdf',
    slug: 'splitter',
    href: '/tools/pdf/splitter',
    icon: 'lucide:scissors',
    available: true,
    label: 'PDF Splitter',
  },
  {
    id: 'pdf-to-image',
    category: 'pdf',
    slug: 'to-image',
    href: '/tools/pdf/to-image',
    icon: 'lucide:image',
    available: true,
    label: 'PDF to Image',
  },

  // Generator
  {
    id: 'qr-code-generator',
    category: 'generator',
    slug: 'qr-code',
    href: '/tools/generator/qr-code',
    icon: 'lucide:qr-code',
    available: true,
    label: 'QR Code Generator',
  },
]

// 헬퍼 함수
export const getToolById = (id: string) =>
  tools.find((t) => t.id === id)

export const getToolsByCategory = (category: ToolCategory) =>
  tools.filter((t) => t.category === category && t.available)

export const availableTools = tools.filter((t) => t.available)