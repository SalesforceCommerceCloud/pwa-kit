## v2.5.0 (Jan 05, 2023)
- Replace morgan stream to use console.log [#847](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/847)
- Do not use a proxy to call Einstein [#857](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/857)
- Reuse Server Correlation ID when Hydrating Error Pages [#846](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/846)

## v2.4.0 (Dec 01, 2022)
-   Fix `useServerContext` returning isServerSide=false when on server. [#782](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/782)
-   Upgrade minimatch [#793](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/793) 

## v2.3.0 (Oct 27, 2022)
-   Support `react-query` server-side data fetching. [#724](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/724)
-   Add server-safe default configuration for `queryClientConfig` option. [#734](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/734)
-   Add `useServerContext` hook with the `res` response object and the `isServerSide` flag. [#737](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/737)
-   Handle `react-query` server-side errors. [#735](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/735)
-   Fix internal build script. [#706](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/706)
-   Add Correlation ID to SCAPI requests. [#728](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/728)

## v2.2.0 (Aug 25, 2022)

## v2.1.0 (Jul 05, 2022)
-   Remove console logs from route component. [#651](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/651)

## v2.0.0 (May 16, 2022)
-   Drop node 12 support for [#589](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/589)
-   Improve test coverage [#550](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/550)
-   Remove lodash and bluebird. [#534](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/534)
-   Support Multi-site implementation using dynamic config [#469](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/469)
-   Support functions as default exports in the applications `routes.jsx` file. [#447](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/447)
-   Serialize application configuration in the HTML during rendering process. [#447](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/447)
-   Remove `create-hash-manifest.js` [#425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/425)
-   Fix upload bug with extending an options object [#419](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/419)

## v1.5.0 (Mar 17, 2022)
-   Add boolean flag `enableLegacyBodyParser` to `createApp` options. [#446](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/446)
-   Add environment specific configuration support. [#421](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/421)
-   Remove unused url-parse dependency [#411](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/411)
-   Fix bug with extending an options object on upload.js script [#419](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/419)

## v1.4.0 (Jan 27, 2022)

-   Add `proxyKeepAliveAgent` ssr-server option. [#306](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/306)
-   Add React 17 support [#278](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/278)
-   Fix an error handling bug that could cause server to hang [#326](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/326)
-   Add support for npm 7 and npm 8 [#302](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/302)

## v1.3.0 (Jan 06, 2022)

-   Add `__server_only` and `__pretty_print` server rendering flags aliases. [#250](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/250)
-   Do not show stack trace in remote environment windowGlobals [#230](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/230/files)
-   `createApp` takes a new option `enableLegacyRemoteProxying` which defaults to `true`. When set to `false`, local development proxying is disabled when running remotely. In future, local development proxying will _always_ be disabled when running remotely. [#205](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/205)
-   Add `PwaKitConfigPlugin` webpack plugin. [#255](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/255)

## v1.2.0 (Nov 18, 2021)

-   Security package updates
-   Upgrade `copy-webpack-plugin` to latest `^9.0.1` version. [#3191](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/181)

## v1.1.0 (Sep 27, 2021)

-   Update the bundle push command to remove legacy bundle upload preview URL from console output. [#81](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/81)

## v1.0.0 (Sep 08, 2021)

-   PWA Kit General Avaliability and open source. 🎉
