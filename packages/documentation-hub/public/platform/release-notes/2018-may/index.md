Released on May 17, 2018

## New features

### Progressive Web Apps & Accelerated Mobile Pages

#### Upgrade to Webpack 4

The module build system has been upgraded to WebPack 4 for new PWA and AMP projects. Webpack 4 greatly reduces build times for projects, with reports of up to [98% faster](https://medium.com/webpack/webpack-4-released-today-6cdb994702d4). We're personally seeing an approximate 10 second gain in build times in our PWA and AMP project starting points!

Existing projects looking to leverage Webpack 4 can follow our [upgrade guide](https://docs.mobify.com/progressive-web/latest/upgrades/webpack-4/) to do so.

Find more information on all the changes that come with Webpack 4 on their official [release notes](https://github.com/webpack/webpack/releases/tag/v4.0.0-beta.0). We've upgraded specifically to [Webpack v4.6](https://github.com/webpack/webpack/releases/tag/v4.6.0)

### Integrations

#### Adobe Analytics Connector

A new connector for Analytics Manager is available that sends events to Adobe Analytics. The connector will save you time by initializing the integration to Adobe Analytics and automatically sending a list of events we see in most Adobe implementations:
* Pageview
* Add to cart
* Remove from cart
* Purchase

More information on this connector, including how to track additional events, can be found in our [Analytics Documentation](https://docs.mobify.com/progressive-web/latest/analytics/extendable-analytics-connectors/#adobedtm).

## Enhancements

### Native Apps Enhancements

Navigations between WebViews on iOS are now smoother than ever! Previously, slow network connections would intermittently cause janky navigations on iOS. Navigations should now be rid of any janky behavior on iOS.

We've also addressed numerous bugs in our native app starting point including:
* Account tab re-loading indefinitely
* Cart modal loading slowly
* Share not doing anything on product detail pages

### GDPR Updates

A new set of Privacy Regulations comes into effect on May 25th, 2018 that gives residents of the EU more control over what information is stored on them. Now visitors must give permission for any personally identifiable information to be collected, and can ask to see it or have it erased. More details [here](https://gdpr-info.eu/). Our Engagement Engine previously tracked IP address and the location of a shopper, which is considered personally identifiable information. To comply with these regulations and act in our shoppers' best interests, we have changed our tracking to only collect the first 3 quadrants of an IP address. This keeps the user anonymous and means location can only be determined up to a city level.

Changes have also been made to our PWA project starting point to be compliant with GDPR. These changes include:
* Adding messaging on data storage and usage in the account creation template, push notification subscription component, and the newsletter subscription component
* Adding a tracking consent notification component. Projects still looking to track personally identifiable information will need to leverage this component to do so.

Existing PWA projects will need to account for these component changes if needed.

## Known issues

### Progressive Web Apps

* Browsing in incognito mode may cause an `Uncaught (in promise) DOMException: Quota exceeded.` error to be thrown. Chrome is incorrectly reporting the amount of data we're putting in the service worker storage. This issue is mostly isolated to incognito mode, as storage limits are much smaller in incognito mode. The issue is also a [known issue with Chrome](https://bugs.chromium.org/p/chromium/issues/detail?id=795134). Currently, we have not identified any negative impact from the thrown error.

### Native apps

* Back navigations will intermittently cause a brief flash on the screen before the apps content fully loads in.
* On Android, the account page pulls in additional unwanted content
* Links in the account dashboard require two taps to trigger
* The Continue Shopping button in the cart incorrectly leads to an irresponsive homepage
