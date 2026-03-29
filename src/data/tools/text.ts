import type { Tool } from './index'

export const textTools: Tool[] = [
  {
    id: 'word-counter',
    label: 'Word Counter',
    category: 'text',
    slug: 'word-counter',
    icon: 'lucide:type',
    available: true,
  },
  {
    id: 'case-converter',
    category: 'text',
    slug: 'case-converter',
    icon: 'lucide:case-sensitive',
    available: true,
    label: 'Case Converter',
  },
  {
    id: 'lorem-ipsum-generator',
    category: 'text',
    slug: 'lorem-ipsum-generator',
    icon: 'lucide:text',
    available: true,
    label: 'Lorem Ipsum Generator',
  },
  {
    id: 'text-diff-checker',
    category: 'text',
    slug: 'text-diff-checker',
    icon: 'lucide:diff',
    available: true,
    label: 'Text Diff Checker',
  },
]
