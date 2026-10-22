import { mkdir, writeFile } from 'node:fs/promises'
import { arch, cpus, platform, release, totalmem } from 'node:os'
import { preview } from 'vite'
import { chromium } from '@playwright/test'
import { launch } from 'chrome-launcher'
import lighthouse from 'lighthouse'
import desktopConfig from 'lighthouse/core/config/desktop-config.js'
import config from '../lighthouserc.cjs'
import { verifyBuild } from './smoke-build.mjs'

const preflight = await verifyBuild()

const server = await preview({ preview: { host: 'localhost', port: 4174, strictPort: true } })
const summary = {
  generatedAt: new Date().toISOString(),
  environment: { node: process.version, platform: platform(), release: release(), arch: arch(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryGiB: Math.round(totalmem() / 1024 ** 3), npm: process.env.npm_config_user_agent ?? null, chromium: preflight.chromium },
  conditions: { runsPerPageAndProfile: config.runs, freshBrowserPerRun: true, build: 'Vite mock otimizado', entry: preflight.entry, htmlSha256: preflight.htmlSha256, preflight: 'catalog, realtime, login, checkout, receipt reload', compression: 'Brotli negociado pelo preview padrão', scenario: 'default', network: 'throttling simulado padrão Lighthouse', imagesAndFonts: 'artes WebP responsivas e fonte variável Roboto Mono WOFF2 locais' },
  results: [],
}
let chrome

try {
  for (const profile of config.profiles) {
    for (const [index, path] of config.paths.entries()) {
      const directory = `lighthouse-reports/${profile}/page-${index + 1}`
      await mkdir(directory, { recursive: true })
      const runs = []
      for (let run = 1; run <= config.runs; run++) {
        console.log(`Lighthouse: ${profile} ${path} (${run}/${config.runs})`)
        chrome = await launch({ chromePath: process.env.CHROME_PATH || chromium.executablePath(), chromeFlags: ['--headless'] })
        let result
        try {
          result = await lighthouse(`http://localhost:4174${path}`, {
            port: chrome.port,
            output: ['html', 'json'],
            logLevel: 'error',
          }, profile === 'desktop' ? desktopConfig : undefined)
        } finally {
          await chrome.kill()
          chrome = undefined
        }
        if (!result || result.lhr.runtimeError) {
          throw new Error(result?.lhr.runtimeError?.message || 'Lighthouse sem resultado')
        }
        await writeFile(`${directory}/run-${run}.html`, result.report[0])
        await writeFile(`${directory}/run-${run}.json`, result.report[1])
        runs.push(result.lhr)
      }
      const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]
      const scores = Object.fromEntries(Object.keys(config.thresholds).map((category) => [
        category, median(runs.map((run) => run.categories[category].score)),
      ]))
      const metrics = Object.fromEntries([
        'largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time',
      ].map((audit) => [audit, median(runs.map((run) => run.audits[audit].numericValue))]))
      summary.results.push({
        profile, path, lighthouseVersion: runs[0].lighthouseVersion, scores, metrics,
        settings: { formFactor: runs[0].configSettings.formFactor, throttlingMethod: runs[0].configSettings.throttlingMethod, throttling: runs[0].configSettings.throttling, screenEmulation: runs[0].configSettings.screenEmulation },
        runs: runs.map((run) => ({
          fetchTime: run.fetchTime,
          scores: Object.fromEntries(Object.keys(config.thresholds).map((name) => [name, run.categories[name].score])),
          metrics: Object.fromEntries(Object.keys(metrics).map((name) => [name, run.audits[name].numericValue])),
        })),
      })
    }
  }
  summary.completedAt = new Date().toISOString()
  await writeFile('lighthouse-reports/summary.json', JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
  if (summary.results.some(({ scores }) => Object.entries(config.thresholds).some(([key, min]) => scores[key] < min))) {
    console.error('Há categorias abaixo das metas. Consulte lighthouse-reports/summary.json.')
    process.exitCode = 1
  }
} finally {
  await chrome?.kill()
  await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()))
}
