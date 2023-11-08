## v3.3.0-dev (Nov 03, 2023)
## v3.2.0 (Nov 03, 2023)
- Move Content-Security-Policy logic to pwa-kit-runtime [1457](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1457)

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
