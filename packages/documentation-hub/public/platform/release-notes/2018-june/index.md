Released on June 29, 2018

## New features

### Progressive Web Apps

#### Responsive Grids and Deprecations
As part of future expansion of the PWA SDK to support tablet and desktop screen sizes, the default grid system is being overhauled to support more complex use cases.

Previously, the [Grid](https://docs.mobify.com/progressive-web/latest/components/#!/Grid) and [GridSpan](https://docs.mobify.com/progressive-web/latest/components/#!/GridSpan) components were provided as an abstraction from the underyling grid framework. Checkout-related components relied on the Grid and GridSpan for responsive layouts. These two components are now formally deprecated and will be removed in a future major release. Components that rely on Grid and GridSpan will be migrated to use the updated [Susy 3](http://oddbird.net/susy/docs/) framework in a future release.

See the new [responsive grid documentation](https://docs.mobify.com/progressive-web/latest/guides/responsive-grid/) for how to use the new grid system.


#### Utility Functions

Utility functions are an important tool developers can leverage to streamline their development experience. However, they're not very useful if they're not well documented.  We've worked towards addressing that gap, and have added [documentation](https://docs.mobify.com/progressive-web/latest/reference/javascript-utility-functions/) for a subset of our utility functions.

We've also migrated a subset of these utility functions that were living within our project starting point to the PWA SDK to simplify future project upgrades.

In future releases, we'll continue to migrate and document the rest of our remaining utility functions.

### Native Apps

#### Bitrise

[Buddybuild](https://www.buddybuild.com/), a tool we used to handle continuous integration and deployment of all of native app projects, was acquired out by Apple at the beginning of the year. With the acquisition, Buddybuild has dropped support for Android. To cover this gap, we're introducing a new integration with a tool called [Bitrise](https://www.bitrise.io/dashboard).

You can find more information on the both Bitrise and buddybuild in our [official documentation](http://astro.mobify.com/latest/guides/testing-and-launching-your-app/continuous-delivery/).

#### Documentation Updates

Over recent product releases, we've bolstered our native app and PWA integrations through various new features and updates. We've reinforced our documentation to reflect the pace of these changes.

Developers will be able to learn directly about the support Astro provides for [integrating PWAs](http://astro.mobify.com/latest/guides/extra/pwa-support/), and will also be able to learn how to [synchronize data between multiple instances of a PWA](http://astro.mobify.com/latest/guides/extra/tab-syncing/) within their Astro app.

## Known issues

### Progressive Web Apps
* [Navigation component](https://docs.mobify.com/progressive-web/latest/components/#!/Nav) will throw an error if two or more children in the navigation tree have the same path.
* Service Worker support on iOS is disabled due to an outstanding Apple Safari bug introduced in iOS 11.4. Support will be re-enabled when a fix is deployed by Apple. Apple bug ID 40670799
* Errors appear in the browser console when Service Worker loads cached assets while Chrome is in Incognito mode

### Native Apps
* Back navigations will intermittently cause a brief flash on the screen before the apps content fully loads in.
* Apps on Super retina (iPhone X) resolutions don't render properly with the notch
* Localization of native components in Android API 25+ is not yet supported
* Unexpected additional content within the account page on Android
* The account tab segmented control does not show up in new versions of iOS
* Account dashboard is unresponsive after user registers

## Fixes

### Progressive Web Apps

* Addressed an iOS issue in the Sheet component where the scrolling could escape into outer containers

### Native Apps

* Addressed an issue where the Continue Shopping button in the cart incorrectly leads to an irresponsive homepage
* Links within the account dashboard will now trigger properly after one click
