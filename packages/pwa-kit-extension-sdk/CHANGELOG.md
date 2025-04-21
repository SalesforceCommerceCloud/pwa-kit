## v4.0.0-extensibility-preview.4 (Feb 12, 2025)
- Replace `extendRoutes` with `getRoutes` and `getRoutesAsync` to have simpler API and allow for async SCAPI calls (for example, Shopper SEO's getUrlMapping) [#2308](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2308)
- Change signature of `beforeRouteMatch` to allow for more parameters (now also passing in the locals object) [#2308](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2308)
- Added caching to `getRoutesAsync` and implemented serialization for application extension async routes [#2300](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2300)

## v4.0.0-extensibility-preview.2 (Dec 09, 2024)
- Add global store with slice support for extensions (#2214)[https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2214]
- Add support for `.force_overrides` project file. (#2207)[https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2207]
- Initial release of Extensibility SDK. (#2099)[https://github.com/SalesforceCommerceCloud/pwa-kit/pull/2099]
