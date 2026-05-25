# Hybrid Cookie Domain Configuration

> **WIP: HttpOnly session cookies are in-progress. Do not enable `enableHttpOnlySessionCookies` in production.**

Maintain shopper sessions across subdomains in hybrid PWA Kit and SFRA storefronts by configuring a shared parent cookie domain. Without this configuration, browsers isolate cookies to individual hosts, causing shoppers to appear logged out and lose their baskets when crossing subdomain boundaries. This guide shows how to align the cookie domain settings on both PWA Kit and B2C Commerce to enable seamless cross-subdomain navigation.

## Overview

A hybrid deployment runs PWA Kit and SFRA together, typically behind a single CDN that presents a unified top-level domain to shoppers. Even with that unified front, individual sites within the storefront may live on distinct subdomains—for example `siteA.example.com` and `siteB.example.com`, or a marketing host on `www.example.com` alongside a PWA-served catalog on `shop.example.com`.

Browsers default each `Set-Cookie` response to the **exact host** that issued it. So a cookie set by `siteA.example.com` is not sent on a request to `siteB.example.com` unless the issuer explicitly attaches `Domain=.example.com`. In a hybrid storefront where shoppers cross subdomains—or where PWA Kit and SFRA each serve a different subdomain of the same parent—that default scoping breaks the session: the shopper appears logged out, the basket is empty, hybrid auth fails.

The fix is to set `Domain=` on both sides to a shared parent domain (for example `.example.com`) so the same cookies are sent on every request under that domain. PWA Kit and SFRA configure this in different places—that's why this doc exists: to capture both sides of the configuration in one spot, plus a verification checklist for the seam between them.

For the full list of cookies affected, see [HttpOnly Mode: SLAS Property Storage Mapping](./httponly-storage-mapping.md). For the request-flow architecture, see [HttpOnly Session Cookies — Architecture](./httponly-cookies-architecture.md).

## 1. Configure the cookie domain on PWA Kit

Set `commerceAPI.cookieDomain` in your project's `config/default.js`:

```js
module.exports = {
    app: {
        commerceAPI: {
            // ...
            cookieDomain: '.example.com'
        }
    }
}
```

This setting applies to all auth cookies set by PWA Kit—both the client-side cookies set by `commerce-sdk-react` and the server-side HttpOnly cookies set by the SLAS proxy when `enableHttpOnlySessionCookies` is on. See the [storage mapping reference](./httponly-storage-mapping.md) for the full cookie inventory.

When you first turn `cookieDomain` on for an existing site, both PWA Kit and the SLAS proxy emit an additional expiring `Set-Cookie` for any pre-existing host-scoped cookie of the same name. This prevents the browser from holding both a host-scoped and a domain-scoped cookie for the same key (which causes non-deterministic reads).

### Validation rules

`cookieDomain` must:

- be a plain hostname or a leading-dot domain (e.g. `.example.com`).
- not contain wildcards or whitespace, and not contain any of `* , ; =`.

If the value contains any of those characters, both `commerce-sdk-react` and the SLAS proxy log a warning and fall back to host-scoped cookies. The browser would silently reject the value otherwise—the warning makes the misconfiguration visible.

The browser will **silently drop** a `Domain=` attribute that doesn't match the request hostname. For example, on the default `*.mobify-storefront.com` MRT host, a `Domain=.example.com` Set-Cookie header has no effect. You must serve PWA Kit from a custom domain that falls under `cookieDomain` (attach the domain to your MRT environment via the existing CNAME/Certificate flow).

## 2. Configure the cookie domain on B2C Commerce

The cookie domain in B2C Commerce for hybrid sessions is configured in Business Manager under:

**Merchant Tools → Site Preferences → Hybrid Auth Settings**

The cookie-domain setting accepts a numeric level that controls how broadly B2C Commerce scopes the `dwsid` (and other hybrid session) cookies. Only two values are valid:

| Value | Resulting scope | Example | When to use |
| --- | --- | --- | --- |
| `0` (default) | Host name only | `www.example.com` cookies are not sent on `api.example.com` | Single-host deployments where PWA Kit and SFRA share the exact same hostname. |
| `2` | First-level (parent) domain | `.example.com`—sent on `www.example.com`, `api.example.com`, `pwa.example.com`, etc. | Hybrid deployments where PWA Kit and SFRA live on different subdomains of the same parent domain. **Use this value to match `commerceAPI.cookieDomain: '.example.com'` on the PWA Kit side.** |

> **Do not set the value to `1`.** Level `1` would scope the cookie to the top-level domain (e.g. `.com`) and is rejected for security reasons—a cookie scoped that broadly would leak across unrelated sites. No values other than `0` and `2` are accepted.

The **HttpOnly True** toggle on the same Hybrid Auth Settings page should be left at its default (disabled) value. For broader Hybrid Auth setup see <!-- TODO: link to Hybrid Auth documentation --> [Hybrid Auth documentation (TBD)]().

