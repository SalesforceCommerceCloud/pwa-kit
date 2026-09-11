# app_pwakit_base

B2C Commerce cartridge that delivers transactional emails for PWA Kit storefronts via ISML templates and `dw/net/Mail`.

## What it does

- **Guest Order Lookup (GLO)** — implements the `sfcc.app.order.sendOrderAccessCode` hook. Called by SCAPI's `requestOrderAccessCode` endpoint to send the one-time access code email.
- **Passwordless login, OTP verification, password reset** — exposes a `pwakit-notify` Custom REST API (`c_pwakit_notify` scope) that the PWA Kit SSR server calls after receiving the SLAS callback.

All emails are rendered from ISML templates in `cartridge/templates/default/email/` and delivered via `dw/net/Mail`.

## Installation

### Prerequisites

Install the `sfcc-ci` CLI and configure it with your instance credentials:

```bash
npm install -g sfcc-ci
sfcc-ci auth:login <instance>.sandbox.us01.dx.commercecloud.salesforce.com
```

Or configure via `dw.json` at the repo root:

```json
{
    "hostname": "<instance>.sandbox.us01.dx.commercecloud.salesforce.com",
    "username": "<bm-user@example.com>",
    "password": "<password>",
    "code-version": "<version>"
}
```

---

### First-time setup

**1. Deploy the cartridge**

```bash
cd packages/template-retail-react-app/cartridges
zip -r app_pwakit_base.zip app_pwakit_base/
sfcc-ci code:deploy --instance <instance> --code-version <version> app_pwakit_base.zip
```

**2. Add to cartridge path** (one-time)

```bash
sfcc-ci cartridge:add app_pwakit_base \
  --instance <instance> \
  --position before \
  --target app_storefront_base \
  --siteid <siteId>
```

**3. Import Organization Preferences** (one-time)

```bash
sfcc-ci instance:upload \
  --instance <instance> \
  staticfiles/cartridge/impex/default/meta/system-objecttype-extensions/OrganizationPreferences.xml

sfcc-ci instance:import \
  --instance <instance> \
  OrganizationPreferences.xml
```

This registers `pwakitNotifyEnabled` and `pwakitStorefrontHosts` under **Administration → Global Preferences → Custom Preferences → PWA Kit**.

**4. Activate the code version**

```bash
sfcc-ci code:activate --instance <instance> <version>
```

`code:activate` triggers SFCC's hook and Custom API discovery. There is no need to manually deactivate and reactivate through Business Manager.

---

### Redeploying (subsequent updates)

```bash
zip -r app_pwakit_base.zip app_pwakit_base/
sfcc-ci code:deploy --instance <instance> --code-version <version> app_pwakit_base.zip
sfcc-ci code:activate --instance <instance> <version>
```

---

### Verifying the deployment with Claude Code

If you have the [B2C DX MCP plugin](https://github.com/SalesforceCommerceCloud/b2c-dx-mcp) configured in your Claude Code session, you can verify the deployment after activation:

```
Check that the pwakit-notify Custom REST API is registered on <instance>
```

```
Check that the sfcc.app.order.sendOrderAccessCode hook is active on <instance>
```

The plugin can also tail `pwakit-notify` log output in real time while you trigger a GLO or passwordless flow, making it easier to diagnose misconfigured preferences or template errors.

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
