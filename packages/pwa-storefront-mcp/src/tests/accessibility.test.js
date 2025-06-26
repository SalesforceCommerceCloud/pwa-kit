import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

export async function runAccessibilityTest(siteUrl) {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(siteUrl);

  // Run axe-core analysis on the loaded page
  const results = await new AxeBuilder({ page }).analyze();


  await browser.close();

  return {
    content: [{type: 'text', text: JSON.stringify(results, null, 2)}]
  };
} 