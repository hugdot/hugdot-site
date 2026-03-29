import { defineThemeConfig } from '@utils/defineThemeConfig'
import previewImage from '@assets/img/social-preview-image.png'
import logoImage from '@assets/img/logo.svg'

export default defineThemeConfig({
  name: 'HugDot',
  id: 'hugdot-utility-lab',
  logo: logoImage,
  seo: {
    title: 'HugDot | Free Online Utility Tools & Converters',
    description: 'Powerful, on-device utility tools for images, text, and files. Your data never leaves your device.',
    author: 'HugDot',
    image: previewImage, // Can also be a string e.g. '/social-preview-image.png',
  },
  colors: {
    primary: '#d648ff',
    secondary: '#00d1b7',
    neutral: '#b9bec4',
    outline: '#ff4500',
  },
  navigation: {
    darkmode: true,
    items: [
      {
        type: 'dropdown',
        label: 'Text',
        items: [
          { label: 'Word Counter', href: '/tools/text/word-counter' },
          { label: 'Case Converter', href: '/tools/text/case-converter' },
          { label: 'Lorem Ipsum Generator', href: '/tools/text/lorem-ipsum-generator' },
          { label: 'Text Diff Checker', href: '/tools/text/text-diff-checker' },
        ],
      },
      {
        type: 'dropdown',
        label: 'Image',
        items: [
          { label: 'Image Compressor', href: '/tools/image/compressor' },
          { label: 'Image Format Converter', href: '/tools/image/format-converter' },
          { label: 'Image Watermark', href: '/tools/image/watermark' },
          { label: 'Image Resizer', href: '/tools/image/resizer' },
          { label: 'Image Blur', href: '/tools/image/blur' },
          { label: 'Image Crop', href: '/tools/image/crop' },
          { label: 'Image to PDF', href: '/tools/image/to-pdf' },
          { label: 'EXIF Remover', href: '/tools/image/exif-remover' },
        ],
      },
      {
        type: 'dropdown',
        label: 'PDF',
        items: [
          { label: 'PDF Merger', href: '/tools/pdf/merger' },
          { label: 'PDF Splitter', href: '/tools/pdf/splitter' },
          { label: 'PDF to Image', href: '/tools/pdf/to-image' },
        ],
      },
      {
        type: 'dropdown',
        label: 'Generator',
        items: [
          { label: 'QR Code Generator', href: '/tools/generator/qr-code' },
          { label: 'Password Generator', href: '/tools/generator/password-generator' },
          { label: 'List Randomizer', href: '/tools/generator/list-randomizer' },
          { label: 'Coin Flipper & Dice Roller', href: '/tools/generator/coin-flipper' },
        ],
      },
      {
        type: 'dropdown',
        label: 'SNS',
        items: [
          { label: 'Instagram Post Generator', href: '/tools/sns/instagram-post-generator' },
          { label: 'Tweet Generator', href: '/tools/sns/tweet-generator' },
          { label: 'YouTube Thumbnail Grabber', href: '/tools/sns/youtube-thumbnail-grabber' },
        ],
      },
      {
        type: 'dropdown',
        label: 'Calculator',
        items: [
          { label: 'Tip Calculator', href: '/tools/calculator/tip-calculator' },
          { label: 'Age Calculator', href: '/tools/calculator/age-calculator' },
          { label: 'Unit Converter', href: '/tools/calculator/unit-converter' },
        ],
      },
    ],
  },
  socials: [
    {
      label: 'GitHub',
      href: 'https://github.com/incluud/',
      icon: 'lucide:github',
    },
    {
      label: 'Bluesky',
      href: 'https://bsky.app/profile/incluud.dev',
      icon: 'lucide:bot-message-square',
    },
    {
      label: 'Open Collective',
      href: 'https://opencollective.com/incluud',
      icon: 'lucide:hand-heart',
    },
  ],
})
