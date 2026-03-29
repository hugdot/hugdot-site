import type { Tool } from './index'

export const snsTools: Tool[] = [
  {
    id: 'instagram-post-generator',
    category: 'sns',
    slug: 'instagram-post-generator',
    icon: 'lucide:instagram',
    available: true,
    label: 'Instagram Post Generator',
  },
  {
    id: 'tweet-generator',
    category: 'sns',
    slug: 'tweet-generator',
    icon: 'lucide:twitter',
    available: true,
    label: 'Tweet Generator',
  },
  {
    id: 'youtube-thumbnail-grabber',
    category: 'sns',
    slug: 'youtube-thumbnail-grabber',
    icon: 'lucide:youtube',
    available: true,
    label: 'YouTube Thumbnail Grabber',
  },
]
