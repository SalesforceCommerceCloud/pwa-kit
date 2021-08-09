<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> Projects generated <em>after</em> January 2019 use the <a href="../mobify-test-framework">Test Framework</a>. For anyone working on projects that were generated before January 2019, we've left the automated testing documentation here in case you still need to refer to it.
  </p>
</div>

Every project using the Progressive Mobile Web SDK includes an integrated test framework based on testing the PWA. There are 4 types of tests:
* Linting: Flags typos, syntax errors and enforces consistent code style.
* Unit testing: Checks components and low level features work as intended. 
* End-to-end testing: Verifies that user workflows, such as adding a product to the cart, can be performed in a browser.
* Performance testing: Measures the size and speed of your PWA.

Tests can be run locally or in a [continuous integration](#ci) environment.

## Linting
The Mobify PWA scaffold uses [`eslint`](http://eslint.org/) for verifying code quality. The test will fail if it catches any style or syntax errors. 

```bash
# Run the linter:
npm run lint

# Running the following will automatically fix common errors such as spacing:
npm run lint:fix
```

By default, it uses the [mobify-code-stye](https://www.github.com/mobify/mobify-code-style). 

You can add rules to the `.eslintrc.yml` file in the `web` directory inside your project directory.

## Unit Tests
We use [`jest`](https://facebook.github.io/jest/) as our unit testing framework. 

```bash
# To only run tests related to files you modify during development:
npm run test:watch

# To run the full test suite:
npm run test
```

## End to End Testing
[`Nightwatch.js`](http://nightwatchjs.org/) is a tool that automates user interaction for browser end-to-end tests. By default, the tests run using Chrome Device Mode.

Run `npm start` in another tab.

```bash
# Run all end-to-end tests
npm run test:e2e

# Run all end-to-end tests for a given tag
npm run test:e2e -- --tag checkout

# Run all tests within a subdirectory
npm run test:e2e -- --group workflows/smoke-test

# Run all end-to-end tests under a specific test environment
npm run test:e2e -- -e safari

# Run only one test
npm run test:e2e --test tests/e2e/workflows/merlins/home-example.js

# Run end-to-end tests on the production environment
npm run test:e2e-prod

# If a test has failed and you would like to debug a single test
npm run test:e2e-debug --test test/e2e/workflows/guest-checkout.js
```

Tests fall under the `web/tests/e2e/workflows/` folder while page-objects (template-specific selectors and functions) are located in the `web/tests/e2e/page-objects/` folder.

End-to-end tests go through the core flow of checkout for both registered and guest to ensure the core flow does not break throughout the development cycle.

By default, Nightwatch manages the life cycle of Selenium and Chromedriver. The latest versions are automatically downloaded when the project is installed. To specify custom paths to Selenium or Chromedriver, or to adjust test configuration, examine the `nightwatch-config.js` file under `web/tests/e2e`:

```
    selenium: {
        start_process: true,
        # path to Selenium .jar file
        server_path: './node_modules/nightwatch-commands/selenium/selenium-server.jar',
        log_path: './node_modules/nightwatch-commands/selenium/',
        cli_args: {
            # paths to browser drivers
            'webdriver.chrome.driver': './node_modules/nightwatch-commands/selenium/drivers/chromedriver'
        }
    },
```

Tests will use the `default` environment, which is a Chrome instance that emulates a Nexus 5 device with browser push notifications enabled. Additional test environments inherit from `default`. Add new test environments by defining your own `desiredCapabilities` and overriding the settings from `default`:

```
    test_settings: {
        default: {
            # ...
            desiredCapabilities: {
                browserName: 'chrome',
                # ...
            }
        },
        custom: {
            selenium_start_process: false,
            selenium_port: 4723,
            selenium_host: '0.0.0.0',
            desiredCapabilities: {
                browserName: 'Safari',
                platformName: 'iOS',
                platformVersion: '11.2'
            }
        }
    }
```

Then use `npm run test:e2e -- -e custom` to run the E2E tests using the custom environment

### Additional Resources
* [Overview of Nighwatch](https://docs.google.com/presentation/d/1y5dEz_b82xDlJ0yVcMPMmt19Li6pYqkE7ohzHwq8AyI/pub?start=false&loop=false&delayms=3000)
* [Writing tests](http://nightwatchjs.org/guide)
* [Configuration](http://nightwatchjs.org/gettingstarted#settings-file)
* [API](http://nightwatchjs.org/api)
* To cover previewing our mobile sites, we've also written custom nightwatch APIs available [here](https://github.com/mobify/nightwatch-commands).

## Performance Testing

### Lighthouse
We use [Lighthouse](https://github.com/GoogleChrome/lighthouse) to assess an app against [Google's PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist).

We focus on two metrics: the Progressive Web App score and Time to First Interactive. The Progressive Web App score is a threshold that is configurable in the `web/package.json` file by adjusting the `min_lighthouse_score` variable. Lighthouse gives the score as a percentage of passed PWA audits. For projects using Lighthouse 2.x, aim for a score of 90 or better.

Time to First Interactive measures the first point in which necessary scripts have loaded and the CPU is idle enough to handle most user input. This threshold, given in milliseconds (ms), is configurable in the `web/package.json` file by adjusting the `max_first_interactive` variable. Aim for 10,000 ms or less. 

Lighthouse will run against the configurable `siteUrl` in the `web/package.json` file.
It's important to note that we should be testing performance via bundles on cloud.mobify.com for the closest result to what we see when we go live. 

```bash
# Run against local files with Mobify Preview, for when the PWA is not live:
# First have `npm start` running in another tab
npm run test:pwa-preview

# We can run Lighthouse tests against what's currently on production:
npm run test:pwa-prod

# We can also run Lighthouse against another URL:
npm run test:pwa-prod https://hybris.merlinspotions.com
```

When the test completes, you can find the full HTML report under `web/tests/performance/lighthouse/reports`. 

---

It is good practice to ensure that the PWA experience is optimal for common entry pages such as homepage, PLP, and PDP. To assist with this, configure a JSON file of environments and URLs.

`web/tests/performance/lighthouse/lighthouse-urls.json`:
```json
{
    "production": {
        "Homepage": "https://www.merlinspotions.com",
        "PLP": "https://www.merlinspotions.com/potions.html",
        "PDP": "https://www.merlinspotions.com/potions/eye-of-newt.html"
    },
    "staging": {
        "Homepage": "https://staging.merlinspotions.com",
        "PLP": "https://staging.merlinspotions.com/potions.html",
        "PDP": "https://staging.merlinspotions.com/potions/eye-of-newt.html"
       }
}
```

Then use `npm run test:lighthouse` to run Lighthouse against multiple pages.

```bash
# Run Lighthouse on staging using local files through Mobify Preview:
# First have `npm start` running in another tab
npm run test:lighthouse staging preview

# Run Lighthouse against production URLs without Preview (default):
npm run test:lighthouse
```


### Additional Resources
* [Lighthouse Information](https://developers.google.com/web/tools/lighthouse/)
* [Google's PWA Checklist](https://developers.google.com/web/progressive-web-apps/checklist)

### Bundle Size

This test uses [bundlesize](https://github.com/siddharthkp/bundlesize) to verify that built files are below a specified threshold. Define file paths and maximum gzipped sizes in `package.json`:

```json
  "bundlesize": [
    {
      "path": "build/loader.js",
      "maxSize": "30 kB"
    },
    {
      "path": "build/main.css",
      "maxSize": "15 kB"
    },
    {
      "path": "build/vendor.js",
      "maxSize": "200 kB"
    }
  ],
```


```bash
# Build the project
npm run prod:build

# Check that gzipped file sizes are below thresholds
npm run test:max-file-size
```

## Continuous Integration<a name="ci"></a>

Mobify uses [CircleCI 2.0 Workflows](https://circleci.com/docs/2.0/workflows/) for continuous integration. The general workflow is as follows:

1. Code is pushed to a repository
1. CircleCI runs a [Docker image](https://hub.docker.com/r/mobify/cci-docker-primary/)
1. CircleCI builds the project
1. CircleCI runs the automated tests
 1. Linting
 1. Unit
 1. End-to-end
 1. Performance
1. CircleCI uploads a bundle if the tests pass 

The workflow jobs are defined and orchestrated in the `.circleci/config.yml` file. 

### Setting up

1. Browse to [CircleCI](https://circleci.com/) and authenticate using GitHub
1. Choose projects to follow on your dashboard, or follow the prompts to add a new project to CircleCI
1. Click on **Set Up Project** for the project that you want CircleCI to build
1. Click on **Start building**
1. CircleCI will detect the `.circleci/config.yml` configuration file that is automatically generated with your project and start building the project
1. CircleCI will automatically trigger a new build whenever code is pushed to Github. 

The CircleCI environment is based upon [a Docker image of a typical Mobify development environment](https://hub.docker.com/r/mobify/cci-docker-primary/). The `config.yml` file contains a number of [jobs](https://circleci.com/docs/2.0/jobs-steps/) that are a collection of commands, and [workflows](https://circleci.com/docs/2.0/workflows/) that define the execution order of jobs. 

Edit the `config.yml` file to customize the build for your project.

### Additional Resources

[CircleCI Docs](https://circleci.com/docs/2.0/)

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>