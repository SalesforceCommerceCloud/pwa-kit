## v3.2.0-dev (Oct 14, 2024)

- Add the `authorizeCustomer` and `getPasswordResetToken` to the `ShopperLoginMutations` [#2056](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2056)

## v3.1.0-dev (Aug 08, 2024)

-   Improve refresh token error logging [#2028](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2028)
-   Remove ocapi session-bridging on phased launches [#2011](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2011)

-   Add `defaultDnt` to support setting the dnt flag for SLAS. Upgrade `commerce-sdk-isomorphic` to v3.1.1 [#1979](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1979)
-   Update logout helper to work for guest users [#1997](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1997)
-   Update `useCustomMutation` hook to accept request body as a parameter to the mutate function [#2030](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2030)
-  Simplify `useCustomMutation` hook implementation [#2034](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2034)
-  Documentation for `useCustomMutation` hook along with new dynamic `body` param option [#2042](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2042)

## v3.0.1 (Sep 04, 2024)

-   Fixed an issue where the `expires` attribute in cookies, ensuring it uses seconds instead of days. [#1994](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1994)

## v3.0.0 (Aug 07, 2024)

-   Add `meta.displayName` to queries. It can be used to identify queries in performance metrics or logs. [#1895](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1895)
-   Upgrade to commerce-sdk-isomorphic v3.0.0 [#1914](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1914)

### :warning: Planned API Changes :warning:

#### Shopper Context

Starting July 31st 2024, all endpoints in the Shopper context API will require the `siteId` parameter for new customers. This field is marked as optional for backward compatibility and will be changed to mandatory tentatively by January 2025. You can read more about the planned change [here](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-context?meta=Summary) in the notes section.

#### Shopper Login (SLAS)

SLAS will soon require new tenants to pass `channel_id` as an argument for retrieving guest access tokens. You can read more about the planned change [here](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas.html#guest-tokens).

Please be aware that existing tenants are on a temporary allow list and will see no immediate disruption to service. We do ask that all users seek to adhere to the `channel_id` requirement before the end of August to enhance your security posture before the holiday peak season.

In practice, we recommend:

-   For customers using the SLAS helpers with a private client, it is recommended to upgrade to `v3.0.0` of the `commerce-sdk-react`.

## v2.0.2 (Jul 12, 2024)

-   Updated StorefrontPreview component to make siteId available [#1874](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1874)

## v2.0.1 (Jul 08, 2024)

-   Fix private slas proxy config for commerce api in provider [#1883](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1883)
-   Fix `useCustomQuery` error handling [#1883](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1883)
-   Fix `updateCustomer` squashing existing data [#1883](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1883)
-   Fix `transferBasket` updating the wrong customer basket [#1887](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1887)

## v2.0.0 (Jun 25, 2024)

-   Add `useCustomQuery` and `useCustomMutation` for SCAPI custom endpoint support [#1793](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1793)
-   Add Shopper Stores hooks [#1788](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1788)
-   Add a helper method to add an item to either new or existing basket [#1677](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1677)
-   Add `updateItemsInBasket` mutation [#1852](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1852)
-   Upgrade to commerce-sdk-isomorphic v2.1.0 [#1852](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1852)

## v1.4.2 (Apr 17, 2024)

-   Update SLAS private proxy path [#1752](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1752)

## v1.4.1 (Apr 16, 2024)

-   Add missing params keys `allVariationProperties` and `perPricebook` for Shopper Search [#1750](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1750)

## v1.4.0 (Apr 15, 2024)

-   Add Support for SLAS private flow [#1722](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1722)
-   Fix invalid query params warnings and allow custom query [#1655](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1655)
-   Fix cannot read properties of undefined (reading 'unshift') [#1689](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1689)
-   Add Shopper SEO hook [#1688](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1688)
-   Update useLocalStorage implementation to be more responsive [#1703](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1703)
-   Storefront Preview: avoid stale cached Commerce API responses, whenever the Shopper Context is set [#1701](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1701)

## v1.3.0 (Jan 19, 2024)

-   Add support for node 20 [#1612](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1612)

## v1.2.0 (Dec 08, 2023)

-   Add StorefrontPreview component 'onContextChange' property to prepare for future Storefront Preview release [#1527](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1527)
-   Update engine compatibility to include npm 10 [#1597](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1597)

## v1.1.0 (Nov 03, 2023)

-   Add StorefrontPreview component [#1508](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1508)
-   Using `login` for authentication instead of `email` in registration process [#1464](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1464)
-   Fix bug to remove cookies using the default attributes used when setting cookie [#1505](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1505)

## v1.0.2 (Sep 21, 2023)

-   commerce-sdk-react: have typedoc-related deps as dev dependencies [#1425](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1425)
-   Updated commerce-sdk-isomorphic to v1.10.4 [#137](https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic/pull/137)

## v1.0.1 (Jul 26, 2023)

-   Updated the expiry of the guest refresh token cookie to 30 days, to match the actual [duration of the token](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas.html?q=refresh+token#access-tokens-and-refresh-tokens). [#1342](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1342)
-   Fix potential security vulnerability in `semver` dependency [#1358](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1358)
-   Fix request headers to be the intended headers, rather than parameters [#1377](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1377)

## v1.0.0 (Jun 15, 2023)

-   First public release of package on npm under `@salesforce/commerce-sdk-react`
-   Add missing cache invalidation for contexts/customers/login/order [#1073](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1073)
-   Upgrade React 18, React DOM 18, @types/react@18, @types/react-dom@v18 Testing library 14 [#1166](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1166)

## Older Versions Without Namespace

The older versions below were published without the `@salesforce` namespace.

## v2.7.1 (May 11, 2023)

-   Re-generate lock files and fix hook lib tests [#1186](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1186)
-   Add additional properties to ShopperLogin test types [#1185](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1185)
-   Add missing cache invalidation for contexts/customers/login/order [#1073](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1073)
-   Fix Shopper Baskets Test case [#1082](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1082)
-   Implement remaining Shopper Baskets cache logic [#1070](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1070)
-   Decode pre-fetched token and save auth data in storage [#1052](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1052)
-   Allow query hook parameters to be null. [#1046](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1046)
-   Implement updateCustomerPassword as no-op. [#1031](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1031)

## v2.7.0 (Mar 03, 2023)

-   Add Page/Region/Component components for shopper experience/page designer page rendering [#963](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/963)
-   Namespace `Auth` storage keys with site identifier to allow multi-site support [#911](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/911)
-   Add Shopper Experience `usePage` and `usePages` hooks[#958](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/958)

## v2.6.0 (Jan 25, 2023)

## v2.5.0 (Jan 05, 2023)

-   Exclude test files in package file to avoid publishing them [#856](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/856)
-   Pass in 'headers' and 'rawResponse' options to mutation hooks [#845](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/845)
-   Commerce hooks: basket mutations [#834](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/834)
-   Remove overriding of params in mutation hooks [#859](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/859)

## v2.4.0 (Dec 01, 2022)
