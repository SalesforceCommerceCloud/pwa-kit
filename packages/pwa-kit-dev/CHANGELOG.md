## v2.0.0-dev.7 (May 03, 2022)
## v2.0.0-dev.6 (May 02, 2022)
## v2.0.0-dev.5 (Apr 26, 2022)

-   Ensure we copy the `package.json` file into the build folder. Also move logic for copying config files into the build script from the webpack config [#524](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/524)

## v2.0.0-dev.4 (Apr 06, 2022)

-   Loading page: avoid seeing infinite reloads [#532](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/532)

## v2.0.0-dev.3 (Apr 01, 2022)
## v2.0.0-dev.2 (Feb 10, 2022)

-   Remove legacy remote proxy, which allowed remote environments to use proxy configs in package.json [#425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/425)

## v2.0.0-dev.2 (Feb 10, 2022)
## v2.0.0-dev.1 (Feb 03, 2022)
## v2.0.0-dev.1 (Feb 03, 2022)
## v2.0.0-dev (Jan 27, 2022)
## v1.3.0-dev (Nov 18, 2021)

-   `createApp` takes a new option `enableLegacyRemoteProxying` which defaults to `true`. When set to `false`, local development proxying is disabled when running remotely. In future, local development proxying will *always* be disabled when running remotely. [#205](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/205)

## v1.2.0 (Nov 18, 2021)

-   Security package updates
-   Upgrade `copy-webpack-plugin` to latest `^9.0.1` version. [#3191](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/181)

## v1.1.0 (Sep 27, 2021)

-   Update the bundle push command to remove legacy bundle upload preview URL from console output. [#81](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/81)

## v1.0.0 (Sep 08, 2021)

-   PWA Kit General Avaliability and open source. 🎉
