## v3.8.0-dev (Aug 08, 2024)
## v3.7.0 (Aug 07, 2024)

## v3.6.0 (Jun 25, 2024)

## v3.5.1 (Apr 17, 2024)
- Update SLAS private proxy path [#1752](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1752)

## v3.5.0 (Apr 15, 2024)

- Add Support for SLAS private flow [#1722](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1722)


## v3.4.0 (Jan 19, 2024)

- Add support for node 20 [#1612](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1612)

## v3.3.0 (Dec 08, 2023)

- Update engine compatibility to include npm 10 [#1597](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1597)
- Improve `pwa-kit-dev start` command to accept CLI arguments for babel-node that get passed as CLI args to `pwa-kit-dev start` [#1591](https://github.com/SalesforceCommerceCloud/pwa-kit/issues/1591)
- Bugfix for TS not loading in typescript minimal project `ssr.js` [#1591](https://github.com/SalesforceCommerceCloud/pwa-kit/issues/1591)
- Add `source-map-loader` plugin to webpack configuration. [#1535](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1535)
- Only use source maps in server when `inspect` flag is being used. [#1535](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1535)

## v3.2.0 (Nov 03, 2023)

## v3.1.1 (Sep 21, 2023)

- Bugfix: resolve performance issue due to webpack stats [#1418](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1418)

- Added a new `--wait` flag to the `push` command. When `--target` is specified, setting the `--wait` flag will cause the script to exit after the triggered deployment has completed, rather than after the bundle has been pushed.

## v3.1.0 (Jul 26, 2023)

- Allow setting cookies using the `MRT_ALLOW_COOKIES` environment variable [#1318](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1318)
- Send package versions as bundle metadata [#1354](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1354)
- Fix loading screen sometimes hanging on refresh [#1370](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1370)
- Avoid an error when using `pwa-kit-dev` outside a directory with a `package.json` file if the command does not require one [#1376](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1376) [#1380](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1380)

## v3.0.0 (Jun 15, 2023)

- Package name changed to `@salesforce/pwa-kit-dev`
- Added Template Extensibility feature in `@salesforce/pwa-kit-dev`, follow the [upgrade guide](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/upgrade-to-v3.html)
- Update engines to drop npm 7, and requires Node to start from version 16.11 [#1166](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1166)

## Older Versions Without Namespace

The older versions below were published without the `@salesforce` namespace.

## v2.7.1 (May 11, 2023)

- Fix static file serving [#1196](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1196)
- Add suffix to SSR build files [#1157](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1157)
- Mitigate local dev memory leaks [#1155](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1155)
- Minor performance improvements [#974](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/974)
- Fix getConfig referencing config from incorrect location [#1049](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1049)
- Moved the MRT reference app to the SDKs, so that we can verify eg. Node support [#966](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/966)

## v2.7.0 (Mar 03, 2023)

- Add explicit `ws` dependency [#865](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/865)

## v2.6.0 (Jan 25, 2023)

- Upgrade prettier to v2 [#926](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/926)
- Security package updates

## v2.5.0 (Jan 05, 2023)

- Logging cid from res header instead of req in local development [#821](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/821)

## v2.4.0 (Dec 01, 2022)

- Add `tail-logs` command [#789](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/789)
- Upgrade minimatch [#793](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/793)

## v2.3.0 (Oct 27, 2022)

- Minimize "Module not found" error during webpack rebuild, whenever a package dependency is being updated/built [#722](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/722)
- Update minimatch [#793](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/793)

## v2.2.0 (Aug 25, 2022)

- Added option to specify where/from the credentials can be saved/read [#647](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/647)

## v2.1.0 (Jul 05, 2022)

- Disable the error overlay on hot-reload[#656](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/656/)
- Introduce client-side hot module replacement. [#630](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/630)
- Add support for a custom build directory to `pwa-kit-dev build`. [#628](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/628)
- Replace `Mobify` references/links with proper PWA Kit values. [#619](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/619)

## v2.0.0 (May 16, 2022)

- Drop node 12 support for [#589](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/589)
- Implement dev server serveStaticFile [#580](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/580)
- Improve test coverage [#550](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/550)
- Make the createApp API idiomatic for Express, fix service-worker loading. [#536](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/536)
- Remove lodash and bluebird. [#534](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/534)
- Allow pass thru cli options for test command [#537](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/537)
- Ensure we copy the `package.json` file into the build folder. Also move logic for copying config files into the build script from the webpack config [#524](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/524)
- Loading page: avoid seeing infinite reloads [#532](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/532)
- Remove legacy remote proxy, which allowed remote environments to use proxy configs in package.json [#425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/425)
- Fix source maps cannot be found when debugging the server [#526](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/526)
- Generate different reports for different bundles [#508](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/508)
- Allow custom webpack config in projects [#462](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/462)
- Hide webpack performance warnings [#471](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/471)
- Support Multi-site implementation using dynamic config [#469](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/469)
- Loading screen [#473](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/473)
- Service worker loading for dev server [#464](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/464)
- Environment Specific Configuration Support [#477](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/447)
- Remove Webpack PwaKitConfigPlugin [#443](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/443)
