## v3.8.0-dev (Aug 8, 2024)
- Update ssr.js templates to include new feature flag to encode non ASCII HTTP headers [#2048](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2048)
- Replace getAppOrigin with useOrigin to have a better support for an app origin building. [#2050](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2050)

## v3.7.0 (Aug 7, 2024)

- Update default Node.js version to v20. [#1867](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1867/files)

## v3.6.0 (Jun 25, 2024)

- Fix: 'Cannot use import statement outside a module' error in generated extensible project unit tests [#1821](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1821)

## v3.5.1 (Apr 15, 2024)

- Add Support for SLAS private flow [#1722](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1722)

## v3.4.0 (Jan 19, 2024)

- Add local development support for node 20 [#1612](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1612)
  - Support for node 20 is not yet available on Managed Runtime

## v3.3.0 (Nov 8, 2023)

- Replace max-age with s-maxage to only cache shared caches [#1564](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1564)
- Update engine compatibility to include npm 10 [#1597](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1597)

## v3.2.0 (Nov 3, 2023)

## v3.1.0 (Jul 26, 2023)

- Fix potential security vulnerability in `semver` dependency [#1358](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1358)

## v3.0.0 (June 15, 2023)

- Package name changed to `@salesforce/pwa-kit-create-app`
- Add `--templateVersion` argument to allow template version selection when generating a project using a template that is hosted on NPM. [#1229](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1229)
- Add extensible project generation support. [#1205](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1205)

## Older Versions Without Namespace

The older versions below were published without the `@salesforce` namespace.

## v2.7.1 (May 11, 2023)

- Moved the MRT reference app to the SDKs, so that we can verify eg. Node support [#966](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/966)

## v2.5.0 (Jan 5, 2023)

- Add instanceType to Einstein activity body [#858](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/858)
- Do not use a proxy to call Einstein [#857](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/857)

## v2.4.0 (Dec 01, 2022)

- Update instanceUrl on retail-react-app-demo preset [#799](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/799)
- Update usages of zzrf-001 ODS instance to the new short URL format [#816](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/816)

## v2.3.0 (Oct 27, 2022)

- Fix generated projects missing required fields in the `manifest.json` file. [#729](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/729)
- Update ODS instance URL for the `retail-react-app-demo` preset. [#799](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/799)

## v2.2.0 (Aug 25, 2022)

## v2.1.0 (Jul 05, 2022)

- Throw error if the output directory exists [#627](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/627)

## v2.0.0 (May 16, 2022)

- Pin versions of pwa-kit-\* packages [#577](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/577)
- Add typescript-minimal and typescript-minimal-test-project presets [#574](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/574)
- Drop node 12 support for [#589](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/589)
- Fix generator log [#571](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/571)
- Fix incorrect site related values when generating without use of a preset [#470](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/470)
- Support Multi-site implementation using dynamic config [#469](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/469)
- Add verbose flag to generator [#463](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/463)
- Environment Specific Configuration Support [#477](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/447)

## v1.5.0 (Mar 17, 2022)

- Node warnings with more readable Node versions [#410](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/410)
- Fix project generation on Windows when using WSL [#385](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/385)
- Show warning when using incompatible node version [#384](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/384)
- Update App Generator questions copy and slugify Project Name as the Project Id [#374](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/374)

## v1.4.0 (Jan 27, 2022)

- Add a demo project option that produces a project with our demo sandbox presets [#322](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/322)
- Generate `test-project` with the correct Einstein's site id [#285](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/285)
- Generator creates a project configured to use a single-locale [#325](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/325)

## v1.3.0 (Jan 06, 2022)

## v1.1.0 (Sep 27, 2021)

- Add a hello world app option for testing purposes. [#82](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/82)

## v1.0.0 (Sep 08, 2021)

- PWA Kit General Avaliability and open source. 🎉
