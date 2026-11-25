# Configurable Googlebot token-cache workaround

Status: Implemented; live rollout verification remains.

Decision date: November 18, 2026.

Tracking: [PR #4119](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/4119)

## Problem and context

Googlebot has been observed reusing stale SLAS token responses while its renderer clock is behind real time. The stale clock can make an expired JWT appear usable to the storefront, resulting in repeated SCAPI 401s. The exact caching layer has not been directly observed.

The initial port of the commerce-sdk-react 3.4.0 hotfix adds a fresh `c_nonce` query parameter to token requests and treats JWTs issued more than 60 seconds in the future as expired. That initial port applied these additions universally. This decision narrows their scope through existing PWA Kit application configuration and request classification.

The workaround is opt-in and targets a configurable request class. A fixed `bot` class would exclude storefronts that use custom request-class names.

## Configuration contract

Add the following property under `app.commerceAPI` in `packages/template-retail-react-app/config/default.js`, alongside `proxyPath` and `parameters`:

```js
tokenResponseCacheWorkaround: {
    enabled: false,
    requestClass: 'bot'
}
```

Use the existing environment-specific configuration mechanism to enable it or override the class. For example, a storefront using a custom request class could configure:

```js
tokenResponseCacheWorkaround: {
    enabled: true,
    requestClass: 'custom-bot'
}
```

These are application settings, not SCAPI request parameters or server deployment settings. Do not place them inside `commerceAPI.parameters` or `ssrParameters`, or introduce a separate environment-variable/global configuration mechanism.

| Property | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Only the boolean `true` enables evaluation of the workaround. |
| `requestClass` | `'bot'` in the template | A non-empty string that must exactly match the current document's request class. |

Absent configuration, a missing/invalid class, or a non-boolean enable value leaves the workaround off. Matching is case-sensitive; there are no regexes, substring matches, wildcard classes, or fallback user-agent checks.

## Request classification and ownership

The storefront owns classification through the existing `setRequestClass()` mechanism in `app/request-processor.js`. The template includes a commented bot-detection example; adding or enabling this configuration does not automatically enable that example or change a storefront's existing classifier.

The runtime already stores the class in `res.locals.requestClass` and exposes it to the browser as `window.Progressive.ssrOptions.requestClass`. No runtime serialization change is required. The class belongs to the document request and remains available during client-side navigation.

Classification selects a compatibility workaround. It is not an authentication or authorization boundary and must not grant access to protected data.

## Configuration flow

1. `AppConfig` reads the resolved settings from `locals.appConfig.commerceAPI`.
2. In the browser, it reads `window.Progressive?.ssrOptions?.requestClass` and computes whether the settings are enabled and the configured, non-empty class exactly matches.
3. It passes the resulting boolean as `enableTokenResponseCacheWorkaround` to `CommerceApiProvider`.
4. The provider forwards the boolean to `AuthConfig` and includes it in the Auth instance's memoization dependencies. The provider prop and Auth option both default to `false`.
5. `Auth` uses this boolean to gate both additions described below.

Keep `window.Progressive`, PWA Kit configuration loading, and request-class matching out of Commerce SDK React. The library receives only the explicit boolean, preserving its use outside PWA Kit. Standalone SDK consumers can supply that boolean using their own browser classification; SSR callers should leave it disabled.

Do not enable or disable the workaround by changing shared SDK prototypes or module-level state. Each Auth instance owns its effective setting, including any separate client it creates for direct private-client authentication.

## Behavior

| Situation in the PWA Kit integration | Effective workaround |
| --- | --- |
| Configuration absent or disabled | Off |
| Enabled with an exact, non-empty request-class match | On |
| Enabled with a different or missing document request class | Off |
| Enabled with a missing/invalid configured request class | Off |
| SSR, regardless of request class | Off |

The browser-only decision targets the observed Googlebot renderer issue and preserves existing SSR behavior. `AppConfig` must return `false` on the server without accessing `window`.

When enabled:

- Add a fresh `c_nonce` on every `getAccessToken` invocation. Prefer `crypto.randomUUID()`, then 128 bits from `crypto.getRandomValues()`, so a frozen clock and deterministic `Math.random()` do not repeat the cache buster. Retain the timestamp-and-`Math.random()` form as a best-effort fallback when Web Crypto is unavailable; that fallback cannot guarantee distinct values across deterministic renderer runs.
- Apply the same setting to the separate client used for direct private-client authentication, as well as standard, private HttpOnly, and public HttpOnly proxy routes.
- Preserve existing request parameters, headers, bodies, receiver binding, raw-response mode, response parsing, and SDK errors. Do not introduce retries at this layer.
- Treat a readable stored JWT with `iat` more than 60 seconds ahead of the browser clock as expired. Exactly 60 seconds ahead remains allowed. Exempt only the latest token acquired by the current Auth instance from this additional check, preventing repeated refreshes when the renderer clock is behind a freshly issued token. The exemption is not persisted, is cleared with auth storage, and does not bypass the existing expiration buffer or 401 recovery.

When disabled, do not inject `c_nonce` or apply the additional future-`iat` check. Retain the pre-workaround token behavior, including any custom parameters supplied by callers.

The existing 60-second expiration buffer and SDK 401 refresh-and-retry handling always remain active. In HttpOnly browser mode the JWT cannot be read, so the future-`iat` check does not apply; that flow continues to use its expiry cookie, token-request cache buster when enabled, and existing 401 recovery.

## Scope and alternatives

- Prefer the existing request class over a second user-agent classifier inside Auth: storefronts already control classification and may use custom names.
- Prefer an application-level predicate and a library-level boolean over reading PWA globals inside Commerce SDK React: this keeps platform-specific decisions in the storefront.
- Gate both additions together so disabling the workaround restores the previous behavior without leaving part of the workaround active.
- Exclude `getTrustedAgentAccessToken` requests: Googlebot does not use the trusted-agent authentication flow.
- Leave customer-specific diagnostics, PerimeterX changes, the separate PDP fallback, OAuth/OIDC nonce handling, and other token endpoints outside this change.

`c_nonce` is a non-secret cache buster, not an OAuth/OIDC security nonce. It does not guarantee bypassing every renderer reuse mechanism.

## Implementation and acceptance criteria

Expected changes are limited to the Retail React App default configuration and `AppConfig` wiring, Commerce SDK React provider/Auth options and gating, their tests, and relevant documentation/changelogs.

- Test the configuration matrix above, including `custom-bot`, case mismatch, empty/missing values, and `enabled: 'true'` remaining disabled.
- Verify a matching class with `enabled: false` does not enable either addition.
- Verify SSR stays disabled even for a matching class, and browser hydration computes the browser-specific value.
- Verify provider configuration changes reach the Auth instance without rebuilding it on unrelated renders.
- Verify both Web Crypto paths produce distinct nonces across Auth instances with a frozen clock and `Math.random()`. Cover the best-effort fallback. Disabled requests receive no injected nonce and preserve caller-supplied custom parameters.
- Verify trusted-agent token requests remain unchanged even when enabled, including caller-supplied custom parameters.
- Preserve coverage of direct private-client cloning, standard/HttpOnly proxy URLs, SDK errors, and raw responses.
- Test future-`iat` offsets of 59, 60, and 61 seconds with the setting enabled and disabled, plus the unchanged expiration buffer.
- Confirm the future-`iat` condition reaches the existing refresh path when enabled and does not change HttpOnly browser expiry handling. With a clock two minutes behind, repeated `ready()` calls after guest login or refresh must not repeatedly acquire tokens. Verify the latest-token exemption is instance-local, clears with auth storage, and preserves normal expiry checks.

## Rollout verification

Deploy with the setting disabled first, then enable it for the intended request class in the target environment. Use Google Search Console's inspection tooling to exercise Googlebot rendering. Confirm the serialized class matches the configured value, token URLs vary and reach the upstream service, and repeated SCAPI 401s decrease. Confirm ordinary shopper traffic retains its previous behavior.

Rollback is setting `enabled: false` through the existing configuration/deployment process. Local tests establish request construction and gating behavior; live Googlebot behavior and upstream acceptance require rollout verification.

## Review follow-up — November 25, 2026

PR review identified two renderer-specific edge cases: a repeated clock and `Math.random()` sequence can repeat a cache-buster URL, and the future-`iat` check can reject every fresh token if the renderer clock remains behind. Web Crypto is now preferred for request variation, and the current Auth instance remembers only its latest acquired token to avoid a refresh loop. Stored/hydrated tokens remain subject to the future-`iat` guard. This exemption is in memory only and does not establish token validity independently of the upstream service.
