Released on February 14, 2019 

## Known Issues

### Progressive Web Apps
* [Navigation component](/progressive-web/latest/components/#!/Nav) will throw an error if two or more children in the navigation tree have the same path.
* Errors appear in the browser console when Service Worker loads cached assets while Chrome is in Incognito mode

### Native Apps
* Account dashboard is unresponsive on Android after user registers
* If a user is signed in from a previous session, the sign in / register tabs persists if you sign in again from App Onboarding
* Android devices with notches may not render as expected

## Fixes

### Universal Progressive Web Apps (Early Access)
* Resolved an issue where HTTP 400 errors would occur when accessing the Universal PWA from certain countries
* Resolved an issue where images were not appearing correctly on the carousel for Internet Explorer 11
* Resolved an issue where the Service Worker wasn’t functioning correctly on Safari 11 OS X
* Enhanced robots.txt functionality by supporting the load of different robots.txt based on the proxy hostname
* Disabled the Engagement Engine Tracking iFrame to improve SEO performance

### New Scaffold (Early Access)
* Resolved an issue where the new scaffold would fail to build if the project repository was saved to a workspace folder that contained a space in it
* Resolved an issue where white flashes would occur after the application is hydrated 
* Resolved an issue where node processes would continue to run in the background after shutting down the development server
* Resolved an issue where the npm run start:ssr:inspect command wouldn't rebuild the connector
* Resolved an issue where product images had incorrect margins set on larger breakpoints
* Removed usage of WebFonts throughout the new scaffold
* Allow developers to define and set a robots.txt file
* Cleaned up server side rendering critical-dependency console warnings from appearing on the client side
* Fixed broken documentation links embedded within the new scaffold
* Added skeletons to images within the product listing page template
* Adjusted the offline banner to appear under the header as opposed to overlapping it
* Reduced the noise of default developer console logging

### Progressive Web Apps
* Added an onLeave function to the SelectorRouter to properly reset its component and routeName values
* Added a string type check for Swatch component labels
* Added a portal prop to the Sheet component to allow developers to specify a target dom element to render a given Sheet
* Resolved an issue where a Mobify analytics tracking pixel would cause negative effects to SEO

### Native Apps
* Resolved an issue where adding additional views to the bottom of an anchored layout would crash the application
* Updated unit tests for instrumentation which were failing to run against Bitrise
* Smoothed out the transition when navigating between pages on Android
* Added a missing dependency (eslint-import-resolver-webpack package) whose absence would cause the application to fail to build
