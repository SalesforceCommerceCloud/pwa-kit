## v2.8.0 (Nov 03, 2023)
-   Move Content-Security-Policy logic into pwa-kit-runtime [#1491](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1491)
## v2.7.4 (Aug 28, 2023)
## v2.7.3 (Jun 20, 2023)
-   Support Node 18 and NPM 9. [#1265](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1265)
## v2.7.2 (May 29, 2023)
## v2.7.1 (May 11, 2023)

-   Add optional parameter to override configuration folder used in `getConfig` [#1049](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1049)
-   Moved the MRT reference app to the SDKs, so that we can verify eg. Node support [#966](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/966)

## v2.7.0 (Mar 03, 2023)

-   Support Node 16 [#965](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/965)

## v2.6.0 (Jan 25, 2023)

-   Security package updates

## v2.5.0 (Jan 05, 2023)

-   Logging cid from res header isntead of req in local development [#821](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/821)
-   Replace morgan stream to use console.log [#847](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/847)

## v2.4.0 (Dec 01, 2022)

## v2.3.0 (Oct 27, 2022)

-   Performance: Skip retries when flushing CloudWatch metrics, prioritize returning a response instead. [720](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/720)
-   Add Correlation ID to SCAPI requests. [#728](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/728)

## v2.2.0 (Aug 25, 2022)

## v2.1.0 (Jul 05, 2022)

## v2.0.0 (May 16, 2022)

-   Drop node 12 support for [#589](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/589)
-   Improve test coverage [#550](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/550)
-   Make the createApp API idiomatic for Express, fix service-worker loading. [#536](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/536)
-   Add environment specific configuration support via `getConfig`. [#447](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/447)
-   Remove legacy remote proxy, which allowed remote environments to use proxy configs in package.json [#425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/425)
-   Remove default `body-parser` middleware from express server. [#444](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/444)
