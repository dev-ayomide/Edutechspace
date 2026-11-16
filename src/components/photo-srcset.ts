/** Builds "url 480w, url 800w" for one photo and format from the generated files. */
export function buildSrcSet(
  name: string,
  ext: 'avif' | 'webp',
  available: Record<string, string>,
): string {
  const pattern = new RegExp(`/${name}-(\\d+)\\.${ext}$`)
  return Object.entries(available)
    .map(([path, url]) => ({ w: Number(pattern.exec(path)?.[1]), url }))
    .filter((e) => Number.isFinite(e.w) && e.w > 0)
    .sort((a, b) => a.w - b.w)
    .map((e) => `${e.url} ${e.w}w`)
    .join(', ')
}
