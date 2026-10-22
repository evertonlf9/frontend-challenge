import { fileURLToPath, URL } from 'node:url'
import { createServer, loadEnv, type Plugin, type ResolvedConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/** Build-time resource hints for the static artwork of every demo NFT. The
 * manifest contains URLs only: REST still supplies and validates all UI data. */
export function artworkHints(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'artwork-hints',
    configResolved(value) { config = value },
    async writeBundle(options) {
      if (!options.dir) return
      const index = await readFile(resolve(options.dir, 'index.html'), 'utf8')
      const app = index.replace(/<!--public-shell-start-->[\s\S]*?<!--public-shell-end-->/, '<div id="root"></div>')
      await writeFile(resolve(options.dir, 'app.html'), app)
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        const url = new URL(request.url ?? '/', 'http://localhost')
        if (request.method === 'GET' && request.headers.accept?.includes('text/html') &&
            ((url.pathname !== '/' && !url.pathname.includes('.')) || (url.pathname === '/' && !!url.search))) {
          request.url = '/app.html'
        }
        next()
      })
    },
    transformIndexHtml: {
      order: 'post',
      async handler(html, context) {
        if (!context.bundle) return
        const env = loadEnv(config.mode, config.root, 'VITE_')
        const server = await createServer({
          configFile: false, root: config.root, appType: 'custom',
          cacheDir: 'node_modules/.vite-prerender',
          plugins: [react()],
          optimizeDeps: { noDiscovery: true, include: [] },
          resolve: { alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) } },
          server: { middlewareMode: true, watch: null },
        })
        let images: Record<string, string> = {}
        let home: string
        try {
          if (env.VITE_ENABLE_MOCKS !== 'false') {
            const { createSeedState } = await server.ssrLoadModule('/src/mocks/db/fixtures.ts')
            images = Object.fromEntries(createSeedState().nfts.map((nft: { id: string; imageUrl: string; galleryUrls: string[] }) => [nft.id, nft.galleryUrls[0] ?? nft.imageUrl]))
          }
          const { renderPublicRoute } = await server.ssrLoadModule('/src/prerender.tsx')
          home = await renderPublicRoute('/')
        } finally { await server.close() }
        return { html: html.replace('<div id="root"></div>', `<!--public-shell-start--><div id="root" data-prerendered="true">${home}</div><!--public-shell-end-->`), tags: [{
          tag: 'script', injectTo: 'head',
          children: `{
            const images = ${JSON.stringify(images).replaceAll('<', '\\u003c')};
            const match = location.pathname.match(/^\\/nft\\/([^/]+)\\/?$/);
            const url = match && Object.hasOwn(images, match[1]) && images[match[1]];
            if (url) {
              const link = document.createElement('link');
              link.rel = 'preload'; link.as = 'image'; link.fetchPriority = 'high';
              link.href = url; link.dataset.nftImage = '';
              const base = url.replace(/\\.webp$/, '');
              link.imageSrcset = [240,480,640,800].map(width => base + '-' + width + '.webp ' + width + 'w').join(', ') + ', ' + url + ' 960w';
              link.imageSizes = '(max-width: 767px) calc(100vw - 78px), 430px';
              document.head.append(link);
            }
          }`,
        }, {
          tag: 'script', injectTo: 'body' as const,
          children: `{
            const root = document.getElementById('root');
            if (location.pathname !== '/' || location.search || location.hash) { root.replaceChildren(); delete root.dataset.prerendered; }
          }`,
        }] }
      },
    },
  }
}
