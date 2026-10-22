import { readFile, writeFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'
// Exportação de assets para a web; os PNGs gerados permanecem intactos.
const browser = await chromium.launch()
try {
  const page = await browser.newPage()
  for (const name of ['emerald', 'sage', 'neon', 'golden']) {
    const source = await readFile('public/artwork/' + name + '.png')
    for (const width of [240, 480, 640, 800, 960]) {
      const base64 = await page.evaluate(async ({ data, width }) => {
        const image = new Image()
        image.src = 'data:image/png;base64,' + data
        await image.decode()
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = Math.round(image.height * canvas.width / image.width)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/webp', 0.76).split(',')[1]
      }, { data: source.toString('base64'), width })
      const result = Buffer.from(base64, 'base64')
      const filename = name + (width === 960 ? '' : '-' + width) + '.webp'
      await writeFile('public/artwork/' + filename, result)
      console.log(filename + ': ' + source.byteLength + ' -> ' + result.byteLength + ' bytes')
    }
  }
} finally { await browser.close() }
