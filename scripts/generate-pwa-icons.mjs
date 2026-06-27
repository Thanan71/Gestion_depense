import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { deflateSync } from 'node:zlib'

const outputDir = resolve('public/pwa')

const crcTable = new Uint32Array(256)
for (let index = 0; index < 256; index += 1) {
  let crc = index
  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
  }
  crcTable[index] = crc >>> 0
}

const crc32 = (buffers) => {
  let crc = 0xffffffff
  for (const buffer of buffers) {
    for (const byte of buffer) {
      crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
    }
  }
  return (crc ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const typeBuffer = Buffer.from(type)
  const length = Buffer.alloc(4)
  const crc = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  crc.writeUInt32BE(crc32([typeBuffer, data]))
  return Buffer.concat([length, typeBuffer, data, crc])
}

const writePng = (filePath, width, height, pixels) => {
  const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 6

  const raw = Buffer.alloc((width * 4 + 1) * height)
  for (let y = 0; y < height; y += 1) {
    raw[y * (width * 4 + 1)] = 0
    pixels.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4)
  }

  mkdirSync(dirname(filePath), { recursive: true })
  writeFileSync(
    filePath,
    Buffer.concat([
      header,
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw, { level: 9 })),
      chunk('IEND', Buffer.alloc(0))
    ])
  )
}

const putPixel = (pixels, size, x, y, color) => {
  if (x < 0 || x >= size || y < 0 || y >= size) return
  const offset = (Math.floor(y) * size + Math.floor(x)) * 4
  pixels[offset] = color[0]
  pixels[offset + 1] = color[1]
  pixels[offset + 2] = color[2]
  pixels[offset + 3] = color[3]
}

const drawRect = (pixels, size, x, y, width, height, color) => {
  for (let row = Math.floor(y); row < y + height; row += 1) {
    for (let col = Math.floor(x); col < x + width; col += 1) {
      putPixel(pixels, size, col, row, color)
    }
  }
}

const drawRoundedRect = (pixels, size, x, y, width, height, radius, color) => {
  for (let row = Math.floor(y); row < y + height; row += 1) {
    for (let col = Math.floor(x); col < x + width; col += 1) {
      const left = col < x + radius
      const right = col >= x + width - radius
      const top = row < y + radius
      const bottom = row >= y + height - radius

      if ((left || right) && (top || bottom)) {
        const cx = left ? x + radius : x + width - radius - 1
        const cy = top ? y + radius : y + height - radius - 1
        if ((col - cx) ** 2 + (row - cy) ** 2 > radius ** 2) continue
      }

      putPixel(pixels, size, col, row, color)
    }
  }
}

const drawCircle = (pixels, size, cx, cy, radius, color) => {
  for (let row = Math.floor(cy - radius); row <= cy + radius; row += 1) {
    for (let col = Math.floor(cx - radius); col <= cx + radius; col += 1) {
      if ((col - cx) ** 2 + (row - cy) ** 2 <= radius ** 2) {
        putPixel(pixels, size, col, row, color)
      }
    }
  }
}

const makeIcon = (size, fileName) => {
  const pixels = Buffer.alloc(size * size * 4)
  const primary = [15, 118, 110, 255]
  const primaryDark = [17, 94, 89, 255]
  const white = [248, 250, 252, 255]
  const accent = [37, 99, 235, 255]
  const amber = [202, 138, 4, 255]

  drawRect(pixels, size, 0, 0, size, size, primary)
  drawCircle(pixels, size, size * 0.22, size * 0.22, size * 0.42, [20, 184, 166, 255])
  drawCircle(pixels, size, size * 0.92, size * 0.92, size * 0.38, primaryDark)

  drawRoundedRect(
    pixels,
    size,
    size * 0.18,
    size * 0.26,
    size * 0.64,
    size * 0.48,
    size * 0.08,
    white
  )
  drawRoundedRect(
    pixels,
    size,
    size * 0.26,
    size * 0.19,
    size * 0.45,
    size * 0.18,
    size * 0.04,
    white
  )
  drawRoundedRect(
    pixels,
    size,
    size * 0.54,
    size * 0.38,
    size * 0.2,
    size * 0.2,
    size * 0.04,
    primary
  )
  drawCircle(pixels, size, size * 0.64, size * 0.48, size * 0.035, amber)
  drawRect(pixels, size, size * 0.29, size * 0.5, size * 0.06, size * 0.13, primary)
  drawRect(pixels, size, size * 0.39, size * 0.44, size * 0.06, size * 0.19, accent)
  drawRect(pixels, size, size * 0.49, size * 0.56, size * 0.06, size * 0.07, amber)

  writePng(resolve(outputDir, fileName), size, size, pixels)
}

makeIcon(192, 'icon-192.png')
makeIcon(512, 'icon-512.png')
makeIcon(512, 'maskable-512.png')
makeIcon(180, 'apple-touch-icon.png')
