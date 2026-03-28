export type ToolCategory = 'text' | 'image' | 'pdf' | 'generator' | 'file' | 'sns' | 'calculator'

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
  {
    id: 'case-converter',
    category: 'text',
    slug: 'case-converter',
    href: '/tools/text/case-converter',
    icon: 'lucide:case-sensitive',
    available: true,
    label: 'Case Converter',
  },
  {
    id: 'lorem-ipsum-generator',
    category: 'text',
    slug: 'lorem-ipsum-generator',
    href: '/tools/text/lorem-ipsum-generator',
    icon: 'lucide:text',
    available: true,
    label: 'Lorem Ipsum Generator',
  },
  {
    id: 'text-diff-checker',
    category: 'text',
    slug: 'text-diff-checker',
    href: '/tools/text/text-diff-checker',
    icon: 'lucide:diff',
    available: true,
    label: 'Text Diff Checker',
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
  {
    id: 'password-generator',
    category: 'generator',
    slug: 'password-generator',
    href: '/tools/generator/password-generator',
    icon: 'lucide:key-round',
    available: true,
    label: 'Password Generator',
  },
  {
    id: 'list-randomizer',
    category: 'generator',
    slug: 'list-randomizer',
    href: '/tools/generator/list-randomizer',
    icon: 'lucide:shuffle',
    available: true,
    label: 'List Randomizer',
  },
  {
    id: 'coin-flipper',
    category: 'generator',
    slug: 'coin-flipper',
    href: '/tools/generator/coin-flipper',
    icon: 'lucide:circle-dollar-sign',
    available: true,
    label: 'Coin Flipper & Dice Roller',
  },
  {
    id: 'tip-calculator',
    category: 'calculator',
    slug: 'tip-calculator',
    href: '/tools/calculator/tip-calculator',
    icon: 'lucide:receipt',
    available: true,
    label: 'Tip Calculator',
  },
  {
    id: 'age-calculator',
    category: 'calculator',
    slug: 'age-calculator',
    href: '/tools/calculator/age-calculator',
    icon: 'lucide:cake',
    available: true,
    label: 'Age Calculator',
  },
  {
    id: 'unit-converter',
    category: 'calculator',
    slug: 'unit-converter',
    href: '/tools/calculator/unit-converter',
    icon: 'lucide:arrow-left-right',
    available: true,
    label: 'Unit Converter',
  },
  // SNS
  {
    id: 'instagram-post-generator',
    category: 'sns',
    slug: 'instagram-post-generator',
    href: '/tools/sns/instagram-post-generator',
    icon: 'lucide:instagram',
    available: true,
    label: 'Instagram Post Generator',
  },
  {
    id: 'tweet-generator',
    category: 'sns',
    slug: 'tweet-generator',
    href: '/tools/sns/tweet-generator',
    icon: 'lucide:twitter',
    available: true,
    label: 'Tweet Generator',
  },
  {
    id: 'youtube-thumbnail-grabber',
    category: 'sns',
    slug: 'youtube-thumbnail-grabber',
    href: '/tools/sns/youtube-thumbnail-grabber',
    icon: 'lucide:youtube',
    available: true,
    label: 'YouTube Thumbnail Grabber',
  },
]

// 헬퍼 함수
export const getToolById = (id: string) => tools.find((t) => t.id === id)

export const getToolsByCategory = (category: ToolCategory) =>
  tools.filter((t) => t.category === category && t.available)

export const availableTools = tools.filter((t) => t.available)
