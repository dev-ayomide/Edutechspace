import { render } from '@testing-library/react'
import { Photo } from './photo'
import { buildSrcSet } from './photo-srcset'

describe('buildSrcSet', () => {
  const files = {
    '/src/assets/photos/hero-800.avif': '/a/hero-800.avif',
    '/src/assets/photos/hero-480.avif': '/a/hero-480.avif',
    '/src/assets/photos/hero-800.webp': '/a/hero-800.webp',
    '/src/assets/photos/other-480.avif': '/a/other-480.avif',
    '/src/assets/photos/hero.jpg': '/a/hero.jpg',
  }
  it('lists one photo and format, smallest first', () => {
    expect(buildSrcSet('hero', 'avif', files)).toBe('/a/hero-480.avif 480w, /a/hero-800.avif 800w')
    expect(buildSrcSet('hero', 'webp', files)).toBe('/a/hero-800.webp 800w')
  })
  it('ignores other photos and returns nothing for an unknown one', () => {
    expect(buildSrcSet('missing', 'avif', files)).toBe('')
  })
})

describe('Photo', () => {
  it('renders a picture with modern sources and a jpeg fallback with dimensions', () => {
    const { container } = render(
      <Photo name="hero" alt="Students" sizes="50vw" width={1000} height={667} priority />,
    )
    const img = container.querySelector('img')!
    expect(img).toHaveAttribute('alt', 'Students')
    expect(img).toHaveAttribute('width', '1000')
    expect(img).toHaveAttribute('loading', 'eager')
    expect(container.querySelector('source[type="image/avif"]')).toBeInTheDocument()
    expect(container.querySelector('source[type="image/webp"]')).toBeInTheDocument()
  })
  it('loads lazily unless marked as priority', () => {
    const { container } = render(<Photo name="hero" alt="x" sizes="50vw" width={10} height={10} />)
    expect(container.querySelector('img')).toHaveAttribute('loading', 'lazy')
  })
})
