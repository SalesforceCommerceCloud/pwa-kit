# Progressive Web App

This package is your PWA. It supports server-side rendering (SSR) and client-side
rendering. You can develop both locally using the same codebase.

## Setup

```bash
npm install
```

## Running Your PWA

To start the Server Side Rendering (SSR) server, run:

```bash
npm run start
```

The start command prints the URL you need to open in your browser to the console.


## Building Your PWA

Your project comes with a sample Commerce Integrations connector as well as examples
for home, product-listing and product description pages.

Our sample pages include links to sections in our documentation that show you how to
customize your PWA using our tools by including forms, modals, navigation, etc.
We recommend you run your PWA and explore the sample pages to get a feel for where
to begin.

For more context take a look at our documentation at [dev.mobify.com][mobify-docs].

- [mobify-docs](http://dev.mobify.com)

## Testing Your PWA

Your project comes with two testing suites already integrated, `jest` in conjuction with
`react-testing-library` for your unit tests and `cypress.io` for your end-to-end tests.

To run these tests type the blow commends in your terminal:

```bash
# Runs your unit tests
npm run test
```

```bash
# Runs your end-to-end tests. (Be sure to have your local dev server running in the 
# background or another tab)
npm run test:e2e
```

We've also included sample tests for both unit and e2e tests in the sample pages created.

For more information on how you can test your app, look at the sample unit tests located
along side your page components, and end-to-end tests located in the `app/cypress` folder.

You can continue your learning by looking at each library's documentation below:

- [cypress.io](https://docs.cypress.io/)
- [jest](https://jestjs.io/docs/getting-started/)
- [react-testing-library](https://testing-library.com/docs/react-testing-library/intro)

## Run Lighthouse tests in your PWA
This will run Lighthouse three times and upload the median Lighthouse report.
```bash
npm run test:lighthouse --prefix packages/pwa
```