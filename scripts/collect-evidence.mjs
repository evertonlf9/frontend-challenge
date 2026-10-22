import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { join } from 'node:path'

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const e2e = await readJson('playwright-report/e2e-results.json')
const visual = await readJson('playwright-report/visual-results.json')
const lighthouse = await readJson('lighthouse-reports/summary.json')
const production = await readJson('test-results/production-build.json')
const output = join('artifacts', 'quality', new Date().toISOString().replaceAll(/[:.]/g, '-'))
await mkdir(output, { recursive: true })

// Keep HTML, JSON, axe attachments and failure traces together. No source folder
// is deleted or overwritten, and separate runs never reuse old evidence.
for (const directory of ['playwright-report', 'lighthouse-reports', 'test-results']) {
  await cp(directory, join(output, directory), { recursive: true })
}
for (const file of ['README.md', 'ARCHITECTURE.md', 'lighthouserc.cjs', 'playwright.config.ts', 'playwright.visual.config.ts']) {
  await cp(file, join(output, file))
}
await cp('docs', join(output, 'docs'), { recursive: true })

const hashes = {}
async function hash(path) {
  const stat = await readdir(path, { withFileTypes: true })
  for (const item of stat.sort((a, b) => a.name.localeCompare(b.name))) {
    const filename = join(path, item.name)
    if (item.isDirectory()) await hash(filename)
    else hashes[filename.replaceAll('\\', '/')] = createHash('sha256').update(await readFile(filename)).digest('hex')
  }
}
for (const directory of ['src', 'scripts', 'tests']) await hash(directory)
for (const file of ['package.json', 'package-lock.json', 'vite.config.ts', 'lighthouserc.cjs', 'playwright.config.ts', 'playwright.visual.config.ts']) {
  hashes[file] = createHash('sha256').update(await readFile(file)).digest('hex')
}
const config = (await import('../lighthouserc.cjs')).default
const passed = [e2e, visual].every(({ stats, errors }) => stats.expected > 0 && stats.unexpected === 0 && stats.skipped === 0 && stats.flaky === 0 && errors.length === 0)
  && lighthouse.results.length === config.paths.length * config.profiles.length
  && lighthouse.results.every(({ scores }) => Object.entries(config.thresholds).every(([name, minimum]) => scores[name] >= minimum))
  && production.entry === lighthouse.conditions.entry && production.pageErrors === 0
  && !!production.htmlSha256 && production.htmlSha256 === lighthouse.conditions.htmlSha256
await writeFile(join(output, 'manifest.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), status: passed ? 'passed' : 'requires_review',
  e2e: e2e.stats, visual: visual.stats, lighthouse, production, sourceSha256: hashes,
  note: 'Hashes identify the source present when evidence was collected. Check execution timestamps before comparing separate runs.',
}, null, 2))
console.log(`Evidências: ${output} (${passed ? 'aprovadas' : 'há pendências nos relatórios'})`)
if (!passed) process.exitCode = 1
