# Guest Order Access

## 1. Overview

Guest Order Access lets shoppers look up their order status without creating an account. The shopper enters their order number and email address on a dedicated page; the server calls the ECOM `requestOrderAccessCode` endpoint, which emails a time-limited 6-digit access code. After entering the code the shopper can view order details for up to 15 minutes before needing to re-verify.

This feature ships in ECOM 26.8. It is disabled by default and requires explicit opt-in via feature flag.

## 2. Prerequisites

- **ECOM 26.8 or later** — required for the `requestOrderAccessCode` SCAPI endpoint. The feature cannot be enabled against earlier ECOM versions.
- **`allowCookies` enabled** — the server writes a `Secure; HttpOnly; SameSite=Strict` session cookie after verification. This requires either `localAllowCookies: true` in `app/ssr.js` options (local dev) or the environment variable `MRT_ALLOW_COOKIES=true` (MRT deployments). Without this the `Set-Cookie` header is silently stripped by the MRT runtime.
- **Feature flag** — `app.guestOrderLookup.enabled: true` in `config/default.js` or an environment-specific override.

## 3. Configuration

All config keys live under `app.guestOrderLookup` in `config/default.js`:

```js
guestOrderLookup: {
  enabled: false,              // Master switch — off by default
  orderNumberRegex: '^[A-Za-z0-9]{6,20}$',  // Client-side format validation
  requestCodeThrottle: {
    windowMs: 60000,           // 1 minute window
    max: 5                     // Max verify attempts per IP per window
  }
}
```

To enable the feature for a site:

```js
// config/default.js
module.exports = {
  app: {
    // ...
    guestOrderLookup: {
      enabled: true,
      orderNumberRegex: '^[A-Za-z0-9]{6,20}$',
      requestCodeThrottle: {
        windowMs: 60000,
        max: 5
      }
    }
  }
}
```

### Config key reference

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `enabled` | boolean | `false` | Master switch. When `false`, all `/order-lookup` routes return 404 and the footer link is hidden. |
| `orderNumberRegex` | string | `'^[A-Za-z0-9]{6,20}$'` | Regex applied client-side to the Order Number field. Adjust to match your order ID format. |
| `requestCodeThrottle.windowMs` | number | `60000` | Rolling window in milliseconds for the in-process throttle on `/api/order-lookup/verify`. |
| `requestCodeThrottle.max` | number | `5` | Maximum verify attempts allowed per IP within `windowMs`. Requests over the limit receive HTTP 429. |

## 4. Security posture

- **Time-limited credential** — the access code has a 15-minute TTL enforced by ECOM/Redis. After expiry, the shopper must restart the flow.
- **Not single-use** — the code is reusable within its 15-minute window. Attempt limits are enforced server-side by ECOM/Redis, not by a "use once" constraint.
- **Anti-enumeration** — Step 1 (`/order-lookup`) always routes the shopper to Step 2 regardless of whether the order number and email are valid. The server always returns 202. This prevents an attacker from inferring whether an order/email combination exists.
- **Credentials never in URLs** — `orderNo`, `email`, and `accessCode` are passed between steps via React Router state, not as URL query parameters. They are never visible in the browser address bar or server access logs.
- **HttpOnly session cookie** — after successful verification the server writes `cc-goa_{siteId}` with the flags `Secure; HttpOnly; SameSite=Strict`. The cookie is not readable from JavaScript (`document.cookie`).
- **Field allowlist enforced server-side** — the `GET /api/order-lookup/order` endpoint strips `paymentCard`, `expirationMonth`, `expirationYear`, `phone`, `globalPartyId`, `orderToken`, `orderViewCode`, and all `c_*` custom attributes before returning the order to the client.
- **In-process throttle** — the server applies an in-process rate limit on `POST /api/order-lookup/verify` (configurable via `requestCodeThrottle`). This is a defense-in-depth measure that operates before the request reaches ECOM.

## 5. Email customization

Shoppers receive the access code via email triggered by the SFCC Business Manager hook `sfcc.app.order.sendOrderAccessCode`. Merchants must configure this hook in Business Manager for shoppers to receive codes.

If the hook is not configured, is misconfigured, or fails silently, shoppers will submit the form but never receive the email. This is a merchant configuration issue, not a PWA Kit failure. The storefront cannot detect whether the email was delivered.

## 6. SDK dependency

`requestOrderAccessCode` is available in `commerce-sdk-isomorphic` 5.5.0 (shipped with ECOM 26.8). The `@ts-expect-error` guards and `// SDK 26.8 pending` comments that were present in earlier drafts of this feature have been removed now that the method is in the SDK types.

## 7. Cookie behavior and `allowCookies`

After successful verification the server sets the cookie `cc-goa_{siteId}` in the `Set-Cookie` response header. This cookie accumulates entries for orders verified in the current browser session (one entry per `orderNo`). Entries are stored as a compact JSON structure; the cookie is capped at approximately 3 KB with FIFO eviction when the limit is approached.

The cookie write is conditional on the MRT runtime allowing cookies:

- **Local dev** (`localAllowCookies: true` in `app/ssr.js`) — set this in the SSR server options to allow the cookie to be written during local development.
- **MRT deployments** (`MRT_ALLOW_COOKIES=true` environment variable) — set this in the MRT deployment environment.

If neither is set, the runtime silently strips all `Set-Cookie` headers and the cookie is never written. The verification step will appear to succeed (the `/api/order-lookup/verify` endpoint returns 200) but the subsequent `GET /api/order-lookup/order` call will fail with 404 because the session cookie is missing.

## 8. Cancel/return coordination

The same `cc-goa_{siteId}` session cookie and ECOM access code session are reused by the sibling cancel and return epics planned for ECOM 26.8. Within the 15-minute verification window a shopper can:

- View order details
- Initiate a cancellation (if the cancel epic is enabled)
- Initiate a return (if the return epic is enabled)

without needing to re-enter their access code. The session cookie serves as the shared credential across all three operations.

## 9. Troubleshooting

**"I enabled the feature but the footer 'Find Your Order' link doesn't appear"**
Check that `app.guestOrderLookup.enabled` is `true` in the config being loaded by the running server. Config changes require a server restart. Verify the correct config file is being used (check `NODE_ENV` and the active environment override).

**"The cookie isn't being set after verification"**
Check that `allowCookies` is enabled. For local dev set `localAllowCookies: true` in the SSR server options. For MRT set `MRT_ALLOW_COOKIES=true`. Without this the `Set-Cookie` header is silently dropped.

**"Shoppers aren't receiving the access code email"**
The email is sent by ECOM via the Business Manager hook `sfcc.app.order.sendOrderAccessCode`. Verify the hook is configured and active in Business Manager. The PWA Kit server only calls the SCAPI endpoint — it does not control email delivery.

**"The access code email arrives but the code is rejected with 404"**
The code has a 15-minute TTL. If the shopper waited too long before entering it, the code has expired. They need to restart the flow. Also check that the clock skew between the MRT server and ECOM does not exceed the TTL.

**"The throttle is rejecting legitimate requests"**
The default `requestCodeThrottle` allows 5 verify attempts per IP per 60-second window. If this is too strict for your traffic, increase `max` or `windowMs` in `config/default.js`. In MRT deployments all requests arrive from the MRT proxy IP, so IP-based throttling affects all shoppers equally — consider setting a higher `max` for MRT-deployed storefronts.
