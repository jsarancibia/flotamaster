import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const root = process.cwd()
const input = path.join(root, 'public', 'brand', 'logo-dark.png')

const out16 = path.join(root, 'public', 'favicon-16x16.png')
const out32 = path.join(root, 'public', 'favicon-32x32.png')
const outApple = path.join(root, 'public', 'apple-touch-icon.png')

async function ensureInputExists() {
  try {
    await fs.access(input)
  } catch {
    throw new Error(`No se encontró el logo de entrada: ${input}`)
  }
}

function buildPipeline(size) {
  return sharp(input)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
}

async function main() {
  await ensureInputExists()

  await buildPipeline(16).toFile(out16)
  await buildPipeline(32).toFile(out32)

  await sharp(input)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outApple)

  // Optional: also generate a 256px master for future use
  // await buildPipeline(256).toFile(path.join(root, 'public', 'favicon-256x256.png'))

  console.log('Favicons generados en /public')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
