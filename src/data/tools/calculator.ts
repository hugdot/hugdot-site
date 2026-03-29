import type { Tool } from './index'

export const calculatorTools: Tool[] = [
  {
    id: 'tip-calculator',
    category: 'calculator',
    slug: 'tip-calculator',
    icon: 'lucide:receipt',
    available: true,
    label: 'Tip Calculator',
  },
  {
    id: 'age-calculator',
    category: 'calculator',
    slug: 'age-calculator',
    icon: 'lucide:cake',
    available: true,
    label: 'Age Calculator',
  },
  {
    id: 'unit-converter',
    category: 'calculator',
    slug: 'unit-converter',
    icon: 'lucide:arrow-left-right',
    available: true,
    label: 'Unit Converter',
  },
]
