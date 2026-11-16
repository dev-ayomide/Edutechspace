// Turns the photos in src/assets/photos/originals into responsive AVIF + WebP + JPEG files in src/assets/photos.
// Run after adding or replacing a photo:  npm run images
// Output names: <name>-<width>.avif|webp and <name>.jpg (fallback). Widths larger than the original are skipped.
import { readdir, mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'src/assets/photos/originals'
const OUT = 'src/assets/photos'
const WIDTHS = [480, 800, 1200, 1600]

await mkdir(OUT, { recursive: true })
for (const file of await readdir(SRC)) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue
  const name = path.parse(file).name
  const img = sharp(path.join(SRC, file)).rotate()
  const { width = 0 } = await img.metadata()
  const sizes = WIDTHS.filter((w) => w <= width)
  if (sizes.length === 0) sizes.push(width)
  for (const w of sizes) {
    await img.clone().resize({ width: w }).avif({ quality: 55, effort: 6 }).toFile(path.join(OUT, `${name}-${w}.avif`))
    await img.clone().resize({ width: w }).webp({ quality: 74 }).toFile(path.join(OUT, `${name}-${w}.webp`))
  }
  await img.clone().resize({ width: Math.min(width, 1200) }).jpeg({ quality: 76, mozjpeg: true }).toFile(path.join(OUT, `${name}.jpg`))
  console.log(`${file}: ${sizes.join(', ')}px + fallback`)
}
