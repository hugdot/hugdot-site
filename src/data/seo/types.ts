export interface SeoVariant {
  slug: string
  title: string
  description: string
  heading: string
  subheading: string
  howto: {
    step: string
    description: string
  }[]
  why: string[]
  faq: {
    q: string
    a: string
  }[]
}

export interface ToolSeoData {
  toolId: string
  lang: string
  variants: SeoVariant[]
}