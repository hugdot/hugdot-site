import type { Tool } from './index'

export const pdfTools: Tool[] = [
  { id: 'pdf-merger', category: 'pdf', slug: 'merger', icon: 'lucide:file-plus', available: true, label: 'PDF Merger' },
  {
    id: 'pdf-splitter',
    category: 'pdf',
    slug: 'splitter',
    icon: 'lucide:scissors',
    available: true,
    label: 'PDF Splitter',
  },
  {
    id: 'pdf-to-image',
    category: 'pdf',
    slug: 'to-image',
    icon: 'lucide:image',
    available: true,
    label: 'PDF to Image',
  },
]
