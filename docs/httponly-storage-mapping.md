# HttpOnly Mode: SLAS Property Storage Mapping

> **WIP: HttpOnly session cookies are in-progress. Do not enable `enableHttpOnlySessionCookies` in production.**
>
> **Scope: PWA Kit only.** This reference applies to projects built on PWA Kit and the cookie/localStorage routing performed by `commerce-sdk-react` and the SLAS proxy in `pwa-kit-runtime`. **It does not apply to sfNext (sf-next).** sfNext is HttpOnly by default and not every cookie listed here is present there.

Map authentication and session data storage locations when migrating PWA Kit from localStorage to HttpOnly cookies. Enabling `enableHttpOnlySessionCookies` moves sensitive tokens—access tokens, refresh tokens, and IDP credentials—from client-accessible localStorage to HttpOnly cookies that protect against XSS attacks. Use this reference to identify where each SLAS property lives in both non-HttpOnly and HttpOnly modes, and which cookies gain the HttpOnly security flag.

## Overview

When `enableHttpOnlySessionCookies` is turned on in a PWA Kit project, several SLAS-related auth properties stop being written to `localStorage` and start being read from proxy-set cookies instead. This doc is the reference for **where every property lives in each mode**.

For request-flow diagrams (token acquisition, refresh, logout, SCAPI proxying) see [HttpOnly Session Cookies — Architecture](./httponly-cookies-architecture.md).

For configuring a shared cookie domain across PWA Kit and SFRA in a hybrid deployment, see [Hybrid Cookie Domain Configuration](./hybrid-cookie-domain-configuration.md).

## How storage is selected

In **non-HttpOnly mode** (the default), `commerce-sdk-react` writes most SLAS response fields to `localStorage`. A few values (refresh tokens, `usid`) are already cookies because they're shared with SFRA in hybrid setups.

In **HttpOnly mode**, the SLAS proxy in `pwa-kit-runtime` sets cookies on every token response and strips the same fields from the JSON body. `commerce-sdk-react` then reads those values back from cookies. The cookie is the single source of truth—no `localStorage` mirror is kept.

All cookie names are suffixed with `_{siteId}` (for example `cc-at_RefArch`). The `{siteId}` suffix is omitted from the table below for readability.

## Reference table

| SLAS property | Non-HttpOnly source | HttpOnly source | HttpOnly flag (HttpOnly mode) | Notes |
| --- | --- | --- | --- | --- |
| `access_token` | localStorage `access_token` | cookie `cc-at` | **Yes** | Server-side; `useAccessToken` returns `''` on the client. The proxy injects the token into SCAPI requests. |
| `expires_in` | localStorage `expires_in` | derived from cookie `cc-at-expires` | No | Cookie carries the absolute epoch (seconds) of the JWT `exp` claim. |
| `refresh_token` (guest) | cookie `cc-nx-g` | cookie `cc-nx-g` | **Yes** (HttpOnly mode only) | Cookie name is the same in both modes; only the HttpOnly flag changes. |
| `refresh_token` (registered) | cookie `cc-nx` | cookie `cc-nx` | **Yes** (HttpOnly mode only) | Same as above. |
| `refresh_token_expires_in` | localStorage `refresh_token_expires_in` | cookie `cc-nx-expires` | No | Cookie carries the absolute epoch (seconds) when the refresh token expires; replaces the old `cc-nx-exists` marker. |
| `customer_id` | localStorage `customer_id` | cookie `customer_id` | No | |
| `customer_type` | localStorage `customer_type` | cookie `customer_type` | No | Derived from JWT `isb` claim (`guest` / `registered`). |
| `enc_user_id` | localStorage `enc_user_id` | cookie `enc_user_id` | No | |
| `usid` | cookie `usid` | cookie `usid` | No | Already a cookie in non-HttpOnly mode; lifetime aligns to the refresh-token TTL in HttpOnly mode. |
| `id_token` | localStorage `id_token` | cookie `id_token` | No | Expiry tied to the access-token JWT `exp`. |
| `idp_access_token` | localStorage `idp_access_token` | cookie `idp_access_token` | **Yes** | Unreadable from JavaScript in HttpOnly mode; getter returns `''`. |
| `idp_refresh_token` | localStorage `idp_refresh_token` | cookie `idp_refresh_token` | **Yes** | Unreadable from JavaScript in HttpOnly mode; getter returns `''`. |
| `uido` | localStorage `uido` | cookie `uido` | No | Identifies the IDP origin (e.g. `slas`, `ecom`). |
| `dnt` | localStorage `dnt` (user preference) + cookie `dw_dnt` | localStorage `dnt` + cookies `dw_dnt`, `cc-at-dnt` | No | The user-preference value stays in localStorage in both modes. `cc-at-dnt` reflects the JWT `dnt` claim. |
| `token_type` | localStorage `token_type` | localStorage `token_type` | n/a | Always `Bearer`; unused inside PWA Kit. |
| `code_verifier` | localStorage `code_verifier` | localStorage `code_verifier` | n/a | PKCE intermediate; never migrated. |
| `dwsid` (hybrid only) | cookie `dwsid` | cookie `dwsid` | Set by B2C Commerce | B2C Commerce owns this cookie; PWA Kit only reads it and forwards it as the `sfdc_dwsid` header to maintain server affinity. |

## Reading these in your code

`commerce-sdk-react`'s `Auth` class (and the `useAccessToken`, `useCustomerType`, `useCustomerId`, etc. hooks) handle the routing for you—the storage type is selected per-property, and `enableHttpOnlySessionCookies` switches the migrated keys to the cookie store automatically. Application code that goes through these hooks works unchanged in either mode.

If you read these values directly (for analytics, debugging, or hybrid SFRA pages), use the table above to pick the right source.

## See also

- [HttpOnly Session Cookies — Architecture](./httponly-cookies-architecture.md)—request-flow diagrams, proxy modes, configuration steps for enabling the feature.
- [Hybrid Cookie Domain Configuration](./hybrid-cookie-domain-configuration.md)—how to share these cookies across a PWA Kit + SFRA deployment.
- [`packages/commerce-sdk-react/src/auth/index.ts`](../packages/commerce-sdk-react/src/auth/index.ts)—`DATA_MAP` and `HTTPONLY_COOKIE_BACKED_KEYS` are the source of truth for the table above.
- [`packages/pwa-kit-runtime/src/ssr/server/httponly-cookie-config.js`](../packages/pwa-kit-runtime/src/ssr/server/httponly-cookie-config.js)—the canonical cookie-name and attribute table the SLAS proxy uses.
