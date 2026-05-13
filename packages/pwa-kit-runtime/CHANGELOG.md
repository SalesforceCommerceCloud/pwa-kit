## v3.19.0-dev (May 07, 2026)
- HttpOnly session cookies: SLAS proxy now mirrors `customer_id`, `customer_type`, `enc_user_id`, `id_token` (non-HttpOnly) and `idp_refresh_token` (HttpOnly) as siteId-suffixed cookies; replaces `cc-nx-exists` with `cc-nx-expires` (absolute epoch seconds, mirroring `cc-at-expires`); strips `idp_refresh_token` from the response body and upstream proxy requests [#3830](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3830)

## v3.18.0 (May 07, 2026)
- Add option to keep original User Agent header in proxy requests [#3798](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3798)
- WIP: Add support for HttpOnly session cookies [#3804](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3804)
- **Data Store Simplified**: Removed internal provider pattern and dynamic loading. Now imports data store directly from `@salesforce/mrt-utilities@0.1.6+`, which uses conditional exports (`dev-data-store`) to provide local in-memory implementation in development and DynamoDB in production. Removed ~250 lines of complex provider code (`data-store-provider.js`, `local-dev-provider-loader.js`). Removed optional peer dependency on `@salesforce/pwa-kit-dev`.  **Environment Variables**: Local data store uses `MRT_DATA_STORE_DEFAULTS` and `MRT_DATA_STORE_WARN_ON_MISSING` (legacy `PWAKIT_MRT_DATA_STORE_ENABLED` still supported). **Breaking for internal imports only**: Use public API at `utils/data-store/data-store-utils` instead of internal paths. [#3811](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3811)
- `utils/ssr-server/data-store` imports `@salesforce/mrt-utilities/data-store` (DataStore + error classes). Jest `moduleNameMapper` maps `data-store` to ESM production slice for tests (mocks DynamoDB). [#3787](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3787) [#3811](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3811)
- Add `isMrtDataStoreEnabled(config)` (`utils/data-store/data-store-utils`, re-exported from `utils/ssr-server`): opt-in for SSR Data Store bootstrap (resolve prefs + serialize `__MRT_DATA_STORE__`). Distinct from `DataStore.isDataStoreAvailable()`. Controlled by `app.mrtDataStore.enabled` or `PWAKIT_MRT_DATA_STORE_ENABLED`. When disabled, `__MRT_DATA_STORE__` is omitted from `#mobify-data` (not `{}`). Client `getCustomSitePreferences` / `getCustomGlobalPreferences` return `{}` and may emit `PWAKitLogger` warnings in development when the key is missing (each getter call) (skipped for `production` / `test` `NODE_ENV`). [#3787](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3787)
- Add `getCustomGlobalPreferences` / `getCustomSitePreferences` from `utils/data-store/ssr-global-preferences` / `ssr-site-preferences` (conditional: server async Data Store fetch, client reads `window.__MRT_DATA_STORE__`) and shared DAL helpers under `utils/data-store/` (`constants`, `data-store-utils` with `getPlainObjectForDataStoreKey`). Data Store keys: `custom-global-preferences` and `<siteId>-custom-site-preferences`. [#3787](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3787)
- Add `DataStore` test hooks `_testDocumentClient` and `_testLogMRTError` aligned with `@salesforce/mrt-utilities`. [#3787](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3787)
- Add additional logging and error handling for SLAS error handling [#3750](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3750)
- Harden the SLAS private-client proxy with a path-and-method allow-list and path normalization. The legacy `applySLASPrivateClientToEndpoints` option is no longer used; the allow-list can be overridden via `slasPrivateClientAllowList` [#3802](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3802)
- Fix SSR QueryClient memory retention across warm Lambda invocations [#3795](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3795)
- Refactor: Extract reusable SLAS proxy helpers [#3812](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3812)

## v3.17.1 (Mar 20, 2026)
- Add base path prefix to support multiple MRT environments under 1 domain [#3614](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3614)
- Remove base path from /__pwa-kit route requests when showBasePath is false [#3758](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3758)

## v3.17.0 (Mar 12, 2026)
- Add Node 24 support. Migrate deprecated Node.js `url.parse()` and `url.format()` to the WHATWG `URL` [#3652](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3652)

## v3.16.0 (Feb 12, 2026)
- Migrate AWS SDK from v2 to v3 [#3566](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3566)
- Updated the SLAS private client proxy to enable customizing the proxy response body [#3662](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3662)

## v3.15.0 (Dec 17, 2025)
- Fix multiple set-cookie headers [#3508](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3508)

## v3.14.0 (Nov 04, 2025)
- Replace aws-serverless-express with @h4ad/serverless-adapter [#3325](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3325)
- Added Hybrid Proxy support for local and ODS hybrid development [#3409] (https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3409)
- Add extensibility hooks for SLAS private client proxy with `onSLASPrivateProxyReq` and `onSLASPrivateProxyRes` callbacks [#3411](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3411)
- Remove exception when transfer-encoding: chunked [#3439](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3439)
- Fix chunked encoding option name [#3440](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3440)

## v3.13.0 (Sep 25, 2025)

## v3.12.0 (Sep 04, 2025)
- Add support for environment level base paths on /mobify routes [#2892](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2892)
- This feature introduces an AI-powered shopping assistant that integrates Salesforce Embedded Messaging Service with PWA Kit applications. The shopper agent provides real-time chat support, search assistance, and personalized shopping guidance directly within the e-commerce experience. [#2658](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2658)
- Disallow the SLAS private client proxy from handling trusted system on behalf of requests [#3042](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3042)
- Mask user not found messages to prevent user enumeration from passwordless login [#3113](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/3113)


## v3.11.0 (Jul 22, 2025)
- Fix the logger so that it will now print out details of the given Error object [#2486](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2486)
- Only allow requests for `/shopper/auth/` through the SLAS private client proxy. Also stop the proxy from swallowing SLAS errors [#2608](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2608)

## v3.10.0 (May 22, 2025)

## v3.9.2 (Mar 08, 2025)
- Disable CloudWatch metrics sender retries [#2304](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2304) 

## v3.9.1 (Mar 05, 2025)
- Update PWA-Kit SDKs to v3.9.1 [#2301](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2301)
- Remove forced garbage collection on each invocation. Set `FORCE_GC=true` for the old behavior. [#2285](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2285)

## v3.9.0 (Feb 18, 2025)
- Fix stale service worker file that could cause requests to still use old Content-Security-Policy [#2191](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2191)
- Support Node 22 [#2218](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2218)
- Support Social Login, Passwordless Login, and Password Reset: update the default value for `applySLASPrivateClientToEndpoints` option [#2250](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2250)

## v3.8.0 (Oct 28, 2024)
- Add proxy handling for trusted agent on behalf of (TAOB) requests [#2077](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2077)
- Encode non ASCII HTTP headers when `encodeNonAsciiHttpHeaders` flag is set to true in `ssr.js` in the retail react app [#2009](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2009)
- Add x-forwarded-host header into res locals, which can be used to build an app origin [#2050](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2050)

## v3.7.0 (Aug 07, 2024)

## v3.6.0 (Jun 25, 2024)
- Add logger to print logs generated by PWA Kit packages [#1822](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1822)
- Memoize `getConfig` on the server-side [#1800](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1800)
- Added the `x-correlation-id` response header, which is set to the MRT correlation ID. This enhances traceability by including the correlation ID from the request in the response. [#1787](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1787)
- Keep API Gateway headers in proxied requests [#1772](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1772)
- Hide x-sfdc-access-control header [#1805](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1805)

## v3.5.1 (Apr 17, 2024)
- Update SLAS private proxy path [#1752](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1752)

## v3.5.0 (Apr 15, 2024)

## v3.4.0 (Jan 19, 2024)

- Add Support for SLAS private flow [#1722](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1722)
- Add support for node 20 [#1612](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1612)

## v3.3.0 (Dec 08, 2023)

- Update engine compatibility to include npm 10 [#1597](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1597)

## v3.2.1 (Nov 08, 2023)

- Revert mandatory enforcement of Content-Security-Policy headers. Provide middleware as an opt-in replacement. [#1528](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1528)

```js
// your-project/app/ssr.js
import {defaultPwaKitSecurityHeaders} from '@salesforce/pwa-kit-runtime/utils/middleware'
const {handler} = runtime.createHandler(options, (app) => {
    app.use(defaultPwaKitSecurityHeaders)
    // ...
}
```

## v3.2.0 (Nov 03, 2023)

- Move Content-Security-Policy logic to pwa-kit-runtime [#1457](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1457)

## v3.1.1 (Sep 21, 2023)

## v3.1.0 (Jul 26, 2023)

- Allow setting cookies using the `MRT_ALLOW_COOKIES` environment variable [#1318](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1318)
- Fix potential security vulnerability in `semver` dependency [#1358](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1358)

## v3.0.0 (Jun 15, 2023)

- Package name changed to `@salesforce/pwa-kit-runtime`
- Changes to accomodate Template Extensibility. Read the upgrade guide [#1224][the upgrade guide](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/upgrade-to-v3.html)
- Remove usage of `detect-device-type` due to deprecation of user agent string. [#1168](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1168)
- Update engines to drop npm 7, and requires Node to start from version 16.11 [#1166](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1166)

## Older Versions Without Namespace

The older versions below were published without the `@salesforce` namespace.

## v2.7.1 (May 11, 2023)

- Add optional parameter to override configuration folder used in `getConfig` [#1049](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1049)
- Moved the MRT reference app to the SDKs, so that we can verify eg. Node support [#966](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/966)

## v2.7.0 (Mar 03, 2023)

- Support Node 16 [#965](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/965)

## v2.6.0 (Jan 25, 2023)

- Security package updates

## v2.5.0 (Jan 05, 2023)

- Logging cid from res header isntead of req in local development [#821](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/821)
- Replace morgan stream to use console.log [#847](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/847)

## v2.4.0 (Dec 01, 2022)

## v2.3.0 (Oct 27, 2022)

- Performance: Skip retries when flushing CloudWatch metrics, prioritize returning a response instead. [720](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/720)
- Add Correlation ID to SCAPI requests. [#728](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/728)

## v2.2.0 (Aug 25, 2022)

## v2.1.0 (Jul 05, 2022)

## v2.0.0 (May 16, 2022)

- Drop node 12 support for [#589](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/589)
- Improve test coverage [#550](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/550)
- Make the createApp API idiomatic for Express, fix service-worker loading. [#536](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/536)
- Add environment specific configuration support via `getConfig`. [#447](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/447)
- Remove legacy remote proxy, which allowed remote environments to use proxy configs in package.json [#425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/425)
- Remove default `body-parser` middleware from express server. [#444](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/444)
