import type { ImgHTMLAttributes } from 'react'
import { buildSrcSet } from './photo-srcset'

// Every optimised file produced by `npm run images` (see scripts/optimize-images.mjs).
const files = import.meta.glob('/src/assets/photos/*.{avif,webp,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

interface PhotoProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet' | 'alt'> {
  /** File name without extension, as in src/assets/photos/originals. */
  name: string
  alt: string
  sizes: string
  width: number
  height: number
  /** Above-the-fold photo: load first and never lazily. */
  priority?: boolean
}

/** A responsive photo: AVIF, then WebP, then JPEG; browsers pick the smallest they support. */
export function Photo({ name, alt, sizes, width, height, priority = false, ...rest }: PhotoProps) {
  const avif = buildSrcSet(name, 'avif', files)
  const webp = buildSrcSet(name, 'webp', files)
  const fallback = files[`/src/assets/photos/${name}.jpg`]
  return (
    <picture>
      {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
      {webp && <source type="image/webp" srcSet={webp} sizes={sizes} />}
      <img
        src={fallback}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'auto'}
        {...rest}
      />
    </picture>
  )
}
