import type { Tool } from './index'

export const imageTools: Tool[] = [
  {
    id: 'image-compressor',
    category: 'image',
    slug: 'compressor',
    icon: 'lucide:image',
    available: true,
    label: 'Image Compressor',
  },
  {
    id: 'image-resizer',
    category: 'image',
    slug: 'resizer',
    icon: 'lucide:maximize',
    available: true,
    label: 'Image Resizer',
  },
  { id: 'image-blur', category: 'image', slug: 'blur', icon: 'lucide:blend', available: true, label: 'Image Blur' },
  { id: 'image-crop', category: 'image', slug: 'crop', icon: 'lucide:crop', available: true, label: 'Image Crop' },
  {
    id: 'image-to-pdf',
    category: 'image',
    slug: 'to-pdf',
    icon: 'lucide:file-output',
    available: true,
    label: 'Image to PDF',
  },
  {
    id: 'exif-remover',
    category: 'image',
    slug: 'exif-remover',
    icon: 'lucide:shield-check',
    available: true,
    label: 'EXIF Remover',
  },
  {
    id: 'image-format-converter',
    category: 'image',
    slug: 'format-converter',
    icon: 'lucide:repeat',
    available: true,
    label: 'Image Format Converter',
  },
  {
    id: 'image-watermark',
    category: 'image',
    slug: 'watermark',
    icon: 'lucide:stamp',
    available: true,
    label: 'Image Watermark',
  },
]
