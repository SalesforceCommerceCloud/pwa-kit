// @ts-check
const {defineConfig, devices} = require('@playwright/test')

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
    testDir: './e2e',
    timeout: 60000,
    /* Run tests in files in parallel */
    fullyParallel: true,
    /* Fail the build on CI if you accidentally left test.only in the source code. */
    forbidOnly: !!process.env.CI,
    /* Retry on CI only */
    retries: 3,
    /* Opt out of parallel tests on CI. */
    workers: 1,
    /* Reporter to use. See https://playwright.dev/docs/test-reporters */
    reporter: [['list']],
    /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
    use: {
        /* Base URL to use in actions like `await page.goto('/')`. */
        // baseURL: 'http://127.0.0.1:3000',

        /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
        trace: 'on-first-retry'
    },
    snapshotPathTemplate: '{testDir}/{testFileDir}/__snapshots__/{arg}{ext}',
    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: {...devices['Desktop Chrome']},
            testIgnore: ['**/a11y/**', '**/mobile/**']
        },

        /* Test against mobile viewports. */
        {
            name: 'mobile-chrome',
            use: {...devices['Pixel 5']},
            testIgnore: ['**/a11y/**', '**/desktop/**']
        },
        {
            name: 'a11y-mobile',
            use: {...devices['Pixel 5']},
            testDir: './e2e/tests/a11y/mobile'
        },
        {
            name: 'a11y-desktop',
            use: {...devices['Desktop Chrome']},
            testDir: './e2e/tests/a11y/desktop'
        }
    ]
})
