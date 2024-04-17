## v1.4.2 (Apr 17, 2024)
- Update SLAS private proxy path [#1752](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1752)

## v1.4.1 (Apr 16, 2024)
- Add missing params keys `allVariationProperties` and `perPricebook`  for Shopper Search [#1750](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1750)

## v1.4.0 (Apr 15, 2024)

- Add Support for SLAS private flow [#1722](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1722)
- Fix invalid query params warnings and allow custom query [#1655](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1655)
- Fix cannot read properties of undefined (reading 'unshift') [#1689](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1689)
- Add Shopper SEO hook [#1688](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1688)
- Update useLocalStorage implementation to be more responsive [#1703](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1703)
- Storefront Preview: avoid stale cached Commerce API responses, whenever the Shopper Context is set [#1701](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1701)

## v1.3.0 (Jan 19, 2024)

- Add support for node 20 [#1612](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1612)

## v1.2.0 (Dec 08, 2023)

- Add StorefrontPreview component 'onContextChange' property to prepare for future Storefront Preview release [#1527](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1527)
- Update engine compatibility to include npm 10 [#1597](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1597)

## v1.1.0 (Nov 03, 2023)

- Add StorefrontPreview component [#1508](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1508)
- Using `login` for authentication instead of `email` in registration process [#1464](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1464)
- Fix bug to remove cookies using the default attributes used when setting cookie [#1505](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1505)

## v1.0.2 (Sep 21, 2023)

- commerce-sdk-react: have typedoc-related deps as dev dependencies [#1425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1425)
- Updated commerce-sdk-isomorphic to v1.10.4 [#137](https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/pull/137)

## v1.0.1 (Jul 26, 2023)

- Updated the expiry of the guest refresh token cookie to 30 days, to match the actual [duration of the token](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas.html?q=refresh+token#access-tokens-and-refresh-tokens). [#1342](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1342)
- Fix potential security vulnerability in `semver` dependency [#1358](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1358)
- Fix request headers to be the intended headers, rather than parameters [#1377](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1377)

## v1.0.0 (Jun 15, 2023)

- First public release of package on npm under `@salesforce/commerce-sdk-react`
- Add missing cache invalidation for contexts/customers/login/order [#1073](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1073)
- Upgrade React 18, React DOM 18, @types/react@18, @types/react-dom@v18 Testing library 14 [#1166](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1166)

## Older Versions Without Namespace

The older versions below were published without the `@salesforce` namespace.

## v2.7.1 (May 11, 2023)

- Re-generate lock files and fix hook lib tests [#1186](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1186)
- Add additional properties to ShopperLogin test types [#1185](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1185)
- Add missing cache invalidation for contexts/customers/login/order [#1073](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1073)
- Fix Shopper Baskets Test case [#1082](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1082)
- Implement remaining Shopper Baskets cache logic [#1070](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1070)
- Decode pre-fetched token and save auth data in storage [#1052](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1052)
- Allow query hook parameters to be null. [#1046](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1046)
- Implement updateCustomerPassword as no-op. [#1031](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1031)

## v2.7.0 (Mar 03, 2023)

- Add Page/Region/Component components for shopper experience/page designer page rendering [#963](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/963)
- Namespace `Auth` storage keys with site identifier to allow multi-site support [#911](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/911)
- Add Shopper Experience `usePage` and `usePages` hooks[#958](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/958)

## v2.6.0 (Jan 25, 2023)

## v2.5.0 (Jan 05, 2023)

- Exclude test files in package file to avoid publishing them [#856](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/856)
- Pass in 'headers' and 'rawResponse' options to mutation hooks [#845](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/845)
- Commerce hooks: basket mutations [#834](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/834)
- Remove overriding of params in mutation hooks [#859](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/859)

## v2.4.0 (Dec 01, 2022)
