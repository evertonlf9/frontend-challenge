import axe from 'axe-core'
import { writeFile } from 'node:fs/promises'
import { expect, type Page, type TestInfo } from '@playwright/test'

/** Audit the rendered UI, including modal content, without changing axe rules. */
export async function expectAccessible(page: Page, testInfo: TestInfo) {
  await page.evaluate(() => document.fonts.ready)
  await page.addScriptTag({ content: axe.source })
  const results = await page.evaluate(async () => {
    const engine = (window as unknown as { axe: typeof axe }).axe
    return engine.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    })
  })
  const report = testInfo.outputPath('accessibility.json')
  await writeFile(report, JSON.stringify({
    testEngine: results.testEngine, url: results.url, timestamp: results.timestamp,
    violations: results.violations, incomplete: results.incomplete,
    passedRules: results.passes.map(({ id }) => id),
  }, null, 2))
  await testInfo.attach('accessibility.json', { path: report, contentType: 'application/json' })
  expect(results.violations.map(({ id, impact, nodes }) => ({
    id, impact, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })),
  }))).toEqual([])
}
