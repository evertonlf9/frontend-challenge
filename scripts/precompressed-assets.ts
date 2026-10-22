import { readFile, writeFile } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { promisify } from 'node:util'
import { brotliCompress, constants } from 'node:zlib'
import type { Plugin } from 'vite'

const compress = promisify(brotliCompress)

/** The same complete assets are served by preview and audited by Lighthouse. */
export function precompressedAssets(): Plugin {
  return {
    name: 'precompressed-assets',
    async writeBundle(options, bundle) {
      if (!options.dir) return
      const directory = resolve(options.dir)
      await Promise.all(Object.values(bundle).filter((file) => /\.(js|css)$/.test(file.fileName)).map(async (file) => {
        // Vite replaces preload references late in generateBundle. Compress final bytes.
        const filename = resolve(directory, file.fileName)
        const within = relative(directory, filename)
        if (within.startsWith('..') || isAbsolute(within)) throw new Error('Invalid output path')
        const input = await readFile(filename)
        const source = await compress(input, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } })
        await writeFile(filename + '.br', source)
      }))
    },
    configurePreviewServer(server) {
      const directory = resolve(server.config.root, server.config.build.outDir)
      server.middlewares.use(async (request, response, next) => {
        if (!['GET', 'HEAD'].includes(request.method ?? '')) return next()
        let pathname: string
        try { pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname) } catch { return next() }
        if (!pathname.startsWith('/assets/') || !/\.(js|css)$/.test(pathname)) return next()
        response.setHeader('Vary', 'Accept-Encoding')
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
        const acceptsBrotli = (request.headers['accept-encoding'] ?? '').split(',').some((entry) => {
          const [encoding, ...parameters] = entry.trim().split(';')
          return encoding === 'br' && !parameters.some((parameter) => /^\s*q\s*=\s*0(?:\.0*)?\s*$/.test(parameter))
        })
        if (!acceptsBrotli) return next()
        const filename = resolve(directory, '.' + pathname + '.br')
        const within = relative(directory, filename)
        if (within.startsWith('..') || isAbsolute(within)) return next()
        try {
          const body = await readFile(filename)
          response.statusCode = 200
          response.setHeader('Content-Type', pathname.endsWith('.css') ? 'text/css; charset=utf-8' : 'text/javascript; charset=utf-8')
          response.setHeader('Content-Encoding', 'br')
          response.setHeader('Vary', 'Accept-Encoding')
          response.setHeader('Content-Length', body.byteLength)
          response.end(request.method === 'HEAD' ? undefined : body)
        } catch { next() }
      })
    },
  }
}
