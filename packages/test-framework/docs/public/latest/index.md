<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> From January 2019 onwards, projects use the Mobify Test Framework for end-to-end and performance testing. For anyone working on projects that were generated before January 2019, refer to the <a href="../testing/automated-testing">automated testing</a> documentation.
  </p>
</div>

# Overview
The Mobify Test Framework is a package of integrated testing tools used for End-to-end (E2E) and Performance testing PWAs.

The framework uses:
1. [Lighthouse](https://developers.google.com/web/tools/lighthouse/)
2. [Nightwatch](http://nightwatchjs.org/)

## Usage
```bash
mobify-test-framework [command]
Commands:
    lighthouse [options] <urls...>  Runs lighthouse tests on a list of URLs
    nightwatch [options]            Runs nightwatch end-to-end tests, using Mobify's recommended settings.
```

## Performance Testing <a name="performance-testing" href="#performance-testing">#</a>
### Lighthouse <a name="lighthouse" href="#lighthouse">#</a>
[Lighthouse](https://github.com/GoogleChrome/lighthouse) is a tool we use to assess an app against [Google's PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist).

It outputs a lighthouse report (in HTML and JSON) and our tool will assert a PASS or FAIL dependent on values and whether they meet configurable thresholds. We focus on two metrics: the Progressive Web App score and Time to First Interactive.

The Progressive Web App score is a percentage of passed PWA audits from various requirements. Aim for a score of 90 or better before project launch.

Time to First Interactive measures the first point in which necessary scripts have loaded and the CPU is idle enough to handle most user input. This threshold is given in milliseconds (ms). Our default threshold is under 10,000 ms and can be configured to be either higher or lower depending on the project.

```bash
# How to install:
npm i @mobify/test-framework

# How to use:
mobify-test-framework lighthouse https://www.merlinspotions.com

# Basic Settings:
--MaxTTI - set your the threshold of Time to Interactive in ms before reporting a failure (default: 10000 ms)
--minPwaScore - Minimum PWA score before reporting a failure (default: 90)
--minSEOScore - Minimum SEO score before reporting a failure (default: 100)
--minAccessibilityScore - Minimum accessibility score before reporting a failure (default: 100)
--checkConsoleErrors - Assert that browser errors are not logged to the console (default: false)
--mobifyPreview - Run tests using Mobify preview (default: false)
--outputDir - Output directory for reports (default: 'tests/lighthouse-reports')
# Settings follow the precendence: command parameters, environment variables, package.json, default values.

# We can also run Lighthouse against multiple URLs:
mobify-test-framework lighthouse https://www.merlinspotions.com https://www.merlinspotions.com/potions

# To run against local files with Mobify Preview, for when the PWA is not live:
# First run `npm start` to start development server of the PWA in another tab
mobify-test-framework lighthouse https://www.merlinspotions.com --mobifyPreview
```

## End to End Testing <a name="e2e-testing" href="#e2e-testing">#</a>
### Nightwatch <a name="nightwatch" href="#nightwatch">#</a>
[`Nightwatch.js`](http://nightwatchjs.org/) is a tool that automates user interaction for browser end-to-end tests. The Mobify Test Framework manages the installation of Selenium and Chromedriver and the latest versions are automatically downloaded when the project is installed.

```bash
# The following are optional environment variables of which you can set before running:
Environment variables:
    NIGHTWATCH_SAUCE_USERNAME      Saucelabs username
    NIGHTWATCH_SAUCE_ACCESS_KEY    Saucelabs password
    NIGHTWATCH_SRC_FOLDERS         Space-separated list of folders containing tests (default ['./tests/e2e'])
    NIGHTWATCH_OUTPUT_FOLDER       Output folder for test reports (default './tests/reports')
    NIGHTWATCH_SCREENSHOTS_PATH    Output folder for test screenshots (default './tests/screenshots')

# Run all end-to-end tests
mobify-test-framework nightwatch
```

Tests by default will use the `default` environment which is a Chrome instance that emulates a Pixel 2 device. You can view the configuration file at `node_modules/@mobify/test-framework/src/nightwatch-config.js`.

To specify custom paths to Selenium or Chromedriver, or to create new test configurations, you can create your own nightwatch-config and override it entirely. Additionally, you can pass any regular nightwatch argument to the Mobify Test Framwork.

```bash
# To run nightwatch while passing a custom nightwatch-config
mobify-test-framework nightwatch --config <file_path>

# Use '--' to pass extra args directly to nightwatch.
# eg. mobify-test-framework.js nightwatch -- "--verbose --env chrome_incognito"

# Run all end-to-end tests for a given tag
mobify-test-framework nightwatch -- "--tag checkout"

# Run all tests within a subdirectory
mobify-test-framework nightwatch -- "--group workflows/smoke-test"

# Run all end-to-end tests under a specific test environment
mobify-test-framework nightwatch -- "-e safari"

# Run only one test
mobify-test-framework nightwatch -- tests/e2e/workflows/merlins/home-example.js

# Run end-to-end tests on the production environment
env SKIP_PREVIEW=1 mobify-test-framework nightwatch

# If a test has failed and you would like to debug a single test without the browser closing in the end
env DEBUG=1 mobify-test-framework nightwatch --test test/e2e/workflows/guest-checkout.js
```

A typical project will have the tests fall under the `web/tests/e2e/workflows/` folder while page-objects (template-specific selectors and functions) are located in the `web/tests/e2e/page-objects/` folder.

We recommend creating End-to-end tests go through the core flow of checkout for both registered and guest to ensure the core flow does not break throughout the development cycle.
