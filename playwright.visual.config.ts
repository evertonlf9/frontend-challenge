import { defineConfig } from '@playwright/test'
import base from './playwright.config.ts'

export default defineConfig(base, {
  testMatch: 'setup.visual.spec.ts',
  testIgnore: [],
  outputDir: 'test-results/visual',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/visual' }], ['json', { outputFile: 'playwright-report/visual-results.json' }]],
})
