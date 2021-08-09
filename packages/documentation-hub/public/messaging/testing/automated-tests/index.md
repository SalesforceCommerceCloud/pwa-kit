There are three test scripts that will be generated to automate testing of the various states seen in the above Subscription Flow diagram.
These scripts include coverage for both functional and visual UI testing.
They can be found in the `tests/scripts` folder. Page Objects for these tests can be found in the `tests/pages` folder.

### Subscribe

1.  show opt-in
2.  click on opt-in `Yes Please`
3.  show subscription
4.  browser set to auto-allow notifications
5.  show success confirmation

### No Thanks

1.  show opt-in
2.  click on opt-in `No Thanks`
3.  opt-in should not display for 5 sessions
4.  after 5 sessions, opt-in should re-display

### Blocked

1.  show opt-in
2.  click on opt-in `Yes Please`
3.  browser set to auto-block notifications
4.  redirect back to start page, with no opt-in

## Installation

If you haven't already done so, install [Nightwatch](http://nightwatchjs.org/guide/).

To install the latest version of Nightwatch using the npm command line tool, run the following:

```c
npm install -g nightwatch
```

## Test Configuration

The Nightwatch configuration will need to be updated before these tests can be run. The configuration can be found here: `tests/nightwatch.conf.js`.

The following placeholders will need to be updated:

-   `SITE_URL` : The url of the site under test.
-   `SCREENER_API_KEY` : The API key for Mobify's Screener account.
-   `SCREENER_GROUP_ID` : The Group ID for this project in Mobify's Screener account.
-   `SAUCE_LABS_USERNAME` : The username for Mobify's Sauce Labs account.
-   `SAUCE_LABS_ACCESS_KEY` : The Access Key for Mobify's Sauce Labs account.

## Run Tests

In the generated `nightwatch.conf.js` file, 4 test environments are included by default:

1.  `default` : Subscribe flow test for Desktop resolution.
2.  `mobile` : Subscribe flow test for Mobile resolution.
3.  `nothanks`: No Thanks flow test.
4.  `blocked`: Blocked flow test.

Automated Tests can be run individually or in parallel.

To run all tests in parallel from `tests` folder:

```c
nightwatch -e default,mobile,nothanks,blocked
```

To run individually, add only the name of the test environment you'd like to run. For example:

```c
nightwatch -e default
```

## Visual Tests

The "Subscribe" test captures snapshots at various resolutions to automate visual testing. When UI code is updated, these Screener tests can be re-run to catch visual regressions.

Results of the visual tests can be viewed in [Screener](https://screener.io).