### Matching the two sides

For PWA Kit and SFRA to share a session, the two settings must agree.

#### ✓ Valid configurations

| PWA Kit `commerceAPI.cookieDomain` | B2C Commerce Hybrid Auth cookie domain | When to use |
| --- | --- | --- |
| unset (or matches the host exactly) | `0` | Single-host hybrid: PWA Kit and SFRA both serve from the exact same hostname. |
| `.example.com` | `2` | Cross-subdomain hybrid: any subdomain of `example.com` (e.g. `siteA.example.com`, `siteB.example.com`) can share the session. |

#### ✗ Invalid configurations

These combinations leave one side host-scoped and the other domain-scoped, so cross-subdomain navigation breaks:

| PWA Kit `commerceAPI.cookieDomain` | B2C Commerce Hybrid Auth cookie domain | What goes wrong |
| --- | --- | --- |
| `.example.com` | `0` | `dwsid` is host-scoped while PWA Kit cookies are domain-scoped. SFRA's session cookie doesn't follow the shopper across subdomains. |
| unset | `2` | `dwsid` is domain-scoped while PWA Kit cookies are host-scoped. PWA Kit's auth cookies don't follow the shopper across subdomains. |

If your site is configured by an SI or by Salesforce, file a request with the team that manages your Business Manager.

## 3. Verification checklist

Run through this list once both PWA Kit and B2C Commerce are configured. You can do most of this in Chrome DevTools → Application → Cookies.

- [ ] **Domain attributes match.** Log into the storefront and confirm that `dwsid` and `cc-nx-g_{siteId}` (or `cc-nx_{siteId}` for registered shoppers) both show the **same** Domain—for example `.example.com`. A mismatch means one side is still host-scoped.
- [ ] **All HttpOnly cookies carry the configured Domain.** Inspect every cookie listed in the storage-mapping table and confirm Domain matches `cookieDomain`. The HttpOnly cookies (`cc-at`, `cc-nx-g`, `cc-nx`, `idp_access_token`, `idp_refresh_token`) should also show the HttpOnly attribute set.
- [ ] **No duplicate host-scoped cookies remain.** After the first login post-migration, there should be **one** entry per cookie name. If you see two entries (one host-scoped, one with `Domain=`), the migration cleanup didn't run—check that you're running a build that includes server-side `cookieDomain` support, and that the user logged in *after* enabling `cookieDomain` (existing sessions are cleaned up on the next set, not retroactively).
- [ ] **Cross-host session works.** Log in on the PWA Kit host, navigate to an SFRA-served URL on a sibling host (or vice-versa), and confirm the shopper stays logged in (no extra `/oauth2/token` round trip in the network tab, basket persists).
- [ ] **`sfdc_dwsid` is forwarded.** In the SCAPI proxy request (`/mobify/proxy/api/...`), confirm an `sfdc_dwsid` header carries the same value as the `dwsid` cookie. If it's missing, the cookie isn't reaching the proxy—almost always a Domain mismatch.
- [ ] **Logout clears domain-scoped cookies.** Hit logout, then inspect cookies—every cookie in the storage-mapping table should be gone (or have `Max-Age=0` / past `Expires`). If some remain, those were set on a domain that didn't match `cookieDomain` at logout time.
- [ ] **Invalid-domain warning is absent.** Search server logs for `Invalid cookieDomain`. If present, the regex rejected your value and cookies are falling back to host-scoped—fix the config.
- [ ] **Production hostname resolves to `cookieDomain`.** The custom domain attached to your MRT environment must be a subdomain of `cookieDomain` (e.g. `pwa.example.com` under `.example.com`). On the default `*.mobify-storefront.com` host, the Domain attribute is silently dropped.

## See also

- <!-- TODO: link to Hybrid Auth documentation --> [Hybrid Auth documentation (TBD)]()—overview of the hybrid PWA Kit + SFRA auth model. The reciprocal link from that doc back to this one is the dual-linkage referenced when both docs are published.
- [HttpOnly Mode: SLAS Property Storage Mapping](./httponly-storage-mapping.md)—the canonical list of cookies affected by `cookieDomain`.
- [HttpOnly Session Cookies — Architecture](./httponly-cookies-architecture.md)—request-flow diagrams and the broader configuration guide.
- [`packages/commerce-sdk-react/src/auth/storage/cookie.ts`](../packages/commerce-sdk-react/src/auth/storage/cookie.ts)—client-side cookie store that consumes `cookieDomain` and runs the host-vs-domain cleanup pattern.
- [`packages/pwa-kit-runtime/src/ssr/server/process-token-response.js`](../packages/pwa-kit-runtime/src/ssr/server/process-token-response.js)—server-side proxy that mirrors the same logic for HttpOnly cookies.
