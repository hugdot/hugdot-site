import type { Tool } from './index'

export const generatorTools: Tool[] = [
  {
    id: 'qr-code-generator',
    category: 'generator',
    slug: 'qr-code',
    icon: 'lucide:qr-code',
    available: true,
    label: 'QR Code Generator',
  },
  {
    id: 'password-generator',
    category: 'generator',
    slug: 'password-generator',
    icon: 'lucide:key-round',
    available: true,
    label: 'Password Generator',
  },
  {
    id: 'list-randomizer',
    category: 'generator',
    slug: 'list-randomizer',
    icon: 'lucide:shuffle',
    available: true,
    label: 'List Randomizer',
  },
  {
    id: 'coin-flipper',
    category: 'generator',
    slug: 'coin-flipper',
    icon: 'lucide:circle-dollar-sign',
    available: true,
    label: 'Coin Flipper & Dice Roller',
  },
]
