Released on November 16, 2017

## Progressive Web Apps

### Bug Fixes
- Added a new modal action to allow developers to flag modals to "prerender". Previously, if a modal was in a closed state it's markup wouldn't be rendered in the DOM. Flagging a modal to prerender will render it in the DOM regardless of it's state. This can improve your SEO.
- Fixed an issue that was causing Google's search engine crawlers to incorrectly render Progressive Web App pages.

### Multiple Environment Support
We now offer enhanced support for multiple development or staging environments. Our customers typically have multiple development environments to support in the form of production, staging, QA, and developer test environments. Prior to this release, each development environment required it's own [Mobify tag](https://docs.mobify.com/progressive-web/latest/getting-started/installing-the-mobify-tag/). Any Mobify tag changes would require re-generating multiple Mobify tags. A single tag can now load different bundles designated by the environment's hostname.

## Analytics

### Breakdown by Device Type
In Connection Center, you can now see how your push notifications perform by device: mobile, desktop, and tablet. All campaign metrics are broken down by device type so that you can compare shopper behavior based on the devices they use. These metrics include: messages displayed, messages clicked, and revenue.

### Breakdown by Push Message
In Connection Center, you can see a breakdown of analytics for each push message. For example, when you have a campaign with one message in English and another in Spanish, you can see the analytics for each message individually. This enables you to learn more about different subscriber segments and how they react to the messages you send. Analytics are still available at a campaign level as well so that you can compare campaigns as a whole.

## UI Kit

### Components Page
We've added a new page, and with it a new way to find the latest SDK components. Instead of using the Symbols page to find and edit components, this page groups all the components together under their respective symbol paths. Use this page to locate a component before copying and pasting into your layout design.

### AMP Components
Mobify's AMP SDK is a collection of components designed to work on Google's Accelerated Mobile Pages. The Components page groups them together so that you know which PWA components are AMP-ready. Visually, the AMP and PWA templates should appear the same; therefore, these components are made of the same [symbol](https://sketchapp.com/docs/symbols/). Updates to symbols will be applied everywhere.

### Best Practice Layouts
We've cleaned up the pages and grouped every template under one Layouts page. This makes it easier for developers to find the templates they're looking for, including all additional states and modals.

### AMP Layouts
On the UI kit's Best Practice Layouts page we've introduced AMP layouts. These represent Mobify's tried and tested techniques for composing AMP templates using the [Mobify AMP SDK suite of components](https://docs.mobify.com/amp-sdk/latest/components/).

### Improved SDK parity
We've reduced disconnect between the UI kit and what's in the SDK. Any component you choose to include from the Mobify UI kit has a corresponding fully tested SDK component (unless indicated on the Components page).
