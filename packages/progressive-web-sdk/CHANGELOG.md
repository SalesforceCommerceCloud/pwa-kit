## v1.18.2 (Aug 27, 2021)
## v1.18.1 (Jun 22, 2020)
- Hotfix: Fix incorrect handling of capital letters inside querystrings in request processor code [#2760](https://mobify.atlassian.net/browse/WEB-2760)

## v1.18.1-alpha.0 (Jun 17, 2020)
## v1.17.0 (Apr 13, 2020)
- Use `itemId` for AccordionItem component `data-analytics-content` value [#1051](https://github.com/mobify/mobify-platform-sdks/pull/1051)

## v1.16.2 (Mar 12, 2020)
## v1.16.1 (Feb 19, 2020)
## v1.16.0 (Feb 06, 2020)
- Update React peerDependency to >=16.8 which issues proper warnings about incompatible versions when updating the SDK. [#1002](https://github.com/mobify/mobify-platform-sdks/pull/1002)

## v1.15.2 (Jan 21, 2020)
## v1.15.1 (Jan 16, 2020)
## v1.15.0 (Jan 10, 2020)
- **OTHER CHANGES**
    - Fix an application cache bug where device type does not affect cache key locally. [#885](https://github.com/mobify/mobify-platform-sdks/pull/885)
    - Fix application cache key generation to account for edge cases. [#861](https://github.com/mobify/mobify-platform-sdks/pull/861)
    - The project generator now outputs the proxy configs in the new format [#883](https://github.com/mobify/mobify-platform-sdks/pull/883)
    - Update runtime requirement to Node v10.17.0 [#947](https://github.com/mobify/mobify-platform-sdks/pull/947)

## v1.14.1 (Dec 05, 2019)
- Hotfix for `dangerous-html` and `accordion`components. [#904](https://github.com/mobify/mobify-platform-sdks/pull/904)

## v1.14.0 (Nov 14, 2019)
- **OTHER CHANGES**
    - Improve application cache performance and make cache delete operation non-blocking. [#822](https://github.com/mobify/mobify-platform-sdks/pull/822)
    - Fix an application cache bug where the device type is not respected [#797](https://github.com/mobify/mobify-platform-sdks/pull/797)
    - new `withUniqueId` HOC component and use in `Accordion` and `Icon` components [#749](https://github.com/mobify/mobify-platform-sdks/pull/749)
    - Update application cache key generation function to support upcoming cache invalidation feature [#847](https://github.com/mobify/mobify-platform-sdks/pull/847)

## v1.13.2 (Oct 30, 2019)
- **OTHER CHANGES**
    - Add support for node v10.x [#785](https://github.com/mobify/mobify-platform-sdks/pull/785)
        - Fix racing condition of Promises in SSR server

## v1.13.1 (Sep 30, 2019)
- **OTHER CHANGES**
    -  Hotfix - remove CSS code split to ensure Node SSR compatibility [#745](https://github.com/mobify/mobify-platform-sdks/pull/745)

## v1.13.0 (Sep 26, 2019)
- **OTHER CHANGES**
    - Escape query string [#658](https://github.com/mobify/mobify-platform-sdks/pull/658)
    - Change `componentWillMount` to `componentDidMount` of `addToHomescreenHOC` to ensure the component is safe to render in server [#644](https://github.com/mobify/mobify-platform-sdks/pull/644)
    - Add a default request-processor.js file and update docs [#664](https://github.com/mobify/mobify-platform-sdks/pull/664).
    - Fix `lockup` not render on server side [#657](https://github.com/mobify/mobify-platform-sdks/pull/657)
    - Fix `bazaarvoiceWrapper` not render on serverside [#654](https://github.com/mobify/mobify-platform-sdks/pull/654)
    - Add CSS code split for pwa [#690](https://github.com/mobify/mobify-platform-sdks/pull/690)

## v1.12.1 (Sep 03, 2019)
- **OTHER CHANGES**
    - Hotfix for `extract-route-regexes` script not being backwards compatible with existing projects. [#679](https://mobify.atlassian.net/browse/WEB-2416)

## v1.12.0 (Aug 15, 2019)
- **OTHER CHANGES**
    - Remove unused `sdk-schema-from-raml` command, scripts and dependencies [#596](https://github.com/mobify/mobify-platform-sdks/pull/596).
    - Update DebugInfo with SSR support [#356](https://github.com/mobify/mobify-platform-sdks/pull/356)
    - Fix an issue with the Field component's label style where the hint text overflows its parent [#566](https://github.com/mobify/mobify-platform-sdks/pull/566)
    - Fix the Stepper component's default disabled button style [#565](https://github.com/mobify/mobify-platform-sdks/pull/565)
    - Fix React warning thrown by the NavSlider component [#570](https://github.com/mobify/mobify-platform-sdks/pull/570)
    - Fix issue where the Carousel component and the document could scroll at the same time [#574](https://github.com/mobify/mobify-platform-sdks/pull/574)
    - Remove redux from DebugInfo component [#579](https://github.com/mobify/mobify-platform-sdks/pull/579)
    - Set keepAlive option for http(s) connections from the SSR server [#560](https://github.com/mobify/mobify-platform-sdks/pull/560)
    - Fix issues with local dev server persistent cache [#580](https://github.com/mobify/mobify-platform-sdks/pull/580)
    - Wrapped DebugInfo in a Sheet component and changed styling.[#607](https://github.com/mobify/mobify-platform-sdks/pull/607)
    - Remove references to analytics v1 constants for the components' data-analytics-name. Remove reference to analytics v1 performance metrics in Image component. Remove reference to analytics v1 error in Bazaar Voice Wrapper component. [#590] (https://github.com/mobify/mobify-platform-sdks/pull/590)
    - Fix issue where the Image component didn't display loaded images with the `?mobify_server_only` query parameter. [#606](https://github.com/mobify/mobify-platform-sdks/pull/606)
    - Add CloudWatch metrics for `ApplicationCache` usage [#567](https://github.com/mobify/mobify-platform-sdks/pull/567)
    - Rename the persistent cache to application cache [#611](https://github.com/mobify/mobify-platform-sdks/pull/611)
    - Fix JSDOM custom resource loader tests in `progressive-web-sdk` [541](https://github.com/mobify/mobify-platform-sdks/pull/541)
    - Pass `buildOrigin` query parameter to `service-worker-loader` request [#401](https://github.com/mobify/mobify-platform-sdks/pull/401)
    - Include `deployId` in request & response hook options [#540](https://github.com/mobify/mobify-platform-sdks/pull/540)
    - Fix issue where worker.js was being served as worker.js.map [#559](https://github.com/mobify/mobify-platform-sdks/pull/559)
    - Fix the Stepper component's default disabled button style [#565](https://github.com/mobify/mobify-platform-sdks/pull/565)

## v1.11.2 (Jul 17, 2019)
- **OTHER CHANGES**
    - Hotfix for Analytics Integrations `loadScript` utility function so onLoad and onError event listeners get chained instead of overridden when called more than once. [#542](https://github.com/mobify/mobify-platform-sdks/pull/542) [#535](https://github.com/mobify/mobify-platform-sdks/pull/535)

## v1.11.1 (July 8, 2019)
- **OTHER CHANGES**
    - Fix Setting `isServerSideOrHydrating` Value [#507](https://github.com/mobify/mobify-platform-sdks/pull/507)

## v1.11.0 (July 2, 2019)
- **OTHER CHANGES**
    - Fix a11y issue for Carousel: `tabIndex` = 0 instead of index, replace `onKeyDown` to `onKeyPress`
    - Added analytics-integrations [#369] (https://github.com/mobify/mobify-platform-sdks/pull/369)
    - Add persistent SSR-side cache [#395](https://github.com/mobify/mobify-platform-sdks/pull/395)
    - Added Target APIs Docs [410](https://github.com/mobify/mobify-platform-sdks/pull/410)
    - Add persistent cache API [#431](https://github.com/mobify/mobify-platform-sdks/pull/431)
    - Improve unencrypted HTTP SSR server listener in local development [#400](https://github.com/mobify/mobify-platform-sdks/pull/400)
    - Remove unused dependencies from the SDK: escape-html-in-json, react-test-renderer, walk, copy-webpack-plugin, jest-environment-jsdom, jest-environment-jsdom-global, jstransformer-marked, style-loader, and webpack-hot-middleware [436](https://github.com/mobify/mobify-platform-sdks/pull/410)
    - Enhance the persistent cache API [#485](https://github.com/mobify/mobify-platform-sdks/pull/485)
    - Don't download google-analytics multiple times [#391](https://github.com/mobify/mobify-platform-sdks/pull/391)
    - QueryParameters class encodes spaces as + characters [#381](https://github.com/mobify/mobify-platform-sdks/pull/381)
    - Add support for request classes [#385](https://github.com/mobify/mobify-platform-sdks/pull/385)

## v1.10.0 (May 17, 2019)
- **OTHER CHANGES**
    - Apply fixes to the Carousel component to resolve bugs occurring in IE11 and iOS 12 [#1464](https://github.com/mobify/progressive-web-sdk/pull/1464)
    - Upgrade jQuery to 3.4 [#1461](https://github.com/mobify/progressive-web-sdk/pull/1461)
    - Add an environment variable to allow running the local SSR server on HTTP [#1462](https://github.com/mobify/progressive-web-sdk/pull/1462)
    - Include the SDK version number in the SSR server response headers [#361](https://github.com/mobify/mobify-platform-sdks/pull/361)
    - Handle service worker caching better [#1456](https://github.com/mobify/progressive-web-sdk/pull/1456)
    - Additional logging for SSR Server [#1458](https://github.com/mobify/progressive-web-sdk/pull/1458)
    - Add scroll percentage to LazyLoader fetch scroll [#1378](https://github.com/mobify/progressive-web-sdk/pull/1378)
    - Change NavSlider style for smooth transition [#1441](https://github.com/mobify/progressive-web-sdk/pull/1441)
    - Change memory handling in the SSR Server [#1455](https://github.com/mobify/progressive-web-sdk/pull/1455)
    - Fix `Sheet` component touch event handlers [#1432](https://github.com/mobify/progressive-web-sdk/pull/1432)
    - Fixes the bug where clicking next button of the carousel would cause all image to show one by one. [#1435](https://github.com/mobify/progressive-web-sdk/pull/1435)
    - Add HTML elements & React Components as popover triggers [#1400](https://github.com/mobify/progressive-web-sdk/pull/1400)
    - Add server-side timing code [#1408](https://github.com/mobify/progressive-web-sdk/pull/1408)
    - Add request-processor support [#1422](https://github.com/mobify/progressive-web-sdk/pull/1422)
    - Upgrade JSDOM to v14.0, which includes an update to the SDK's custom resource loader to work with JSDOM's new class based Resource Loader API [#1426](https://github.com/mobify/progressive-web-sdk/pull/1426)
    - Honour X-Mobify-QueryString header to work around query parameter re-ordering [#1446](https://github.com/mobify/progressive-web-sdk/pull/1446)

## v1.9.2 (April 12, 2019)
- **OTHER CHANGES**
    - Revert sheet focus trap fix. [#1447](https://github.com/mobify/progressive-web-sdk/pull/1447)

## v1.9.1 (April 2, 2019)
- **OTHER CHANGES**
    - Revert IE carousel fix. [#1415](https://github.com/mobify/progressive-web-sdk/pull/1415)
    - Fix `Sheet` component aria attributes. [#1412](https://github.com/mobify/progressive-web-sdk/pull/1412)
    - Add support for bazaarvoice API version 2 [#1431](https://github.com/mobify/progressive-web-sdk/pull/1431)

## v1.9.0 (March 26, 2019)
- **OTHER CHANGES**
    - Fix an issue in Component docs that was previously breaking the design of the site search input field. [#1398](https://github.com/mobify/progressive-web-sdk/pull/1398)
    - Change shimmer animation implementation to improve performance [#1399](https://github.com/mobify/progressive-web-sdk/pull/1399)
    - Fix Windows path-comparison issue in the extract-route-regexes script.
    - Inside extract-route-regexes script, ensure babel-register does not compile any require() calls outside the current (i.e. other packages within a monorepo). [#1395] (https://github.com/mobify/progressive-web-sdk/pull/1395)
    - Add a AddToHomescreenIosBanner component [#1318](https://github.com/mobify/progressive-web-sdk/pull/1318)
    - Add a thunk for ssrRenderingComplete and ssrRenderingFailed. [#1385](https://github.com/mobify/progressive-web-sdk/pull/1385)
    - Add inline style support to Image component [#1393](https://github.com/mobify/progressive-web-sdk/pull/1393)
    - Update the ssrShared pattern in docs. [#1386](https://github.com/mobify/progressive-web-sdk/pull/1386)
    - Add DebugInfo component for viewing build/development info WEB-1792 [#1354](https://github.com/mobify/progressive-web-sdk/pull/1354)
    - Allow 'Nav' component to process a navigation tree with duplicate paths. (https://github.com/mobify/progressive-web-sdk/pull/1358)
    - Make carousel pips clickable [#1361](https://github.com/mobify/progressive-web-sdk/pull/1361)
    - Add more checks to test support for document.write [#1381](https://github.com/mobify/progressive-web-sdk/pull/1381)
    - Trap focus in `Sheet` component [#1382](https://github.com/mobify/progressive-web-sdk/pull/1382)
    - Initialize window.Progressive more efficiently in a UPWA [#1390](https://github.com/mobify/progressive-web-sdk/pull/1390)
    - Add optional split test tracking to the GA connector [#1394](https://github.com/mobify/progressive-web-sdk/pull/1394)
    - Support caching proxies [#1337](https://github.com/mobify/progressive-web-sdk/pull/1337)

## v1.8.0 (February 14, 2019)
- **OTHER CHANGES**
    - Include query parameters on x-proxy-request-url [#1368](https://github.com/mobify/progressive-web-sdk/pull/1368)
    - Ensure selector router clears component and routeName when leaving [#1363](https://github.com/mobify/progressive-web-sdk/pull/1363)
    - Add X-Request-Url header to proxied responses [#1366](https://github.com/mobify/progressive-web-sdk/pull/1366)
    - Fix image component not rendering data URLs server-side [#1359](https://github.com/mobify/progressive-web-sdk/pull/1359)
    - Add `x-mobify: true` header on proxied requests [#1362](https://github.com/mobify/progressive-web-sdk/pull/1362)
    - Carousel IE11 fix [#1357](https://github.com/mobify/progressive-web-sdk/pull/1357)
    - Add string type check for Swatch labels WEB-1967 [#1350](https://github.com/mobify/progressive-web-sdk/pull/1350)
    - Correctly update https.globalAgent options [#1351](https://github.com/mobify/progressive-web-sdk/pull/1351)
    - Patch response.redirect to avoid creating a body [#1355](https://github.com/mobify/progressive-web-sdk/pull/1355)
    - Loopback proxying for the SSR Server [#1341](https://github.com/mobify/progressive-web-sdk/pull/1341)
    - IE11 support fix for `jqueryResponse` [#1344](https://github.com/mobify/progressive-web-sdk/pull/1344)
    - Cookie and Host header handling for non-proxy SSRServer requests [#1347](https://github.com/mobify/progressive-web-sdk/pull/1347)
    - Access control header on loopback requests from the SSR Server [#1348](https://github.com/mobify/progressive-web-sdk/pull/1348)
    - Rewrite the `src` of chunk `<script>` files in the server-side rendered `<head>` [#1349](https://github.com/mobify/progressive-web-sdk/pull/1349)
    - Add `portal` property to the `Sheet` component [#1276](https://github.com/mobify/progressive-web-sdk/pull/1276)
    - Fix SSR to load bundle chunks correctly on Windows [#1301](https://github.com/mobify/progressive-web-sdk/pull/1301)
    - Wrap `ssrRenderingComplete` in a Promise [#1339](https://github.com/mobify/progressive-web-sdk/pull/1339)
    - Bump `sandy-tracking-pixel-client` version to 0.1.31 [#1338](https://github.com/mobify/progressive-web-sdk/pull/1338)
    - Strip internal headers from proxied requests [#1336](https://github.com/mobify/progressive-web-sdk/pull/1336)

## v1.7.0 (January 8, 2019)
- **OTHER CHANGES**
    - Upgrade node-sass from 4.5.2 -> 4.11.0 (Windows compatibility) [#1331](https://github.com/mobify/progressive-web-sdk/pull/1331)
    - Add Mobify CLI tool. [#1307](https://github.com/mobify/progressive-web-sdk/pull/1307)
    - Better garbage collection in deployed SSR Server [#1315](https://github.com/mobify/progressive-web-sdk/pull/1315)
    - Use faster method for calling JQuery in jqueryResponse, for UPWAs [#1316](https://github.com/mobify/progressive-web-sdk/pull/1316)
    - Fix up Origin headers in proxied requests [#1319](https://github.com/mobify/progressive-web-sdk/pull/1319)
    - Extend ssrRenderingComplete to accept headers [#1320](https://github.com/mobify/progressive-web-sdk/pull/1320)
    - Allow suppressing of response body via ssrRenderingComplete [#1321](https://github.com/mobify/progressive-web-sdk/pull/1321)
    - Support proxying from the requestHook [#1323](https://github.com/mobify/progressive-web-sdk/pull/1323)
    - Fix a bug with the Download Tracker when `worker` is imported but not used [#1322](https://github.com/mobify/progressive-web-sdk/pull/1322)
    - Address copying issues in SDK build script [#1313](https://github.com/mobify/progressive-web-sdk/pull/1313)
    - Add type "button" to popover component trigger button [#1302](https://github.com/mobify/progressive-web-sdk/pull/1302)
    - Prevent DangerousHTML from interfering with anchors' target prop [#1308](https://github.com/mobify/progressive-web-sdk/pull/1308)
    - Fix Image SEO bug: they are now visible to search engine crawlers [#1310](https://github.com/mobify/progressive-web-sdk/pull/1310)
    - Fix 'bazaarvoice-wrapper` component. Check to see if the bv script is loaded its render function [#1282](https://github.com/mobify/progressive-web-sdk/pull/1282)
    - Search suggestions header in search component is not an h1 element [#1285](https://github.com/mobify/progressive-web-sdk/pull/1285)
    - Add unsupported browsers detection [#1306](https://github.com/mobify/progressive-web-sdk/pull/1306)
    - Make DownloadTracker compatible with `workbox` [#1305](https://github.com/mobify/progressive-web-sdk/pull/1305)
    - Handle a delayed response from requestHook [#1303](https://github.com/mobify/progressive-web-sdk/pull/1303)
    - Allow UPWA code to set the HTTP response status code [#1304](https://github.com/mobify/progressive-web-sdk/pull/1304)
    - Cache scripts for SSR Server [#1295](https://github.com/mobify/progressive-web-sdk/pull/1295)
    - Support SSR-only HTML viewing [#1300](https://github.com/mobify/progressive-web-sdk/pull/1300)
    - Return binary responses from SSR proxying [#1291](https://github.com/mobify/progressive-web-sdk/pull/1291)
    - Extended handling of binary responses from SSR proxying [#1293](https://github.com/mobify/progressive-web-sdk/pull/1293)
    - Fix `getBrowserSize` to detect remote tablet devices correctly [1283](https://github.com/mobify/progressive-web-sdk/pull/1283)
    - For a UPWA, if JQuery is loaded, also load CaptureJS [#1287](https://github.com/mobify/progressive-web-sdk/pull/1287)
    - Add the `renderOrHydrate` utility function [#1289](https://github.com/mobify/progressive-web-sdk/pull/1289)
    - Send additional metrics from SSR [#1272](https://github.com/mobify/progressive-web-sdk/pull/1272)
    - Improve `ssrRenderingComplete`'s execution timing [1281](https://github.com/mobify/progressive-web-sdk/pull/1281)
    - Add `iconSize` prop to `Stepper` component to allow change icon size [#1280](https://github.com/mobify/progressive-web-sdk/pull/1280)
    - Fix URLs after CSS optimization [#1268](https://github.com/mobify/progressive-web-sdk/pull/1268)
    - Extended SSR middleware [#1273](https://github.com/mobify/progressive-web-sdk/pull/1273)
    - Support standard body data types in POST requests [#1275](https://github.com/mobify/progressive-web-sdk/pull/1275)
    - Moved `Card` and `LazyLoadContent` components from scaffold to SDK and added `button` element support to `IconLabel` component [#1200](https://github.com/mobify/progressive-web-sdk/pull/1200)
    - Fix bug that made the Search component behave unexpectedly in some situations [#1277](https://github.com/mobify/progressive-web-sdk/pull/1277)
    - Improve `ssrRenderingComplete`'s execution timing [1281](https://github.com/mobify/progressive-web-sdk/pull/1281)
    - Add `iconSize` prop to `Stepper` component to allow change icon size [#1280](https://github.com/mobify/progressive-web-sdk/pull/1280)
    - Remove `shouldComponentUpdate` method from the Component Generator as it does not make sense to be generated by default as it was return false thus disabling re-render of page like described in this StackOverflow post: https://stackoverflow.com/questions/32180660/empty-shouldcomponentupdate-works-otherwise-not [#1282](https://github.com/mobify/progressive-web-sdk/pull/1282)
    - Fix availability of window.Progressive.$ server-side [#1324](https://github.com/mobify/progressive-web-sdk/pull/1324)
    - Fix availability of window.Progressive.$ client-side [#1325](https://github.com/mobify/progressive-web-sdk/pull/1325)
    - Correctly handle custom SSL options for proxying [#1332](https://github.com/mobify/progressive-web-sdk/pull/1332)

## v1.6.0 (November 15, 2018)
- **OTHER CHANGES**
    - Improve SSR asset filtering [#1262](https://github.com/mobify/progressive-web-sdk/pull/1262)
    - Fully support XMLHttpRequest under SSR [#1263](https://github.com/mobify/progressive-web-sdk/pull/1263)
    - Add setViewportSize error handling [#1264](https://github.com/mobify/progressive-web-sdk/pull/1264)
    - Provide CaptureJS and JQuery in SSR [#1266](https://github.com/mobify/progressive-web-sdk/pull/1266)
    - Add UPWA/SSR docs [#1258](https://github.com/mobify/progressive-web-sdk/pull/1258)
    - Add a custom resource loader for JSDOM [#1259](https://github.com/mobify/progressive-web-sdk/pull/1259)
    - Use custom fetchAgents in proxied requests [#1261](https://github.com/mobify/progressive-web-sdk/pull/1261)
    - Add a new environment variable: `LISTEN_ADDRESS` which can take a hostname (i.e. `0.0.0.0`) or host (i.e. `0.0.0.0:3443`) [#1260](https://github.com/mobify/progressive-web-sdk/pull/1260)
    - Add SSRServer requestHook [#1257](https://github.com/mobify/progressive-web-sdk/pull/1257)
    - Add support for rewriting proxied responses [#1254](https://github.com/mobify/progressive-web-sdk/pull/1254)
    - Add a custom resource loader for JSDOM [#1259](https://github.com/mobify/progressive-web-sdk/pull/1259)
    - Ensure window.Progressive.isServerSide flags always match the Redux store [#1250](https://github.com/mobify/progressive-web-sdk/pull/1250)
    - Add getDeployTarget to universal-utils [#1252](https://github.com/mobify/progressive-web-sdk/pull/1252)
    - Add `setBrowserSizeNames`, `getBrowserSizeNames` and `setBreakpoints` utilities [#1253](https://github.com/mobify/progressive-web-sdk/pull/1253)
    - Ensure `waitForCondition` rejects with an error if jQuery or capturing is not loaded [#1255](https://github.com/mobify/progressive-web-sdk/pull/1255)
    - Add SSR loader utils [#1240](https://github.com/mobify/progressive-web-sdk/pull/1240)
    - Expose getProxyConfigs in universal-utils [#1240](https://github.com/mobify/progressive-web-sdk/pull/1240)
    - Support custom https.Agent instance for SSR fetches [#1247](https://github.com/mobify/progressive-web-sdk/pull/1247)
    - Remove stylesheet from server side rendered app [#1236](https://github.com/mobify/progressive-web-sdk/pull/1236)
    - Update Image component so it gets set to loaded if the image has already loaded before mounting [#1236](https://github.com/mobify/progressive-web-sdk/pull/1236)
    - Make CSS optimization configurable for SSR [#1244](https://github.com/mobify/progressive-web-sdk/pull/1244)
    - Sanitize JSON literals for `<script>` tags in SSR output [#1245](https://github.com/mobify/progressive-web-sdk/pull/1245)
    - Update SSR server to catch rendering errors and respond with an error page [#1232](https://github.com/mobify/progressive-web-sdk/pull/1232)
    - Add interfaces for custom JS breakpoints [#1233](https://github.com/mobify/progressive-web-sdk/pull/1233)
    - Allow proxy config override for local SSR [#1235](https://github.com/mobify/progressive-web-sdk/pull/1235)
    - Fix baseURL used for SSR [#1238](https://github.com/mobify/progressive-web-sdk/pull/1238)
    - Fix a number of SSR defects [#1239](https://github.com/mobify/progressive-web-sdk/pull/1239)
    - In `makeRequest`, extend `response.clone()` so it emits a warning [#1241](https://github.com/mobify/progressive-web-sdk/pull/1241)
    - Add a user-friendly error message when dev server is already running [#1237](https://github.com/mobify/progressive-web-sdk/pull/1237)
    - pwaIsQuiet returns true when called from a quiet-event handler [#1270](https://github.com/mobify/progressive-web-sdk/pull/1270)
    - Make getProxyConfigs work in a non-browser environment [#1269](https://github.com/mobify/progressive-web-sdk/pull/1269)

## v1.5.0 (September 25, 2018)
- **OTHER CHANGES**
    - Update cursor functionality for non-mobile breakpoints[#1225](https://github.com/mobify/progressive-web-sdk/pull/1225)
    - Update Engagement Engine and performance timing utils to support new platform value for UPWAs [#1215](https://github.com/mobify/progressive-web-sdk/pull/1215)
    - Handle globbing patterns in SSR file lists on upload [#1212](https://github.com/mobify/progressive-web-sdk/pull/1212)
    - Move the SSR Server code into the SDK [#1214](https://github.com/mobify/progressive-web-sdk/pull/1214)
    - Push the Sheet onto its own compositing layer [#1187](https://github.com/mobify/progressive-web-sdk/pull/1187)
    - Handle globbing patterns when checking for non-listed SSR files [#1217](https://github.com/mobify/progressive-web-sdk/pull/1217)
    - Add support for node v8.10 to the CI dockerfile [#1210](https://github.com/mobify/progressive-web-sdk/pull/1210)
    - Add new MegaMenu and MegaMenuItem components [#1191](https://github.com/mobify/progressive-web-sdk/pull/1191)
    - Add `tabIndex` prop to the ListTile component [#1191](https://github.com/mobify/progressive-web-sdk/pull/1191)
    - Change `Nav` component to render a `<nav>` tag [#1191](https://github.com/mobify/progressive-web-sdk/pull/1191)
    - Re-enable SSR build/upload support [#1203](https://github.com/mobify/progressive-web-sdk/pull/1203)
    - Updates to the PerformanceManager [#1198](https://github.com/mobify/progressive-web-sdk/pull/1198)
    - Add props to image component to allow lazy loading [#1205](https://github.com/mobify/progressive-web-sdk/pull/1205)
    - A11y fix: Ensure IDs generated by Icon and Accordion components are unique [#1228](https://github.com/mobify/progressive-web-sdk/pull/1228)
    - Meta tag fix: ensure no residual meta tags remain in the head tag, so the PWA/UPWA can add them on their own terms (i.e. via `react-helmet`) [#1228](https://github.com/mobify/progressive-web-sdk/pull/1228)
    - fix isText prop in password input component [#1216](https://github.com/mobify/progressive-web-sdk/pull/1216)

## v1.4.0 (August 15, 2018)
- **OTHER CHANGES**
    - Added python2.7 and Build-Essentials to Dockerfile  [#1202](https://github.com/mobify/progressive-web-sdk/pull/1202)
    - Add addToHomescreen higher order component [#1196](https://github.com/mobify/progressive-web-sdk/pull/1196)
    - Add the PerformanceManager [#1192](https://github.com/mobify/progressive-web-sdk/pull/1192)
    - move `prefetchLink` to `utils/utils` from `utils/messaging`
    - Bump `sandy-tracking-pixel-client` version to 0.1.29 [#1185](https://github.com/mobify/progressive-web-sdk/pull/1185)
    - Bump `sandy-tracking-pixel-client` version to 0.1.28 [#1179](https://github.com/mobify/progressive-web-sdk/pull/1179)
    - Update node version requirement to ^8.9.x [#1168](https://github.com/mobify/progressive-web-sdk/pull/1168)
    - Progress Steps component now has a default `max-width` [#1177](https://github.com/mobify/progressive-web-sdk/pull/1177)
    - Update Search component to allow for more customizations for responsive builds [#1173](https://github.com/mobify/progressive-web-sdk/pull/1173)
    - Moved utility functions from scaffold to SDK [#1153](https://github.com/mobify/progressive-web-sdk/pull/1153)

## v1.3.0 (June 28, 2018)
- **DEPRECATIONS**
    - Deprecated `Grid` and `GridSpan` components
    [#1142](https://github.com/mobify/progressive-web-sdk/pull/1142)
- **OTHER CHANGES**
    - 🎉 The Mobify SDK now uses Susy3 as its Grid System 🎉
        - Upgraded from Susy2 to Susy3 and made backward compatibility upgrades,
        see [#1142](https://github.com/mobify/progressive-web-sdk/pull/1142) and [#1156](https://github.com/mobify/progressive-web-sdk/pull/1156)
        - susy-breakpoint now accepts maps and single min-width breakpoints [#1156](https://github.com/mobify/progressive-web-sdk/pull/1156)
        - Wrote documentation for new "responsive grid" system
    - Fixed an issue that Sheet component sometimes become unresponsive when scrolling. [#1149](https://github.com/mobify/progressive-web-sdk/pull/1149)
    - Document utility functions with existing unit tests   [#1148](https://github.com/mobify/progressive-web-sdk/pull/1148)
        - add `jsdoc` to docs
        - add `npm run docs:jsdoc` to `mobify-docs:preview` in npm scripts
    - Fixed an issue that Sheet component sometimes become unresponsive when scrolling. [#1154](https://github.com/mobify/progressive-web-sdk/pull/1154)
    - Moved utility functions from scaffold to SDK. [#1136](https://github.com/mobify/progressive-web-sdk/pull/1136)
        - Update `validator` package to `10.2.0` to include improved credit card validator
        - Added `getTextFrom`, `textLink`, `parseTextLink`, `parseButton`, `parseImage`, `parseOption`, `parseSelect`, and `parsePageMeta` to `parser-utils.js` file
        - Added `validateFullName`, `validateCCExpiry`, `validateCCNumber`, and `validatePostalCode` to `validation.js` file
        - Added `normalizePhone` to `normalize-utils.js` file
    - Remove image placeholder in IE11 [#1138](https://github.com/mobify/progressive-web-sdk/pull/1138)
    - Add onImageError handler to Image component [#1124](https://github.com/mobify/progressive-web-sdk/pull/1124)
    - Store the React route blacklist globally, so it can be used within loader.js [#1139](https://github.com/mobify/progressive-web-sdk/pull/1139#pullrequestreview-124643984)

## v1.2.0 (May 17, 2018)
- **OTHER CHANGES**
    - Popover component click tweaks [#1133](https://github.com/mobify/progressive-web-sdk/pull/1133)
    - Add $max-width variable and use it for Banner component max-width rule. [#1126](https://github.com/mobify/progressive-web-sdk/pull/1126)
    - Add experimental section and responsive variables to `_variables.scss` [#1118](https://github.com/mobify/progressive-web-sdk/pull/1118)
    - Add `Popover` component to SDK
    [#1112](https://github.com/mobify/progressive-web-sdk/pull/1112)
    - Add disableIncompleteSteps prop to ProgressSteps and add onClick prop to ProgressStepsItem [#1064](https://github.com/mobify/progressive-web-sdk/pull/1064)
    - Add Adobe DTM connector and documentation [#1105](https://github.com/mobify/progressive-web-sdk/pull/1105)
    - Update Service worker set up utils to allow worker to be loaded directly [#1116](https://github.com/mobify/progressive-web-sdk/pull/1116)
    - Improve the iframe bridge so its child frame catches up quickly with the PWA navigation [#1108](https://github.com/mobify/progressive-web-sdk/pull/1108)
    - Add util to create initial state object from plain JS object [#1127](https://github.com/mobify/progressive-web-sdk/pull/1127)
    - Add isServerSide flag to the app branch of the store [#1110](https://github.com/mobify/progressive-web-sdk/pull/1110)
    - Updates to support SSR server [#1096](https://github.com/mobify/progressive-web-sdk/pull/1096)
        - Update getBuildOrigin to check window.Progressive for buildOrigin
        - Updated isStandAlone util to work when window.matchMedia doesn't exist
        - Update JSDom to version 11.x
    - Add `viewportSize` key to the app branch of the redux store [#1095](https://github.com/mobify/progressive-web-sdk/pull/1095)
    - Add beta support for SSR parameters to bundle uploading [#1100](https://github.com/mobify/progressive-web-sdk/pull/1100)
    - Breadcrumb component: Only render URL microdata if href is defined [#1092](https://github.com/mobify/progressive-web-sdk/pull/1092)
    - Fix ScrollTo animation for focusable element [#1024](https://github.com/mobify/progressive-web-sdk/pull/1024)
    - Add `stepperRef` prop to the Stepper component [#1106](https://github.com/mobify/progressive-web-sdk/pull/1106)

## v1.1.0 (March 27, 2018)
- **OTHER CHANGES**
    - Added responsive props to Image and Image skeleton
    [#1081](https://github.com/mobify/progressive-web-sdk/pull/1081)
    - Removed unused caption prop from CarouselItem documentation [#1056](https://github.com/mobify/progressive-web-sdk/pull/1056)
    - Add evalInGlobalScope option to loadScripts [#1060](https://github.com/mobify/progressive-web-sdk/pull/1060)
    - Add `isServerSideOrHydrating` flag to the app branch of the redux store [#1066](https://github.com/mobify/progressive-web-sdk/pull/1066)
    - Add service worker setup utils [#1073](https://github.com/mobify/progressive-web-sdk/pull/1073)
    - Add loader performance utils [#1070](https://github.com/mobify/progressive-web-sdk/pull/1070)
    - Add Sandy App start tracking to loader performance utils [#1079](https://github.com/mobify/progressive-web-sdk/pull/1079)
    - Add hover events (onMouseEnter, onMouseLeave) for Button, Link and ListTile components [#1068](https://github.com/mobify/progressive-web-sdk/pull/1068)
    - DangerousHTML now ignores links outside itself. DangerousHTML also strips the current origin off of links. [1088](https://github.com/mobify/progressive-web-sdk/pull/1088)
    - Update circle.yml file to config.yml. Include docker building and pushing for the image used in the scaffold.[1087](https://github.com/mobify/progressive-web-sdk/pull/1087)
    - Transform the items in the Accordion's initialOpenItems prop into strings to improves backwards compatibility [#1094](https://github.com/mobify/progressive-web-sdk/pull/1094)

## v1.0.0 (February 15, 2018)
- **BREAKING CHANGES**
    - Upgrade multiple packages to support React 16 [#1012](https://github.com/mobify/progressive-web-sdk/pull/1012)
        - Add `raf` package
        - Add `test:inspect`
        - Change `enzyme-adapter-react-15` -> `"enzyme-adapter-react-16": "1.1.1"`
        - Update `"node": ">=6.9.1"` -> `8.x || 9.x`
        - Update `"react-test-renderer": "^15.6.2"` -> `16.2.0`
        - Update `"react": "~15.6.0"` -> `16.2.0`
        - Update `"react-dom": "~15.6.0"` -> `16.2.0`
        - Update `"react-redux": "5.0.3"` -> `5.0.6`
        - Update `"redux-form": "6.1.1"` -> `"7.2.1`
        - Update `peerDependencies`: `"react": ">16"`, `"react-dom": ">16"`, `"react-redux": "5"`, `"redux-form": "7"`
        - Fixed broken tests caused by changes to dependencies
    - Upgrade `enzyme` dependency to `3.3.0` [#1009](https://github.com/mobify/progressive-web-sdk/pull/1009)
    - Remove redundant tests from generated component test files [#1009](https://github.com/mobify/progressive-web-sdk/pull/1009)
- **OTHER CHANGES**
    - Change fetchAction to initAction in page template [#1042](https://github.com/mobify/progressive-web-sdk/pull/1042)
    - Fix mouse dragging issue in the Carousel component [#1017](https://github.com/mobify/progressive-web-sdk/pull/1017)
    - Don’t add extra / within loader-routes [#1025](https://github.com/mobify/progressive-web-sdk/pull/1025)
    - Update Styleguidist to the latest version [#1029](https://github.com/mobify/progressive-web-sdk/pull/1029)
    - Update Tile component’s price PropType [#1034](https://github.com/mobify/progressive-web-sdk/pull/1034)
    - Add draggable prop to Image [#1014](https://github.com/mobify/progressive-web-sdk/pull/1014)
    - Fix a bug with ScrollTrigger that tries to call `setState` on an unmounted component [#1010](https://github.com/mobify/progressive-web-sdk/pull/1010)
    - Switch from 'react-addons-transition-group' to 'react-transition-group@1' [#920](https://github.com/mobify/progressive-web-sdk/pull/920)
    - Update dependency version for: `react`, `react-dom` and `enzyme` [#920](https://github.com/mobify/progressive-web-sdk/pull/920)
    - Remove dependency 'react-addons-shallow-compare' and migrate usages to PureComponent [#695](https://github.com/mobify/progressive-web-sdk/pull/695)
    - NavItems with an href now render a ListTile instead of a Link [#1019](https://github.com/mobify/progressive-web-sdk/pull/1019)
    - To fix an Offline Mode issue, force the SelectorRouter to update by manually calling getComponent when the route changes [#1035](https://github.com/mobify/progressive-web-sdk/pull/1035)
    - Add setPageTemplateName event [#1043](https://github.com/mobify/progressive-web-sdk/pull/1043)

## v0.24.2 (February 15, 2018)
- **BREAKING CHANGES**
    - None
- **OTHER CHANGES**
    - Fixed issue with new page generator script using `fetchPage` instead of `initPage`

## v0.24.1 (January 2, 2018)
- **BREAKING CHANGES**
    - Update QueryRouter and SelectorRouter [#963](https://github.com/mobify/progressive-web-sdk/pull/963)
        - The props for the QueryRouter and SelectorRouter have changed
    - Remove `getCurrentOrderId` selector, use `getCurrentOrderNumber` instead. [#965](https://github.com/mobify/progressive-web-sdk/pull/965)
    - Update currencies to work with `react-intl` [#943](https://github.com/mobify/progressive-web-sdk/pull/943)
        - Add `getSelectedCurrency` to get currency code
        - Add `getAvailableCurrencies` for available currencies
        - Remove `getCurrencyLabel`, no longer need it
        - Remove currency symbol in tests
- **OTHER CHANGES**
    - Add a new `off` function to the iFrame bridge so that either side of the bridge can unregister an event handler [#974](https://github.com/mobify/progressive-web-sdk/pull/974)
    - Fix issue where the iFrame bridge was adding extra entries to the page history [#991](https://github.com/mobify/progressive-web-sdk/pull/991)
    - Fix asset utils bug [#954](https://github.com/mobify/progressive-web-sdk/pull/954)
    - Fix IOS button analytics bug [#956](https://github.com/mobify/progressive-web-sdk/pull/956)
    - Add a new `off` function to the iFrame bridge so that either side of the bridge can unregister an event handler [#974](https://github.com/mobify/progressive-web-sdk/pull/974)
    - Fix a bug in the iFrame bridge where the queue is not properly drained when there are multiple navigation events [#987](https://github.com/mobify/progressive-web-sdk/pull/987)
    - Fix a bug with clicking a button without click handler cause a hard refresh [#980]
    - Fix a bug in the iFrame bridge where the child frame sometimes doesn't trigger its `CHILD_READY` event on secondary navigations [#970](https://github.com/mobify/progressive-web-sdk/pull/970)
    - Ensure Nav item depth determined by position in hierarchy, not slashes in URL [#961](https://github.com/mobify/progressive-web-sdk/pull/961)
    - Add support for multivariate testing [#972](https://github.com/mobify/progressive-web-sdk/pull/972)
        - Monetate analytics connector
        - Cookie Manager
        - Split component
        - Expose API Base component
    - Add BazaarvoiceWrapper and BazaarvoiceReview components. [#903](https://github.com/mobify/progressive-web-sdk/pull/903)

## v0.23.0 (November 14, 2017)
- **BREAKING CHANGES**
    - Performance metrics tracking [#942](https://github.com/mobify/progressive-web-sdk/pull/942)
        - Fix negative page content loaded values
        - Fix no tracking if page resource is lazy loaded
        - Fix confusing GA debugging log
- **OTHER CHANGES**
    - Remove hard coded text in `CardVerification`, `Carousel`, `DefaultAsk`, `LazyLoader`, and `ProgressSteps` to prepare for localization support. [#930](https://github.com/mobify/progressive-web-sdk/pull/930)
    - Allow for Nodes instead of just strings for text props that may require translation in localized builds [#938](https://github.com/mobify/progressive-web-sdk/pull/938)
    - Fix `mergeCommands` function in the integration-manager to use lodash merge function with the correct property order
    - Add jest test for the `mergeCommands` function

## v0.23.0-preview.0 (November 2, 2017)
- **BREAKING CHANGES**
    - Upgraded dependency `runtypes` to version 0.12.0.

      **Note**: you will need to upgrade your project's package.json to
      `runtypes@0.12.0`.
- **OTHER CHANGES**
    - Fix missed usage of deprecated `.Optional` runtype

## v0.22.9-preview.0 (November 2, 2017)
- **OTHER CHANGES**
    - Fix critical Lockup bug by removed debug code that accidentally got merged in [#935](https://github.com/mobify/progressive-web-sdk/pull/935)

## v0.22.8-preview.0 (October 27, 2017)
- **OTHER CHANGES**
    - Fix GA pageview tracking [#926](https://github.com/mobify/progressive-web-sdk/pull/926)
    - Added `customCard` props to `CardInput` component to allow customer to add their custom card name, image, regex and format. [#906](https://github.com/mobify/progressive-web-sdk/pull/906)
    - Update `HeaderBar`, `ProgressSteps` and `Tabs` components to support long text [#923](https://github.com/mobify/progressive-web-sdk/pull/923)
    - Tapping an image wrapped in a link (inside `DangerousHTML`) would no longer cause the app to reload [#929](https://github.com/mobify/progressive-web-sdk/pull/929)
    - Add tracking for Analytics Connector errors [#759]

## v0.22.7-preview.0 (October 18, 2017)
- **OTHER CHANGES**
    - Fix Integration Manager `initApp` for AMP usage [#870](https://github.com/mobify/progressive-web-sdk/pull/870)
    - Fix modal issue when forms are focused and it doesn't jump the page around [#905](https://github.com/mobify/progressive-web-sdk/pull/905)

## v0.22.6-preview.0 (October 11, 2017)
- **BREAKING CHANGES**
    - Restructure the modal branch, add new modal actions (`persistModal` and `preRenderModal`), and add new modal selectors (`getOpenModals`, `getClosedModals` and `getPreRenderingModals`) [#886](https://github.com/mobify/progressive-web-sdk/pull/886)

        **Note**: you will need to update any previous getModals selector calls to instead use getOpenModals.
- **OTHER CHANGES**
    - Prevent errors isStorageAvailable when cookies are disabled [#901](https://github.com/mobify/progressive-web-sdk/pull/901)
    - Allow NavMenu to prerender non-expanded nav items [#849](https://github.com/mobify/progressive-web-sdk/pull/849)
    - Add an option to Stepper component to work with redux form [#887](https://github.com/mobify/progressive-web-sdk/pull/887)

## v0.22.5 – (October 10, 2017)
- **OTHER CHANGES**
    - Update the transform-runtime babel plugin to include polyfilling [#888](https://github.com/mobify/progressive-web-sdk/pull/888)

## v0.22.2-preview.0 (October 5, 2017)
- **OTHER CHANGES**
    - Analytics Update [#894](https://github.com/mobify/progressive-web-sdk/pull/894)
        - Add new EE dimension: referrer
        - Load GA debug script when in url debug mode
        - Set EE development analytics collection to different channel
    - Fix ScrollTo behaviour in Chrome 61+ [#890](https://github.com/mobify/progressive-web-sdk/pull/890)
    - Add `clearShippingAddress` to integration manager checkout results [#898](https://github.com/mobify/progressive-web-sdk/pull/898)
    - Update SelectorRouter to match version used in current projects [#892](https://github.com/mobify/progressive-web-sdk/pull/892)
    - `CardInput` and `ExpiryDate` are using `InputMask` component to work with input tel [#897](https://github.com/mobify/progressive-web-sdk/pull/897)

## v0.22.1 - The Salty Dog (September 28, 2017)
- **OTHER CHANGES**
    - disable click on nav children when nav is animating [#873](https://github.com/mobify/progressive-web-sdk/pull/873)
    - Added `registerCardDataMap` card utility method [#874](https://github.com/mobify/progressive-web-sdk/pull/874)
    - Add a new `getKnownModals` selector to use in place of `getModals` [#876](https://github.com/mobify/progressive-web-sdk/pull/876)
    - Add `subscribeOnClick` helper method for Push messaging components [#877](https://github.com/mobify/progressive-web-sdk/pull/877)
    - Add `getStatus` and `isSupported` Push messaging selectors [#884](https://github.com/mobify/progressive-web-sdk/pull/884)

## v0.22.3 (October 10, 2017)
- **OTHER CHANGES**
    - Update the transform-runtime babel plugin to include polyfilling [#888](https://github.com/mobify/progressive-web-sdk/pull/888)

## v0.22.0-preview.0 (September 20, 2017)
- **BREAKING CHANGES**
    - Updated multiple coupon code support [#862](https://github.com/mobify/progressive-web-sdk/pull/862)
            - Added cart selector `getDiscount`
            - Renamed cart selector `getDiscounts` to `getCoupons`
- **OTHER CHANGES**
    - Add itemProp to Image component & Include currency data in the app branch of the redux store [#857](https://github.com/mobify/progressive-web-sdk/pull/857)
    - Add a doc on implementing simple i18n support [#766](https://github.com/mobify/progressive-web-sdk/pull/766)
    - Add ScrollTrigger component [#598](https://github.com/mobify/progressive-web-sdk/pull/598)
    - Added documentation on Messaging and non-PWA mode [#858](https://github.com/mobify/progressive-web-sdk/pull/858)
    - withPushMessaging HOC no longer handles `shouldComponentUpdate` for extended components; added documentation on creating Messaging components [#851](https://github.com/mobify/progressive-web-sdk/pull/851)
    - Added SEO microdata to the Breadcrumb component [#860](https://github.com/mobify/progressive-web-sdk/pull/860)
    - Added SEO "meta" types and "pageMeta" selectors [#861](https://github.com/mobify/progressive-web-sdk/pull/861/), [#866](https://github.com/mobify/progressive-web-sdk/pull/866) and [#869](https://github.com/mobify/progressive-web-sdk/pull/869)
    - Added InlineAsk push messaging component [#865](https://github.com/mobify/progressive-web-sdk/pull/865)

## v0.21.1-preview.0 (September 11, 2017)
- **OTHER CHANGES**
    - Add isMessagingSupported function [#855](https://github.com/mobify/progressive-web-sdk/pull/855)

## v0.21.0-preview.0 (September 8, 2017)
- **BREAKING CHANGES**
    - Added multiple coupon code support [#850](https://github.com/mobify/progressive-web-sdk/pull/850)
        - Added `getDiscounts` cart selector
        - Removed `getDiscount`, `getDiscountAmount`, `getDiscountLabel` and `getDiscountCode` cart selector
- **OTHER CHANGES**
    - Add Launched from homescreen analytics [#852](https://github.com/mobify/progressive-web-sdk/pull/852)
    - Added `extraFields` parameter to `registerUser` command [#808](https://github.com/mobify/progressive-web-sdk/pull/808)
    - Added persistent modal support on route change [#853](https://github.com/mobify/progressive-web-sdk/pull/853)
        - Added modal action `openPersistentModal`
    - Add isMessagingSupported function [#855](https://github.com/mobify/progressive-web-sdk/pull/855)

## v0.20.4-preview.0 (September 5, 2017)
- **OTHER CHANGES**
    - Add A2HS analytics [#832](https://github.com/mobify/progressive-web-sdk/pull/832)
    - Omit the preloader from capturing [#837](https://github.com/mobify/progressive-web-sdk/pull/837)
    - Adjust reducer for receiveProductDetailsProductData [#845](https://github.com/mobify/progressive-web-sdk/pull/845)

## v0.20.3-preview.0 (August 31, 2017)
- **OTHER CHANGES**
    - Add More menu analytics names [#828](https://github.com/mobify/progressive-web-sdk/pull/828)
    - Add copy analytics name in share component [#829](https://github.com/mobify/progressive-web-sdk/pull/829)
    - Add `prerender` prop to Accordion component [#824](https://github.com/mobify/progressive-web-sdk/pull/824)
    - Support `navigateBack` analytics UI event [#826](https://github.com/mobify/progressive-web-sdk/pull/826)
    - Added offline mode analytics [#836](https://github.com/mobify/progressive-web-sdk/pull/836)

## v0.20.2 (August 24, 2017)
- **OTHER CHANGES**
    - Update button type in share component [#825](https://github.com/mobify/progressive-web-sdk/pull/825)

## v0.20.1 (August 18, 2017)
- **OTHER CHANGES**
    - Improvements with Cart analytics [#820](https://github.com/mobify/progressive-web-sdk/pull/820) and Apple Pay [#821](https://github.com/mobify/progressive-web-sdk/pull/821/) pull in from v0.19.7 [#822](https://github.com/mobify/progressive-web-sdk/pull/822)

## v0.20.0 (August 17, 2017)
- **BREAKING CHANGES**
    - Added commands for editing items in a user's wishlist [#802](https://github.com/mobify/progressive-web-sdk/pull/802)
        - Adds `updateWishlistItemQuantity` and `updateWishlistItem` commands
        - Updated `removeWishlistItem` reducer to use `itemId` instead of `productId`
        - Added `getProductHref` selector
        - Added `receiveUpdatedWishlistItem` result
    - Consolodated saved addresses into one location in the app store [#809](https://github.com/mobify/progressive-web-sdk/pull/809)
        - Removed `storedAddresses` from the checkout branch of the store
        - Renamed `addresses` key in the user branch of the store to `savedAddresses`
- **OTHER CHANGES**
    - Add commands for order list page [#788](https://github.com/mobify/progressive-web-sdk/pull/788)
        - Add `reorderPreviousOrder` command
    - Add commands for view order page [#806](https://github.com/mobify/progressive-web-sdk/pull/806)
    - Update selectors and reducers in the user branch of the store [#796](https://github.com/mobify/progressive-web-sdk/pull/796)
        - Use mergeSkipLists for receiveAccountAddressData
        - Add getAllAddresses selector and change address default key to preferred
    - Add address name analytics name [#798](https://github.com/mobify/progressive-web-sdk/pull/798)

## v0.19.7 (August 18, 2017)
- **OTHER CHANGES**
    - Fix quantity got `removeFromCart`, `updateItemQuantity` [#820](https://github.com/mobify/progressive-web-sdk/pull/820)
    - Add Apple Pay analytics [#821](https://github.com/mobify/progressive-web-sdk/pull/821/)

## v0.19.6 (August 17, 2017)
- Fix `getBuildOrigin` using an incorrect script to determine origin [#817](https://github.com/mobify/progressive-web-sdk/pull/817)

## v0.19.5 (August 16, 2017)
- **OTHER CHANGES**
    - Allow `addToCart` event quantity to be passed [#814](https://github.com/mobify/progressive-web-sdk/pull/814)

## v0.19.4 (August 9, 2017)
- **OTHER CHANGES**
    - Fixed bug that prevented previewing a local build from a device [#803](https://github.com/mobify/progressive-web-sdk/pull/803)

## v0.19.3 (August 8, 2017)
- **OTHER CHANGES**
    - Add performance metrics instrumentation [#795](https://github.com/mobify/progressive-web-sdk/pull/795)
    - Changed `dev:build` npm script to `prod:build` [#801](https://github.com/mobify/progressive-web-sdk/pull/801)

## v0.19.2 (August 4, 2017)
- Update `receiveAccountAddressData` results [#773](https://github.com/mobify/progressive-web-sdk/pull/773)
- Fix the `SubmissionError` example in the form guide [#776](https://github.com/mobify/progressive-web-sdk/pull/776)
- Update selectors and reducers in the `user` branch of the store [#796](https://github.com/mobify/progressive-web-sdk/pull/796)
    - Use `mergeSkipLists` for the `receiveAccountAddressData` result
    - Add `getAllAddresses` selector and change address default key to preferred
- Add analytics key for address name [#798](https://github.com/mobify/progressive-web-sdk/pull/798)

## v0.19.1 (August 3, 2017)
- Add new wishlist commands to integration manager [#779](https://github.com/mobify/progressive-web-sdk/pull/779)
    - Added command to add item to the cart from the wishlist
    - Added command and result for removing an item from the wishlist
- Add Push Messaging DefaultAsk for Non-PWA environments [#749](https://github.com/mobify/progressive-web-sdk/pull/749)
- Add commands in integration manager for Account Addresses [#771](https://github.com/mobify/progressive-web-sdk/pull/771)
    - Add `addAddress`, `editAddress`, `deleteAddress` commands
- Identify the preview loader script by id [#790](https://github.com/mobify/progressive-web-sdk/pull/790)

## v0.19.0 (August 1, 2017)
- **BREAKING CHANGES**
    - Analytics [#786](https://github.com/mobify/progressive-web-sdk/pull/786)
        - Add onPageReady pageview analytics action
        - Remove pageview instrumentation from onRouteChange
- **OTHER CHANGES**
    - Add support for the Mobify V8 Tag [#777](https://github.com/mobify/progressive-web-sdk/pull/777)
        - Add documentation around the tag
    - Fix messaging in Safari Private Browsing environments (can't use `localStorage`) [#785](https://github.com/mobify/progressive-web-sdk/pull/785)
    - Analytics [#786](https://github.com/mobify/progressive-web-sdk/pull/786)
        - Add product impression and product detail instrumentation for GA
        - Add set currency analytics instrumentation for EE, GA
        - Add more analytics names
        - Make data-object accept all field keys by default and make sure EE and Mobify GA clean payload before setting the tracker
        - Fix `createActionWithAnalytics` so it doesn't error out when analyticsPayloadCreator isn't provided

## v0.18.3 (July 26, 2017)
- Add preview logic and other supporting changes the new V8 Mobify tag [#673](https://github.com/mobify/progressive-web-sdk/pull/673)
- Add `href` prop to NavItem component [#781](https://github.com/mobify/progressive-web-sdk/pull/781)

## v0.18.2 (July 25, 2017)
- Update `receiveAccountAddressData` results [#773](https://github.com/mobify/progressive-web-sdk/pull/773)

## v0.18.1 (July 21, 2017)
- **OTHER CHANGES**
    - Add GTM connector [#753](https://github.com/mobify/progressive-web-sdk/pull/753)
    - Add currentPassword key for analytics [#762](https://github.com/mobify/progressive-web-sdk/pull/762)
    - Add `onTitleClick` prop to NavHeader component [#745](https://github.com/mobify/progressive-web-sdk/pull/745)
    - Carousel bug: prevent scrolling while dragging [#746](https://github.com/mobify/progressive-web-sdk/pull/746)
    - Add analyticsName for edit and remove addresses[#767](https://github.com/mobify/progressive-web-sdk/pull/767)
    - Add commands and results to integration manager for view wishlist page [#764](https://github.com/mobify/progressive-web-sdk/pull/764)
        - Add `initWishlistPage` command
        - Add `receiveWishlistData`, `receiveWishlistUIData`, `setAccountURL` and `receiveWishlistProductData` results
    - Update results in integration manager for Account Info & Addresses [#770](https://github.com/mobify/progressive-web-sdk/pull/770)
        - Add `receiveAccountInfoData`, `receiveAccountInfoUIData`, `receiveAccountAddressData`, `setAccountInfoURL` and `setAccountAddressURL` results
    - More Analytics updates [#765](https://github.com/mobify/progressive-web-sdk/pull/765)
      - Add analytics instrumentation for swatch
      - Add analytics instrumentation for form validation and submit errors

## v0.18.0 (July 14, 2017)
- **BREAKING CHANGES**
    - Updated Integration Manager with variation command changes [#715](https://github.com/mobify/progressive-web-sdk/pull/715)
        - `getCartItems` selector is now called `getCartItemsFull`
        - The `getCartItemsFull` selector removes the `product` key from cart items. The data previously nested under `product` is now at the top level of each cart item.

- **OTHER CHANGES**
    - Update Integration Manager with Wishlist command changes [754](https://github.com/mobify/progressive-web-sdk/pull/754)
        - Deprecate `addToWishlist` command
        - Add `addItemToWishlist` command to products branch
        - Add results to set sign in and wishlist URLs
    - Updated Integration Manager with sorting and filtering actions [#721](https://github.com/mobify/progressive-web-sdk/pull/721)
        - Added `receiveCategorySortOptions` and `receiveCategoryFilterOptions` actions
        - Added `getCurrentPathKeyWithoutQuery` selector
        - Added utility functions for pagination
        - Instrument analytics for Pagination component
    - Update `<PasswordInput />` component to show password by default [#755](https://github.com/mobify/progressive-web-sdk/pull/755)
    - Add account info and address commands and results [#756](https://github.com/mobify/progressive-web-sdk/pull/756)
        - Add `updateAccountInfo`, `updateAccountPassword` and `initAccountAddressPage` commands
        - Add `recieveAccountAddressUIData` action

## v0.17.2 (July 11, 2017)
- Fix typo in registerConnectorExtension Integration Manager function [750](https://github.com/mobify/progressive-web-sdk/pull/750)

## v0.17.1 (July 11, 2017)
- Deprecated registerConnectorExtension function in favor of passing the extension object into registerConnector [748](https://github.com/mobify/progressive-web-sdk/pull/748/)
- Add account dashboard IM commands and results [#725](https://github.com/mobify/progressive-web-sdk/pull/725)
- Update page generator to apply classNames according to best practice [#732](https://github.com/mobify/progressive-web-sdk/pull/732)
- Add options to NavMenu props [#743](https://github.com/mobify/progressive-web-sdk/pull/743)
- Update page generator to fix broken import, simplify generated files, and take care of template wrapping [#734](https://github.com/mobify/progressive-web-sdk/pull/734)

## v0.17.0 (July 7, 2017)
- **BREAKING CHANGES**
    - Push Messaging: Support for multiple visit countdowns; DefaultAsk now stateless [#724](https://github.com/mobify/progressive-web-sdk/pull/724)
        - `getMessagingChannels` selector now called `getChannels`
        - Users of `withPushMessaging` HOC should use `shouldAsk` boolean to toggle their component visibility
        - DefaultAsk visit countdown should be set on component itself via `deferOnDismissal` prop

- **OTHER CHANGES**
    - Add new `isSessionStorageAvailable()` and `isLocalStorageAvailable()` utility methods [#733](https://github.com/mobify/progressive-web-sdk/pull/733)
    - Update page generator to apply classNames according to best practice [#732](https://github.com/mobify/progressive-web-sdk/pull/732)
    - Add new document: Using the Connector for Salesforce Commerce Cloud [#722](https://github.com/mobify/progressive-web-sdk/pull/722)
    - Update Button component theme to match how its modifiers work in the PWA [#735](https://github.com/mobify/progressive-web-sdk/pull/735)
    - Expand the Form guide to include an explanation on using `initialValues` [#736](https://github.com/mobify/progressive-web-sdk/pull/736)
    - Added missing accessibility features to the Icon and Search components [#737](https://github.com/mobify/progressive-web-sdk/pull/737)

## v0.16.0 (June 29, 2017)
- **BREAKING CHANGES**
    - Delete all instances of the `c-` namespace [#678](https://github.com/mobify/progressive-web-sdk/pull/678)
        - This change was introduced to help differentiate between local project components (in `web/app/components`) and SDK components (in `progressive-web-sdk/src/components`). After this change, `c-` prefixes should reference local components, `pw-` prefixes reference SDK components.
        - **How To Address**: We recommend manually searching and replacing all instances of `c-` with `pw-`. Do not blindly search-and-replace because you want to be careful to preserve your local component class names. Most SDK component classes in your project will be found in `c-` in `web/app/styles/themes/pw-components/`, but depending on how you've been authoring your style rules, you might find them across other SCSS files like those in your containers styles (`web/app/containers/**/*.scss`) or component styles (`web/app/components/**/*.scss`). You will also find instances of SDK classes being referenced in JSX files, such as when applying modifiers to buttons, such as `<Button className="c--primary" />`, and possibly test files that rely on the presence of SDK components.
        - **Example**: Replace all instances of component classes (ie. `c-button` → `pw-button`), sub-component classes (i.e. `c-button__inner` → `pw-button__inner`) and modifier classes (i.e. `c-button.c--primary` → `pw-button.pw--button`). Replace references to SDK component classnames in JSX files (i.e. `<Button className="c--primary" />` → `<Button className="pw--primary" />`).

- **OTHER CHANGES**
    - Add guide: Testing your Progressive Web App [#759](https://github.com/mobify/progressive-web-sdk/pull/759)
    - Add data-analytics-content attribute and instrument missing analytics interactions [#723](https://github.com/mobify/progressive-web-sdk/pull/723)
    - Fix broken drag support for Carousel Component [#713](https://github.com/mobify/progressive-web-sdk/pull/713)
    - Add a prop (analyticName) to PasswordInput component [#716](https://github.com/mobify/progressive-web-sdk/pull/716)
    - Add option to data objects to allow for keys that is not part of the defined list [#719](https://github.com/mobify/progressive-web-sdk/pull/719)
    - Add customize animation easing prop to Sheet component [#704](https://github.com/mobify/progressive-web-sdk/pull/704)
    - Implement search commands into IM [#714](https://github.com/mobify/progressive-web-sdk/pull/714)
    - Fix generator removing navigation from root reducer [#720](https://github.com/mobify/progressive-web-sdk/pull/720)
    - Add Checkout store branch and form selectors [#726](https://github.com/mobify/progressive-web-sdk/pull/726)
    - Add default values to custom selectors [728](https://github.com/mobify/progressive-web-sdk/pull/728)

## v0.15.6 (June 23, 2017)
- Fix broken search image on SDK homepage [#711](https://github.com/mobify/progressive-web-sdk/pull/711)

## v0.15.5 (June 23, 2017)
- Add routing guide [#696](https://github.com/mobify/progressive-web-sdk/pull/696)
- Add connector import code to the custom connector guide [#690](https://github.com/mobify/progressive-web-sdk/pull/690)
- Add PasswordInput component [#660](https://github.com/mobify/progressive-web-sdk/pull/660)
- Add account branch of the Integration Manager [#679](https://github.com/mobify/progressive-web-sdk/pull/679)
- Adds compatibility with Node v8 (npm v5) [#686](https://github.com/mobify/progressive-web-sdk/pull/686)
- Add categories branch of the Integration Manager [#684](https://github.com/mobify/progressive-web-sdk/pull/684)
- Add top level results to the Integration Manager [#693](https://github.com/mobify/progressive-web-sdk/pull/693)
- Add Home and Custom branches of the Integration Manager [#688](https://github.com/mobify/progressive-web-sdk/pull/688)
- Add App branch of the Integration Manager [#692](https://github.com/mobify/progressive-web-sdk/pull/692)
- Add App branch of the Redux Store [#697](https://github.com/mobify/progressive-web-sdk/pull/697)
- Add products branch of the Redux Store [#698](https://github.com/mobify/progressive-web-sdk/pull/698)
- Add Cart branch of the Integration Manager and Redux store [#701](https://github.com/mobify/progressive-web-sdk/pull/701)
- Add Checkout branch of the Integration Manager [#702](https://github.com/mobify/progressive-web-sdk/pull/702)
- Add Reducer, register functions and root commands to the Integration Manager [#703](https://github.com/mobify/progressive-web-sdk/pull/703)
- Push Messaging: add DefaultAsk dismissal/success callbacks; setLocale action; documentation [#683](https://github.com/mobify/progressive-web-sdk/pull/683)
- Update react-styleguidist for improved component docs [#707](https://github.com/mobify/progressive-web-sdk/pull/707)

## v0.15.4 (June 13, 2017)
- Push Messaging docs, and `testmessage` command [#656](https://github.com/mobify/progressive-web-sdk/pull/656)
- Make sure that the `extract-route-regexes` script is always deleted [#681](https://github.com/mobify/progressive-web-sdk/pull/681)
- Fixed a bug with bundle upload script [#682](https://github.com/mobify/progressive-web-sdk/pull/682)
- Update design documentation [#651](https://github.com/mobify/progressive-web-sdk/pull/651) to ensure all components contain updated design documentation guidance, accessibility notes and screenshots from customers that use the SDK.

## v0.15.3 (June 9, 2017)
- Audit and update components doc and examples [#654](https://github.com/mobify/progressive-web-sdk/pull/654)
- Update component README.md files to include more useful information [#653](https://github.com/mobify/progressive-web-sdk/pull/653)
- Add documentation for building a custom connector [#674](https://github.com/mobify/progressive-web-sdk/pull/674)
- Add offline state reducers/etc. to the SDK [#677](https://github.com/mobify/progressive-web-sdk/pull/677)
- Remove `preversion` npm script (releases are managed by Mobitron and tests are always run on Circle CI) [#672](https://github.com/mobify/progressive-web-sdk/pull/672)
- Documents on Analytics Manager and Analyics Connectors with the grand doc restructure [#667](https://github.com/mobify/progressive-web-sdk/pull/667)
- Push Messaging integration: Add controller and ask components for use in PWA [#646](https://github.com/mobify/progressive-web-sdk/pull/646)

## v0.15.2 (June 7, 2017)
- Rearrange console output in scripts to fix test problems [#669](https://github.com/mobify/progressive-web-sdk/pull/669)
- Add basic input validation to search component's "Submit" [#668](https://github.com/mobify/progressive-web-sdk/pull/668)

## v0.15.1 (June 5, 2017)
- Moved documentation out from scaffold github repo into SDK [#645](https://github.com/mobify/progressive-web-sdk/pull/645)
- Add a guide for forms [#620](https://github.com/mobify/progressive-web-sdk/pull/620)
- Add analytics instrumentation for modal open and close [#652](https://github.com/mobify/progressive-web-sdk/pull/652)
- Add share component [#649](https://github.com/mobify/progressive-web-sdk/pull/649)
- Add analytics instrumentation for add/remove items to cart [#650](https://github.com/mobify/progressive-web-sdk/pull/650)

## v0.15.0 (May 24, 2017)
- **BREAKING CHANGES**
  - Analytic Manager - Connector version [#626](https://github.com/mobify/progressive-web-sdk/pull/626)
  - Remove toggleScrollLock from sheet component[#638](https://github.com/mobify/progressive-web-sdk/pull/638)
  - Rename CSS keyframe animations, and rearrange component base/theme styles [#642](https://github.com/mobify/progressive-web-sdk/pull/642)
- **NON-BREAKING CHANGES**
  - Update docs to include notes on Messaging Service Worker [#632](https://github.com/mobify/progressive-web-sdk/pull/632)
  - Add "Leveraging Existing Page Content" Guide (a.k.a. Parsing Guide) [#613](https://github.com/mobify/progressive-web-sdk/pull/613)
  - Add a check for firefox iOS to not load PWA [#637](https://github.com/mobify/progressive-web-sdk/pull/637)
  - Add `sdk-messaging` command to do Messaging config upload and certificate request [#647](https://github.com/mobify/progressive-web-sdk/pull/647)
  - Add the guide "Branding Your Progressive App" [#641](https://github.com/mobify/progressive-web-sdk/pull/641)

## v0.14.10 (May 17, 2017)
- Port the notification reducer from the scaffold [#629](https://github.com/mobify/progressive-web-sdk/pull/629)
- Update cardInput component to allow developers to pass in credit card types [#625](https://github.com/mobify/progressive-web-sdk/pull/625)
- Update search component to fix js error for onClear function [#634](https://github.com/mobify/progressive-web-sdk/pull/634)

## v0.14.9 (May 15, 2017)
- Update Tile component to accept onClick whether it's a link or div. Update search component to close search on submit and search suggestion click [#621](https://github.com/mobify/progressive-web-sdk/pull/621)
- Check for Firefox browser user agent [#630](https://github.com/mobify/progressive-web-sdk/pull/630)

## v0.14.8 (May 9, 2017)
- Check for samsung browser user Agent [#619](https://github.com/mobify/progressive-web-sdk/pull/619)
- Added copyright headers to all source files [#622](https://github.com/mobify/progressive-web-sdk/pull/622)
- Remove the deprecated Spline library [#603](https://github.com/mobify/progressive-web-sdk/pull/603)
- Update the frame bridge docs for transpiling `content-api.js` [#623](https://github.com/mobify/progressive-web-sdk/pull/623)

## v0.14.7 (May 5, 2017)
- Service worker `worker` function returns object with key references in, to support other service worker modules [#616](https://github.com/mobify/progressive-web-sdk/pull/616)
- Update listTile and search(suggestion) component to accept onClick whether it's a link or div [#617](https://github.com/mobify/progressive-web-sdk/pull/617)

## v0.14.6 (May 1, 2017)
- Added CHANGELOG to docs [#596](https://github.com/mobify/progressive-web-sdk/pull/596)
- Adds documentation to "Install the Mobify Service Worker" [#601](https://github.com/mobify/progressive-web-sdk/pull/601)
- Deprecate the use of any `componentClass` classes as a best practice [#582](https://github.com/mobify/progressive-web-sdk/pull/582)
- Add onClick and openInNewTab props to CarouselItem [#602](https://github.com/mobify/progressive-web-sdk/pull/602)
- Add search field clear functionality to Search component [#605](https://github.com/mobify/progressive-web-sdk/pull/605)
- Update part two of tutorial to be more focused on learning by removing instant page transitions [#605](https://github.com/mobify/progressive-web-sdk/pull/605)

## v0.14.5 (April 21, 2017)
- Update field component to add a class when input is checked [#592](https://github.com/mobify/progressive-web-sdk/pull/592)

## v0.14.4 (April 20, 2017)
- Add placeholder to expiry date input, update field README to include expiry date.
- Fix sidebar bug on Web SDK docs [#588](https://github.com/mobify/progressive-web-sdk/pull/588)
- Add CVV component [#590](https://github.com/mobify/progressive-web-sdk/pull/590)
- Includes service worker injection in Charles guide [#589](https://github.com/mobify/progressive-web-sdk/pull/589)
- Use browserHistory for links that are react routes within DangerousHTML [#595](https://github.com/mobify/progressive-web-sdk/pull/595)
- Fix issues and made improvements to the iframe bridge [#597](https://github.com/mobify/progressive-web-sdk/pull/597#issuecomment-295954801)

## v0.14.3 (April 10, 2017)
- Add Search Component and update Tile component to accept onClick when it's not a link [#564](https://github.com/mobify/progressive-web-sdk/pull/564)
- Fix lint errors and bad README paths in generated components [#576](https://github.com/mobify/progressive-web-sdk/pull/576)
- Exclude messaging caches from the service worker cache cleanup [#579](https://github.com/mobify/progressive-web-sdk/pull/579)
- Fix pagination edge cases [#578](https://github.com/mobify/progressive-web-sdk/pull/578)
- Move cardInput functions into utils so we're able to use them for other cardInputs(CVV, expiry date) [#581](https://github.com/mobify/progressive-web-sdk/pull/581)
- Update sidebar style on Web SDK docs to match Docs Hub [#580](https://github.com/mobify/progressive-web-sdk/pull/580)
- Add Expiry date component [#583](https://github.com/mobify/progressive-web-sdk/pull/583)
- Don’t override callbacks passed to AccordionItem [#585](https://github.com/mobify/progressive-web-sdk/pull/585)
- Update dependencies, in particular Jest and jsdom [#586](https://github.com/mobify/progressive-web-sdk/pull/586)

## v0.14.2 (April 4, 2017)
- Update babel plugin to support react-loadable [572](https://github.com/mobify/progressive-web-sdk/pull/572)
- Add guides on the Redux store layout and React component architecture [#541](https://github.com/mobify/progressive-web-sdk/pull/541)
- Introduce Integration Manager guide [#546](https://github.com/mobify/progressive-web-sdk/pull/546)

## v0.14.1 (March 30, 2017)
- Add Redux store branch for modals [#569](https://github.com/mobify/progressive-web-sdk/pull/569)
- Remove confusing usage of `mergePayloadForActions` [#567](https://github.com/mobify/progressive-web-sdk/pull/567)
- Add some URL management utilities [#563](https://github.com/mobify/progressive-web-sdk/pull/563)
- Switch to the static version of `inline-style-prefixer` [#565](https://github.com/mobify/progressive-web-sdk/pull/565)
- Include the main body of the service worker [#549](https://github.com/mobify/progressive-web-sdk/pull/549)

## v0.14.0 (March 22, 2017)
- **BREAKING CHANGES**
    - Switch packages from dependencies to peerDependencies. [#550](https://github.com/mobify/progressive-web-sdk/pull/550)
        - Projects must now explicitly depend on `react-addons-shallow-compare` and `react-addons-transition-group`, at the same version as the `react` package.
    - Modify the template skeleton to use `reselect-immutable-helpers` [#552](https://github.com/mobify/progressive-web-sdk/pull/552)
        - Projects using version 2 of the generator must now depend on `reselect-immutable-helpers`.
    - Upgrade to `react-router@3` [#562](https://github.com/mobify/progressive-web-sdk/pull/562)
        - Projects must remove a direct dependency on `react-router` or, if that is not possible, bump their dependency to version 3.0.2
- Test the SDK code at 100% coverage [#556](https://github.com/mobify/progressive-web-sdk/pull/556)
- Remove references to `selectorToJS` from documentation [#553](https://github.com/mobify/progressive-web-sdk/pull/553)
- Test components back to 100% [#551](https://github.com/mobify/progressive-web-sdk/pull/551)
- Update dependencies, particularly `raml-1-parser` (non-breaking) [#547](https://github.com/mobify/progressive-web-sdk/pull/547)
- Add guide on developing without the Mobify Tag [#548](https://github.com/mobify/progressive-web-sdk/pull/548)
- Add Scroller component [#474](https://github.com/mobify/progressive-web-sdk/pull/474)
- Add select option to pagination component [#517](https://github.com/mobify/progressive-web-sdk/pull/517)
- Update peerDependencies to allow react-redux@5 [#559](https://github.com/mobify/progressive-web-sdk/pull/559)
- Fix a typo in the Analytics Implementation Guide [#560](https://github.com/mobify/progressive-web-sdk/pull/560)
- Always use the same key for each carousel item [#558](https://github.com/mobify/progressive-web-sdk/pull/558)
- Add utilities for creating actions [#561](https://github.com/mobify/progressive-web-sdk/pull/561)

## v0.13.4 (March 9, 2017)
- Manually enable the CommonJS transform in extract-route-regexes [#544](https://github.com/mobify/progressive-web-sdk/pull/544)
- Change default bundle message to contain git branch name and short hash of the last commit [#502](https://github.com/mobify/progressive-web-sdk/pull/502)
- Include cookies in selector router request [#540](https://github.com/mobify/progressive-web-sdk/pull/540)
- Add a glossary document describing the types of function used [#531](https://github.com/mobify/progressive-web-sdk/pull/531)
- Fixed a bug on Windows where the `add:page` script would fail [#518](https://github.com/mobify/progressive-web-sdk/pull/518)
- Update field component to have a disabled classname [#532](https://github.com/mobify/progressive-web-sdk/pull/532)

## v0.13.3 (March 7, 2017)
- Add analytics middleware and provide documentation on how to setup or migrate [#499](https://github.com/mobify/progressive-web-sdk/pull/499)
- Add support for custom event handlers to Field component [#524](https://github.com/mobify/progressive-web-sdk/pull/524)
- Add Price component [#503](https://github.com/mobify/progressive-web-sdk/pull/503)
- Update name from progressIndicator to progressBar [#506](https://github.com/mobify/progressive-web-sdk/pull/506)
- Update best practices to reflect new information [#486](https://github.com/mobify/progressive-web-sdk/pull/486)
- Add Immutable.JS guide [#526](https://github.com/mobify/progressive-web-sdk/pull/526)
- Add Reselect guide [#528](https://github.com/mobify/progressive-web-sdk/pull/528)
- Include the query string in SelectorRouter’s fetch [#530](https://github.com/mobify/progressive-web-sdk/pull/530)
- Add Tile component [#491](https://github.com/mobify/progressive-web-sdk/pull/491)
- Add Toggle component [#487](https://github.com/mobify/progressive-web-sdk/pull/487)

## v0.13.2 (February 25, 2017)
- Pass `this.itemId`, not `this.id`, to the AccordionItem's `onOpen`, `onOpened`, `onClose` and `onClosed` callbacks [#521](https://github.com/mobify/progressive-web-sdk/pull/522)

## v0.13.1 (February 25, 2017)
- Add missing ID arguments to AccordionItem's `onOpen`, `onOpened`, `onClose` and `onClosed` callbacks [#521](https://github.com/mobify/progressive-web-sdk/pull/521)

## v0.13.0 (February 25, 2017)
- **BREAKING CHANGES**
    - Routing file (app-provider.jsx) must now be named router.jsx [#512](https://github.com/mobify/progressive-web-sdk/pull/512)

## v0.12.1 (February 23, 2017)
- Fix List component compatibility with `preact` [#511](https://github.com/mobify/progressive-web-sdk/pull/511)

## v0.12.0 (February 23, 2017)
- **BREAKING CHANGES**
    - IconSprite sub-component has been removed. [#504](https://github.com/mobify/progressive-web-sdk/pull/504)
        - We recommend that the SVG be fetched via Ajax, and added to the page with DangerouHTML instead.
        - All instances of `import {Icon}` must be replaced with `import Icon`
- Fixed `initialOpenItems` so the selected items do in fact open on initial render. [#507](https://github.com/mobify/progressive-web-sdk/pull/507)
- Revert #451: TabPanel will no longer autofocus itself when it becomes active. [#509](https://github.com/mobify/progressive-web-sdk/pull/509)

## v0.11.6 (February 17, 2017)
- Don’t use ES6 export syntax in vendor file [#500](https://github.com/mobify/progressive-web-sdk/pull/500#pullrequestreview-22150755)
- Restore 100% test coverage in components. [#497](https://github.com/mobify/progressive-web-sdk/pull/497)

## v0.11.5 (February 15, 2017)
- Can disable the Stepper component with a prop [#462](https://github.com/mobify/progressive-web-sdk/pull/462)
- Add throttle for Tabs checkOverflow to improve performance [#495](https://github.com/mobify/progressive-web-sdk/pull/495)
- Refactor AccordionItem animation [#496](https://github.com/mobify/progressive-web-sdk/pull/496)

## v0.11.4 (February 10, 2017)
- New generators not interfering with SDK component generation [#494](https://github.com/mobify/progressive-web-sdk/pull/494)
- New generators matching the new scaffold version (backwards-compatibly) [#492](https://github.com/mobify/progressive-web-sdk/pull/492)
- Re-export more react-router functions/objects [#490](https://github.com/mobify/progressive-web-sdk/pull/490)
- Update Field styles to match UI Kit [#472](https://github.com/mobify/progressive-web-sdk/pull/472)

## v0.11.3 (February 9, 2017)
- New template content for homepage, plp, pdp [#484](https://github.com/mobify/progressive-web-sdk/pull/484)
- New Grid component [#488](https://github.com/mobify/progressive-web-sdk/pull/488)
- Add option in the route determination scripts allowing the use of wildcard routes at the root. [#485](https://github.com/mobify/progressive-web-sdk/pull/485)

## v0.11.2 (February 7, 2017)
- Add makeJsonEncodedRequest function [#479](https://github.com/mobify/progressive-web-sdk/pull/479)
- Add openAllItems and closeAllItems to accordion [#473](https://github.com/mobify/progressive-web-sdk/pull/473)
- Add ReviewSummary component [#467](https://github.com/mobify/progressive-web-sdk/pull/467)
- Fix the carousel resize handler [#477](https://github.com/mobify/progressive-web-sdk/pull/477)
- Add the Swatch component [#465](https://github.com/mobify/progressive-web-sdk/pull/465)
    - Made Button accept all aria properties

## v0.11.1 (February 2, 2017)
- Move icon SVG files to live with icon component [#466](https://github.com/mobify/progressive-web-sdk/pull/466)
- Update card input component with more card type detection and number formatting. [#457](https://github.com/mobify/progressive-web-sdk/pull/457)
    - Removed dependency on `creditcard` library as we have our own solution now
    - Fixed icon class name generation
- Add LazyLoader component [#459](https://github.com/mobify/progressive-web-sdk/pull/459)

## v0.11.0 (January 31, 2017)
- **BREAKING CHANGES**
  - Upate the page generator to match the latest best practices [#438](https://github.com/mobify/progressive-web-sdk/pull/438).

    **Note**: The container/page generator can still be used with projects created prior to the SDK v0.11.0. However, manual changes will be required to the `reducer.js`, `actions.js` and `container.js` files of the newly generated container.

  - Remove and replace Shoppicon with UI Kit icons [#446](https://github.com/mobify/progressive-web-sdk/pull/446)

    **Note**: The `build-sprites` script in package.json needs to be updated so it namespaces the icon sprites with `pw-` instead of `shoppicon-`. See [here](https://github.com/mobify/progressive-web-sdk/pull/446/files#diff-b9cfc7f2cdf78a7f4b91a753d10865a2R28) for an example of that change.

  - Update and tweak some component's markup and, and some component's base styles [#439](https://github.com/mobify/progressive-web-sdk/pull/439)
      - Breadcrumbs. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-2a0be1a4c649c434038f7afa62783381L1) and [here for JSX changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-983e9dd39e4d4615f178cfda889b4bf0L13)
      - Button. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-a1b206e936d05af019ce309230127276L13)
      - Field. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-85710fd47983129ec4d4202dcf780846L68) and [here for JSX changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-48f3b56ab0a4484a5184bae5fd0688fbL82)
      - Ledger. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-139ddb3fd4d481d3054f1490d69bb06bL25)
      - NavItem. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-1963b44e2c2f4abfc698e27d1eda09f6L1) and [here for JSX changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-14f6fb182c0652bbe9b1dc3518bf1008L1)
      - Rating. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-45f91d116d661c64379e5fb522ed4d7aL60)
      - Select. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-bf7845e90e00ac0f5c69049819076703L11)
      - Stepper. [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-0bad5c827f3a79719fd6eed1736da199L5) and [here for JSX changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-c1b955e7159b10bbdf9700dfee6dce22L108)
      - Tabs.
          - [See here for base style changes](https://github.com/mobify/progressive-web-sdk/pull/439/files#diff-56263658a7b14fc1bb087b9556058c00L56)
  - Update tab with overflow scroll fade overlay functionality [#451](https://github.com/mobify/progressive-web-sdk/pull/451)
  - Change ListTile includeEndActionInPrimary default [#461](https://github.com/mobify/progressive-web-sdk/pull/461)
  - Alterations to SCSS variables to better match UI Kit: some deletions, some renames, and added few new variables. [#440](https://github.com/mobify/progressive-web-sdk/pull/440)
- Downgrade version of node to >=6.9.1 to provide compatibility with buddybuild [#447](https://github.com/mobify/progressive-web-sdk/pull/447)
- Added info to get search keyboard to show up on iOS8 and up to best practices section for SearchBar design notes.
- Add sendTransactionAnalytics to utils [#445](https://github.com/mobify/progressive-web-sdk/pull/445)
- Update Component themes to match the UI Kit, cleanup doc formatting, [#439](https://github.com/mobify/progressive-web-sdk/pull/439)
    - Accordion, Badge, Breadcrumbs, Button, Divider, FieldRow, Field, HeaderBar, IconLabel, Ledger, ListTile, NavHeader, NavItem, ProgressSteps, Rating, Select, Stepper and Tabs
    - Additionally, some minor style updates to the Styleguide's base styles and added missing utility classes
- Pass props to startContent, endContent of NavHeader [#449](https://github.com/mobify/progressive-web-sdk/pull/449)
- Add Banner component [#453](https://github.com/mobify/progressive-web-sdk/pull/453)
- Update SDK docs with checkout pages [#452](https://github.com/mobify/progressive-web-sdk/pull/452)
- Add Review component [#458](https://github.com/mobify/progressive-web-sdk/pull/458)
- Add Feedback component [#454](https://github.com/mobify/progressive-web-sdk/pull/454)
- Fix a layout and render trashing bug in the Carousel component [#455](https://github.com/mobify/progressive-web-sdk/pull/455)
- Pass all args to onClick when using onKeyUpWrapper [#456](https://github.com/mobify/progressive-web-sdk/pull/456)
- Add InlineLoader component [#463](https://github.com/mobify/progressive-web-sdk/pull/463)
    - Update button readme example to show how to set in-progress state
- Automatically deploy the SDK docs when a new SDK version gets released [#366](https://github.com/mobify/progressive-web-sdk/pull/366)
- Accept navSliderProps in the NavMenu and NavHeader [#460](https://github.com/mobify/progressive-web-sdk/pull/460)

## v0.10.14 (January 12, 2017)
- Fix the defaultComponent for the QueryRouter [#441](https://github.com/mobify/progressive-web-sdk/pull/441)

## v0.10.13 (January 12, 2017)
- Clear the Image component's loading timeout when the Image is unmounted [#435](https://github.com/mobify/progressive-web-sdk/pull/435)
- Prevent Ledger's prop validation from throwing error on boolean children [#442](https://github.com/mobify/progressive-web-sdk/pull/442)

## v0.10.12 (December 30, 2016)
- Remove the `postinstall` hook [#436](https://github.com/mobify/progressive-web-sdk/pull/436)

## v0.10.11 (December 30, 2016)
- Update dependency versions [#426](https://github.com/mobify/progressive-web-sdk/pull/426)
- Test the script utilities to 100% [#429](https://github.com/mobify/progressive-web-sdk/pull/429)
- Add a program for extracting an Immutable.Record schema from a RAML API definition [#418](https://github.com/mobify/progressive-web-sdk/pull/418)
- Add fetch utilities as used in the scaffold and projects [#428](https://github.com/mobify/progressive-web-sdk/pull/428)
- Upgrade CircleCI to 2.0 [#425](https://github.com/mobify/progressive-web-sdk/pull/425)
- Set the node engine version to >=6.9.2 [#431](https://github.com/mobify/progressive-web-sdk/pull/431)

## v0.10.10 (December 14, 2016)
- Fixed bug where it wasn't possible to set both icon and button text to pagination's next button element [#415](https://github.com/mobify/progressive-web-sdk/pull/415)
- Fixed lockup scrolling to top of page on unlock as well as stretching content window when locked for Samsung Galaxy 5 [#420](https://github.com/mobify/progressive-web-sdk/pull/420)
- Add the mobify-debug-js library [#412](https://github.com/mobify/progressive-web-sdk/pull/412)
- Reset Stepper value when new maximumValue or minimumValue props invalidate it[#419](https://github.com/mobify/progressive-web-sdk/pull/419)

## v0.10.9 (December 8, 2016)
- Allow smooth gapless transitions when Image component's src prop changes [#413](https://github.com/mobify/progressive-web-sdk/pull/413)

## v0.10.8 (December 2, 2016)
- Add QueryRouter for routing based on query strings [#405](https://github.com/mobify/progressive-web-sdk/pull/405)
- Add a way to enable external resources in DangerousHTML [#407](https://github.com/mobify/progressive-web-sdk/pull/407)

## v0.10.7 (December 1, 2016)
- Use React.Children.count to get accordion item length [#398](https://github.com/mobify/progressive-web-sdk/pull/398)
- Remove AccordionItem orientationChange listener on unmount [#399](https://github.com/mobify/progressive-web-sdk/pull/399)
- Fix bug where Carousel doesn't update its internal state when its children change [#400](https://github.com/mobify/progressive-web-sdk/pull/400)
- Allow the setting of blacklisted routes on the Router [#402](https://github.com/mobify/progressive-web-sdk/pull/402)

## v0.10.6 (November 25, 2016)
- Add `openItem` and `closeItem` functions to the Accordion component [#392](https://github.com/mobify/progressive-web-sdk/pull/392)
- Fix bug with calling `openItem` multiple times [#395](https://github.com/mobify/progressive-web-sdk/pull/395)
- Update docs and generator to use an object for `mapDispatchToProps` [#381](https://github.com/mobify/progressive-web-sdk/pull/381)
- Add `Ratio` component [#391](https://github.com/mobify/progressive-web-sdk/pull/391)

## v0.10.5 (November 24, 2016)
- Add `onChange` function to the Tabs component. [#389](https://github.com/mobify/progressive-web-sdk/pull/389)
- Fire stepper on change events correctly [#346](https://github.com/mobify/progressive-web-sdk/pull/346)
- Add a class to Field if its input is required [#390](https://github.com/mobify/progressive-web-sdk/pull/390)

## v0.10.4 (November 22, 2016)
- Add tests to utility code. [#374](https://github.com/mobify/progressive-web-sdk/pull/374)
- Improve test coverage for components. [#379](https://github.com/mobify/progressive-web-sdk/pull/379)
- Refactor and test the Carousel component. [#382](https://github.com/mobify/progressive-web-sdk/pull/382)
- Add Badge component [#383](https://github.com/mobify/progressive-web-sdk/pull/383)
- Add SkipLinks components [#383](https://github.com/mobify/progressive-web-sdk/pull/383)
- Rename `z-index` variables [#383](https://github.com/mobify/progressive-web-sdk/pull/383)
- Update AccordionItem height when its content changes. [#384](https://github.com/mobify/progressive-web-sdk/pull/384)

## v0.10.3 (November 14, 2016)
- Refactor Sheet component [#357](https://github.com/mobify/progressive-web-sdk/pull/357)
- Carousel fixes [#369](https://github.com/mobify/progressive-web-sdk/pull/369):
  - Fix `flattenChildren` warnings when less than 3 items are present
  - Preent movement animation when only 1 item is present

## v0.10.2 (November 10, 2016)
- Add documentation for loadScripts utility [#361](https://github.com/mobify/progressive-web-sdk/pull/361)
- Fixed documentation guide title text [#368](https://github.com/mobify/progressive-web-sdk/pull/368)
- Update CSS class practice in the generators to match best practice [#371](https://github.com/mobify/progressive-web-sdk/pull/371)

## v0.10.1 (November 8, 2016)
- Audit of components completed, fixing minor bugs and improving documentation consistency [#347](https://github.com/mobify/progressive-web-sdk/pull/347)
- Remove sinon mocks from tests [#356](https://github.com/mobify/progressive-web-sdk/pull/356)
- Deprecate FormFields and Select components [#356](https://github.com/mobify/progressive-web-sdk/pull/356)
- Add utility functions to avoid `/* istanbul ignore next */` comments [#358](https://github.com/mobify/progressive-web-sdk/pull/358)
- Add optional artificialLoadingDelay prop to Image component [#360](https://github.com/mobify/progressive-web-sdk/pull/360)

## v0.10.0 (November 4, 2016)
- Make external changes to the Tabs `activeIndex` affect the active tab [#345](https://github.com/mobify/progressive-web-sdk/pull/345)
- Stepper component: add disabled state and fix bug with non-number inputs [#340](https://github.com/mobify/progressive-web-sdk/pull/340)
- Stepper component: switch the order of the two buttons [#350](https://github.com/mobify/progressive-web-sdk/pull/350)
- **BREAKING CHANGES**
  - Allow field errors to render instantly by passing `shouldShowErrorsInstantly` [#348](https://github.com/mobify/progressive-web-sdk/pull/348)
    This used to be the default behaviour. The new default is to show errors on blur.

## v0.9.0 (November 1, 2016)
- Add `pw-` namespaced classes to all components [#277](https://github.com/mobify/progressive-web-sdk/pull/277)
- Icon component: allow the `size` prop to receive any arbitrary string
- Added Utility class `u-link-color`
- Added new SCSS variables
- Improve container generator best practices [#341](https://github.com/mobify/progressive-web-sdk/pull/341)
- Add `children` prop to the List component [#339](https://github.com/mobify/progressive-web-sdk/pull/339)
- SDK Doc theme styles to components [#288](https://github.com/mobify/progressive-web-sdk/pull/288) and [#269](https://github.com/mobify/progressive-web-sdk/pull/269)
- SDK Doc's base styles tweaked to work with the component themes
- Add utility classes to SDK Docs stylesheets so they can be used in the examples
- Emphasize breaking changes in the Changelog
- **BREAKING CHANGES**
  - Field component class name changes

## v0.8.4 (October 31, 2016)
- Fix bug with selectedIndex prop in Select component [#327](https://github.com/mobify/progressive-web-sdk/pull/327)
- Change stepper input to tel, select value on click [#336](https://github.com/mobify/progressive-web-sdk/pull/336)

## v0.8.3 (October 27, 2016)
- Remove hacky Jest preprocessor, restoring coverage accuracy [#326](https://github.com/mobify/progressive-web-sdk/pull/326)
- Fix case-sensitive module import to resolve CircleCI errors [#329](https://github.com/mobify/progressive-web-sdk/pull/329)
- Fix CarouselItem to render a Link rather than an anchor [#331](https://github.com/mobify/progressive-web-sdk/pull/331)

## v0.8.2 (October 26, 2016)
- Correct class name on NavItem - swap `c-nav-item--selected` for `c--selected` [#320](https://github.com/mobify/progressive-web-sdk/pull/320)
- Pass 'path' prop to rendered NavItems - for cases when people want the behaviour of regular hyperlinks.
  [#319](https://github.com/mobify/progressive-web-sdk/pull/319)
- Disable HTML in parser tests to match live HTML [#318](https://github.com/mobify/progressive-web-sdk/pull/318)
- Add iconClassName to Button component [#317](https://github.com/mobify/progressive-web-sdk/pull/317)
- Update Jest to version 16.0.2 [#314](https://github.com/mobify/progressive-web-sdk/pull/314)
- Upgrade the react-styleguidist to 4.1.0 [#312](https://github.com/mobify/progressive-web-sdk/pull/312)
- Add a `yarn.lock` to enable the usage of the `yarn` package manager. Allow node `>=4.0.0` [#298](https://github.com/mobify/progressive-web-sdk/pull/298)
  - NOTE: If you want to use `yarn`, make sure you use Node 6 LTS. Older versions don't work with the SDK.
- Remove `props` argument from generated `mapDispatchToProps` function for a performance boost [#321](https://github.com/mobify/progressive-web-sdk/pull/321)

## v0.8.1 (October 24, 2016)
- Add IconLabel component [#305](https://github.com/mobify/progressive-web-sdk/pull/305)
- Fix Carousel to work with a single CarouselItem [#301](https://github.com/mobify/progressive-web-sdk/pull/301)
- Refactor Pagination component with more tests [#291](https://github.com/mobify/progressive-web-sdk/pull/291)

## v0.8.0 (October 21, 2016)
- Add onClick prop to Breadcrumb items [#300](https://github.com/mobify/progressive-web-sdk/pull/300)
- Remove the 'reducer implements all actions' test[#308](https://github.com/mobify/progressive-web-sdk/pull/308)
- **BREAKING CHANGES**
  - Configure the Nav component using plain JS objects instead of React components.
    Lessons learned after trying to use it in earnest on a project build.

## v0.7.3 (October 20, 2016)
- Bug Fixes:
  - Make sure to pass internal URLs to the react-router Link component correctly [#295](https://github.com/mobify/progressive-web-sdk/pull/295)
  - Add `c-` namespaced class back to NestedNavigation root [#296](https://github.com/mobify/progressive-web-sdk/pull/296)
  - Image now calls onImageLoaded after the state has updated [#297](https://github.com/mobify/progressive-web-sdk/pull/297)
- NavItem now accepts optional content before the title [#299](https://github.com/mobify/progressive-web-sdk/pull/299)

## v0.7.2 (October 19, 2016)
- Add `pw-` namespaced classes to all components [#277](https://github.com/mobify/progressive-web-sdk/pull/277)
- Accordion now handles falsy items [#285](https://github.com/mobify/progressive-web-sdk/pull/285)
- Update dependencies [#292](https://github.com/mobify/progressive-web-sdk/pull/292)

## v0.7.1 (October 14, 2016)
- Add `maskOpacity` option to change opacity mask value for Sheet component [#282](https://github.com/mobify/progressive-web-sdk/pull/282)

## v0.7.0 (October 13, 2016)
- Change how the AccordionItem content height is calculated [#271](https://github.com/mobify/progressive-web-sdk/pull/271)
- Added new navigation component which should allow for easy extension by sharing nav state through context [#273](https://mobify.atlassian.net/browse/WEB-740)
- Add support for optional route components in the route parser [#274](https://github.com/mobify/progressive-web-sdk/pull/274)
- **BREAKING CHANGES**
  - New approach for processing `fetch` responseText using an iframe which now allows for parsing of html, head, and body. There should not be any impacts to your project, but you should smoke-test your project for any missing content [#270](https://github.com/mobify/progressive-web-sdk/pull/270)

## v0.6.6 (October 11, 2016)
- Image component skeleton now rendered as div [#272](https://github.com/mobify/progressive-web-sdk/pull/272)

## v0.6.5 (October 6, 2016)
- Removed the ignore-styles dependency and its use in the generator [#260](https://github.com/mobify/progressive-web-sdk/pull/260)
- No longer include the test scripts in the dist folder [#261](https://github.com/mobify/progressive-web-sdk/pull/261)
- Remove redundant `.first()` calls from the tests and generator [#262](https://github.com/mobify/progressive-web-sdk/pull/262)
- Add debug mode to load-scripts utility [#265](https://github.com/mobify/progressive-web-sdk/pull/265)
- Image component improvements: [#266](https://github.com/mobify/progressive-web-sdk/pull/266)
  - Set loaded state back to false on src change
  - Added loadingIndicator prop so users can define additional loading markup
  - Added hidePlaceholder prop so users can prevent the skeleton block from rendering

## v0.6.4 (September 30, 2016)
- Added a type attribute to the AccordionItem header [#252](https://github.com/mobify/progressive-web-sdk/pull/252)

## v0.6.3 (September 29, 2016)
- Added documentation for the `FormFields` component.
- Add form generator [#206](https://github.com/mobify/progressive-web-sdk/pull/206)
- Added ProgressStep component [#225](https://github.com/mobify/progressive-web-sdk/pull/225)

## v0.6.2 (September 27, 2016)
- Update Field documentation and examples in the styleguide so that they work
  properly with redux-form.
- Add prop type validators for positive numbers, percentages, and child indices.
- Update Button component's markup to wrap the contents of the button in a div
- Generated component description moved from README.md into component JSX file

## v0.6.1 (September 23, 2016)
- Deduplicate Babel runtime functions [#234](https://github.com/mobify/progressive-web-sdk/pull/234)
- Added CardInput field which does formatting and validation of credit card
  numbers. New dependency on `credit-card` module, MIT license.
- Field now passes down ReduxFormField props to selects and textareas

## v0.6.0 (September 22, 2016)
- Fix animation issue in the Sheet component
- Allow ListTile endAction to be included in the primary container
- A11y improvements. [#168](https://github.com/mobify/progressive-web-sdk/pull/168)
  - Add onBlur prop to Select component for a11y
  - Add a11y linting
  - Fix a11y lints in existing components
- **BREAKING CHANGES**
  - `.c-accordion__header` header is now a `button` element which introduces the
    possibility of unexpected styling inheritance. We encourage that you check
    how the Accordion component renders on your project after updating to this
    new version.

## v0.5.2 (September 20, 2016)
- Add simple error reporter
- Allow custom reducers to be used in the root reducer.

## v0.5.1 (September 19, 2016)
- Clean dist directory when building the SDK
- Change Stepper input type to number

## v0.5.0 (September 16, 2016)
- Add utility method for searching for and injecting desktop scripts
- Refactor the Sheet component to make it (mostly) stateless and easier to test
- **BREAKING CHANGES**
  - The `onClose` callback on Sheet has been deleted and replaced with
    `onDismiss` which represents a user's *request* to close the sheet.
    To open/close the sheet implementors must maintain state elsewhere
    and re-render, passing the `open` param through props. The styleguide
    has examples to follow when migrating.

## v0.4.4 (September 15, 2016)
- Add an onChange prop to Stepper component
- SelectorRoute now correctly fires onEnter callback
- Fixes inline-style-prefixer dependency bug
- Use Link in ListTile and Breadcrumbs

## v0.4.3 (September 14, 2016)
- Add analytics utility functions
- Fix bug in SelectorRoute
- Fix bug with project-generated page reducer tests

## v0.4.2 (September 13, 2016)
- Ensure loader-routes file isn't linted
- Added the FormFields component
- Added id, name and multiple attributes to Select component

## v0.4.1 (September 8, 2016)
- Add autoprefixing for inline styles, and the style guide's stylesheet
- Update page generator to follow current container practices
- Pass `data` props for the `Link` component to the underlying DOM node.

## v0.4.0 (September 6, 2016)
- Add FieldSet and FieldRow components
- Modify the RatingIcon component to use the Image and Icon components.
- Adds skeleton placeholder functionality to Image component
- **BREAKING CHANGES**
  - Replace AVA with Jest, see [PR 182](https://github.com/mobify/progressive-web-sdk/pull/182)

## v0.3.0 (September 1, 2016)
- Add Ledger and LedgerRow components
- Add Pagination component
- Update dependencies.
- Add a HeaderBar component based on Crabtree and Lancome.
- Add webpack-hot-middleware as a dev dependency
- **BREAKING CHANGES (See [migration steps](https://github.com/mobify/progressive-web-scaffold/pull/75)):**
  - Fix bug with project-level tests when importing cache hash manifest file
  - Add initCacheManifest method to asset-utils for providing cache hash manifest

## v0.2.1 (August 31, 2016)
- Fix Select component SCSS variables, and should appear in Style Guide now
- Fix the Sheet to properly unrender on close.
- Add Inline, Text, and Block Skeleton components (not yet integrated into other components)
- Fix the Divider component to use better markup / styling

## v0.2.0 (August 30, 2016)
- Expand Sheet functionality with `shrinkToContent`
- Minor styling improvement to the Style Guide's `props` table
- Ensure Field only shows errors when dirty or touched
- Make the className prop work the same in all components (and test it)
- Asset utils uses generated project-level hash manifest for static file caching
- Fix the route regexes to be anchored at both ends
- Fix the component generator's example import paths
- Mocked matchMedia in the jsdom environment
- Add shouldComponentUpdate speedups to Icon, Button, ListTile, and Sheet
- Add onClick prop to Link component.
- Add Divider component

## v0.1.1 (August 26)
- Update Field to only pass input props to inputs
- Fix Image flicker and Icon re-render bugs

## v0.1.0 (August 25)
- Add a polyfill module with string and promise polyfills
- Change the Form component to integrate better with redux-form
- Fix missing import in add:page command
- Revert SCSS methodology to the old way
- Update spline-scss to 2.2.0
- Add Lockup component
- Add Stepper component

## v0.0.13 (August 24)
- Add a script for extracting routes for use in the loader
- Add Tab component

## v0.0.12 (August 23)
- Update the release process
- Add test-utils, helper functions to write tests
- Add icon parameters to the Button component

## v0.0.11 (August 19, 2016)
- Fix infinite rendering bug in Image Component

## v0.0.10 (August 18, 2016)
- Use name instead of displayName to check Accordion children
- Allow Link to open in a new tab
- Add ScrollTo component

## v0.0.9 (August 17, 2016)
- Field supports multiple children
- Link now works with no href

## v0.0.8 (August 17, 2016)
- Link component handles domain-relative urls
- Add Carousel component

## v0.0.7 (August 17, 2016)
- New components
  - Accordion
  - Link
  - Sheet
- Streamlined npm scripts
- Updated the jQuery response
- Added a selector route

## v0.0.6
- Fix bug with upload scripts
- Added NestedNavigation component
- Added List component
- Add Spline-SCSS

## v0.0.5
- Fix bug with accordion-item type checking
- Add DangerousHTML component
- Add IconSprite component
- Add Icon component
- Update AVA to 0.16.0
- Add ListTile component
- Add Field component
- Add Select component

## v0.0.4
- Include SCSS in build output
- Added accordion component
- Added unit testing framework
- Add Sass linting
- Update PR template

## v0.0.3
- Add rating component
- Add asset utils functions
- Add breadcrumb component

## v0.0.2
- Get css importing properly
- Expose src folder on npm, and add components to it

## v0.0.1
- Initial licence
- jqueryResponse function
- Comoponent generator
- Container generator
- Button component
