// Builds the logo files the app uses from the supplied artwork in design/logos:
//   logo-light.png : full logo for light backgrounds (from logo-on-light.png)
//   logo-dark.png  : full logo for dark backgrounds, derived from the light one by recolouring the dark text
//                    (the supplied dark file has smudged edges, so it is kept for reference only)
//   mark.png       : the "R" mark alone
// Run after replacing the artwork:  npm run logos
import sharp from 'sharp'

const SRC = 'design/logos/logo-on-light.png'
const OUT = 'src/assets/brand'
const H = 160 // px tall: 4x the 40px display size, crisp on high-density screens

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
const { width, height } = info

// bounding box of visible pixels
let minX = width, minY = height, maxX = 0, maxY = 0
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (data[(y * width + x) * 4 + 3] > 24) {
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
}
const box = { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
const crop = sharp(SRC).ensureAlpha().extract(box)

await crop.clone().resize({ height: H }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-light.png`)

// dark variant: near-black neutral pixels (the "Tech Space" text) become near-white; "RUN" is lightened for legibility
const { data: px, info: pi } = await crop.clone().raw().toBuffer({ resolveWithObject: true })
const wordmarkStart = Math.round(pi.width * 0.27) // the mark (left) keeps its exact colours
for (let i = 0; i < px.length; i += 4) {
  const x = (i / 4) % pi.width
  if (x < wordmarkStart) continue
  const r = px[i], g = px[i + 1], b = px[i + 2]
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  if (max < 110 && max - min < 50) {
    px[i] = 238; px[i + 1] = 243; px[i + 2] = 255
  } else if (b > 140 && r < 70 && g < 70) {
    px[i] = 132; px[i + 1] = 142; px[i + 2] = 255
  }
}
await sharp(px, { raw: { width: pi.width, height: pi.height, channels: 4 } })
  .resize({ height: H })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}/logo-dark.png`)

// the R mark: everything left of the wordmark
const markWidth = Math.round(box.width * 0.3)
const markArea = await sharp(SRC).ensureAlpha().extract({ ...box, width: markWidth }).png().toBuffer()
const markTrimmed = await sharp(markArea).trim({ threshold: 5 }).toBuffer()
await sharp(markTrimmed).resize({ height: 256 }).png({ compressionLevel: 9 }).toFile(`${OUT}/mark.png`)

// home-screen icon: the mark centred on the dark brand colour
const mark = await sharp(`${OUT}/mark.png`).resize({ height: 104 }).toBuffer()
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#060d2b' } })
  .composite([{ input: mark, gravity: 'centre' }])
  .png()
  .toFile('public/apple-touch-icon.png')
console.log('logos built')
