# app_pwakit_base

B2C Commerce cartridge that delivers transactional emails for PWA Kit storefronts via ISML templates and `dw/net/Mail`.

## What it does

- **Guest Order Lookup (GLO)** — implements the `sfcc.app.order.sendOrderAccessCode` hook. Called by SCAPI's `requestOrderAccessCode` endpoint to send the one-time access code email.
- **Passwordless login, OTP verification, password reset** — exposes a `pwakit-notify` Custom REST API (`c_pwakit_notify` scope) that the PWA Kit SSR server calls after receiving the SLAS callback.

All emails are rendered from ISML templates in `cartridge/templates/default/email/` and delivered via `dw/net/Mail`.

## Installation

### 1. Upload the cartridge

Upload the `app_pwakit_base` directory to WebDAV:

```
https://<instance>.demandware.net/on/demandware.servlet/webdav/Sites/Cartridges/<version>/app_pwakit_base/
```

### 2. Add to cartridge path

In Business Manager: **Administration → Sites → Manage Sites → \<your site\> → Settings**

Add `app_pwakit_base` to the beginning of the cartridge path, before `app_storefront_base`:

```
app_pwakit_base:app_storefront_base:...
```

### 3. Activate the code version

In Business Manager: **Administration → Code Deployment**

Deactivate and reactivate the code version. SFCC only discovers hook registrations and Custom API endpoints at code version activation time — uploading to an already-active version is not sufficient.

### 4. Import Organization Preferences

In Business Manager: **Administration → Site Development → Import & Export**

Import the file at:
```
staticfiles/cartridge/impex/default/meta/system-objecttype-extensions/OrganizationPreferences.xml
```

This registers the `pwakitNotifyEnabled` and `pwakitStorefrontHosts` preferences under **Administration → Global Preferences → Custom Preferences → PWA Kit**.

## Configuration

| Preference | Type | Description |
|---|---|---|
| `pwakitNotifyEnabled` | Boolean | Set to `false` to disable the cartridge's built-in email delivery (e.g. when using a third-party provider). Defaults to `true` when unset. |
| `pwakitStorefrontHosts` | String | Comma-separated list of allowed public-facing storefront hostnames (no protocol, no trailing slash). Example: `my-store.salesforcecommercecloudsites.com`. The first entry is used for server-side magic-link construction (GLO access code, passwordless magic link). Falls back to the B2C instance hostname if unset — this will be incorrect for headless deployments. |

The sender address is read from the **Site Preferences** `customerServiceEmail` custom attribute. If unset, it falls back to `no-reply@<site-https-hostname>`.

### Known limitation — site URL aliases

The magic link path uses `siteId.toLowerCase()` as the URL path segment (e.g. `refarchglobal`). If your PWA Kit storefront defines a `siteAlias` in `config/default.js` (e.g. `RefArchGlobal → global`), the generated link will not match the registered route. Add a CDN-level redirect from `/<siteId-lowercase>/...` to `/<alias>/...` to resolve this, or override the `sendOrderAccessCode` hook with an alias-aware implementation.

## Customizing email delivery

To use a third-party provider (SendGrid, Mailchimp, Postmark, etc.), replace the `sendNotification.send()` call body in `cartridge/scripts/helpers/sendNotification.js` with your provider's SDK or an HTTP service call. The `context` object passed to `send()` contains the template variables for each notification type:

| Template | Context keys |
|---|---|
| `email/gloAccessCode` | `orderNo`, `accessCode`, `magicLink` |
| `email/passwordlessMagicLink` | `magicLink` |
| `email/otpVerification` | `token` |
| `email/passwordResetMagicLink` | `magicLink` |

Set `pwakitNotifyEnabled` to `false` to prevent the default ISML/`dw/net/Mail` delivery from also firing.
