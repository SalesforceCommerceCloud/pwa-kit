# app_pwakit_base

B2C Commerce cartridge that delivers transactional emails for PWA Kit storefronts via ISML templates and `dw/net/Mail`.

## What it does

- **Guest Order Lookup (GLO)** — implements the `sfcc.app.order.sendOrderAccessCode` hook. Called by SCAPI's `requestOrderAccessCode` endpoint to send the one-time access code email.
- **Passwordless login, OTP verification, password reset** — exposes a `pwakit-notify` Custom REST API (`c_pwakit_notify` scope) that the PWA Kit SSR server calls after receiving the SLAS callback.

All emails are rendered from ISML templates in `cartridge/templates/default/email/` and delivered via `dw/net/Mail`.

## Installation

### Prerequisites

#### SLAS allowed redirect URIs

Each PWA Kit SSR callback route that uses `mode: 'callback'` must be pre-registered in your SLAS client's **Allowed Redirect URIs** (Admin Center → SLAS → your client → Redirect URIs). SLAS silently rejects callback flows if the URI is not on the allowlist.

The default callback URIs that must be registered (relative to your storefront origin):

| Flow | Default URI | Config key |
|---|---|---|
| Passwordless login | `/passwordless-login-callback` | `app.login.passwordless.callbackURI` |
| Password reset | `/reset-password-callback` | `app.login.resetPassword.callbackURI` |
| Registration verification | `/registration-verification-callback` | `app.login.registrationVerification.callbackURI` |

Each URI can be customized in `config/default.js`. Update the SLAS allowlist whenever a URI changes.

---

Install the `b2c` CLI:

```bash
npm install -g @salesforce/b2c-cli
```

Create a **flat** `dw.json` in `packages/template-retail-react-app/`:

```json
{
    "hostname": "<instance>.demandware.net",
    "username": "<bm-user@example.com>",
    "password": "<password>",
    "code-version": "<version>",
    "account-manager-host": "<account-manager-host>",
    "client-id": "<client-id>",
    "client-secret": "<client-secret>"
}
```

> **Note:** `b2c code deploy` requires the flat single-object format for WebDAV authentication. The multi-config `configs` array format works for `b2c setup inspect` but not for actual deployments (known issue in `b2c-cli` ≤ 1.23.1).

Verify the CLI resolves your instance correctly:

```bash
b2c setup inspect
```

---

### First-time setup

**1. Deploy the cartridge**

```bash
npm run deploy:cartridge
```

**2. Add to cartridge path** (one-time, via Business Manager)

In Business Manager → **Administration → Sites → Manage Sites → <site> → Settings**, add `app_pwakit_base` to the cartridge path before `app_storefront_base`.

**3. Import Organization Preferences** (one-time)

```bash
sfcc-ci meta:import \
  --instance <instance> \
  --meta-path cartridges/app_pwakit_base/staticfiles/cartridge/impex/default/meta \
  --directory meta
```

This registers `pwakitNotifyEnabled` and `pwakitStorefrontHosts` under **Administration → Global Preferences → Custom Preferences → PWA Kit**.

**4. Activate the code version**

The `deploy:cartridge` script uses `--reload`, which handles activation automatically. No separate activation step is needed after the first deploy.

---

### Redeploying (subsequent updates)

```bash
npm run deploy:cartridge
```

The `deploy:cartridge` script uses `--reload`, which deactivates and re-activates the code version in one step. SFCC rescans for Custom REST APIs and hooks on every (re-)activation, so a separate `b2c code activate` call is not needed.

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

## SLAS Admin configuration

The `pwakit-notify` Custom REST API (passwordless login, OTP, password reset emails) is called by the PWA Kit SSR server using a SLAS guest token that carries the `c_pwakit_notify` scope. SCAPI enforces this scope before invoking the endpoint.

**This is not the same as `enablePWAKitPrivateClient`.** That flag controls whether shoppers use a private client for their own auth flows. The `pwakit-notify` token is a separate server-side credential and the two are independent.

> **GLO email is not affected** — the `sendOrderAccessCode` hook is invoked directly by SCAPI and does not use this token at all. If you only need GLO email, you can skip this section entirely.

### Recommended: dedicated private SLAS client (closes open relay risk)

If you add `c_pwakit_notify` to the default scopes of the **same public storefront client** that browsers use, every guest token issued by that client — including tokens minted by anonymous browser visitors — will carry the scope. An attacker who obtains a guest token could then call the notify endpoint directly and send merchant-branded emails to arbitrary addresses.

**To prevent this**, configure a dedicated private SLAS API client exclusively for server-side use:

1. In [Account Manager](https://account.demandware.com) → **API Client**, create a new client (or use an existing private client). Add `c_pwakit_notify` to this client's **default scopes**. Do **not** add it to your main public storefront client.
2. Set `PWA_KIT_SLAS_CLIENT_SECRET` on the MRT environment to this client's secret:

   ```bash
   pwa-kit-dev push --set-env PWA_KIT_SLAS_CLIENT_SECRET=<your-client-secret> ...
   ```

   Or via the MRT Admin UI: **Environments → <env> → Environment Variables**.

3. Set `commerceAPI.notifyClientId` in `config/default.js` to this dedicated client's ID:

   ```js
   module.exports = {
     app: {
       commerceAPI: {
         parameters: { clientId: '<your-public-storefront-client-id>', ... },
         notifyClientId: '<your-dedicated-notify-client-id>'
       }
     }
   }
   ```

   When `notifyClientId` is set, the SSR server uses it (with `PWA_KIT_SLAS_CLIENT_SECRET`) to mint the notify token, keeping the scope off all browser guest tokens.

### Alternative: same client, public flow (simpler but has open relay risk)

If you accept the open relay risk described above, you can use the same public storefront client without a secret. No additional config is required — just add `c_pwakit_notify` to that client's default scopes.

- **Public client** (`PWA_KIT_SLAS_CLIENT_SECRET` not set, `notifyClientId` not set): the SSR server mints a guest token via the PKCE guest flow using the existing public `clientId`. No secret required, but every guest token will carry the scope.
- **Private client, same ID** (`PWA_KIT_SLAS_CLIENT_SECRET` set, `notifyClientId` not set): uses `loginGuestUserPrivate` (client_credentials grant) for the notify token, but the public PKCE flow for the same client still issues tokens with the scope.

### Verify

Trigger a passwordless login or password reset flow and confirm the email is delivered. If you see `401` errors in the `pwakit-notify` log, the most common causes are:

- `c_pwakit_notify` not added to the API client's Allowed Scopes in Account Manager
- `PWA_KIT_SLAS_CLIENT_SECRET` set but incorrect (private client path fails, public fallback not used because the variable is present)
- Code version not yet activated after deploying the cartridge

---

## Configuration

| Preference | Type | Description |
|---|---|---|
| `pwakitNotifyEnabled` | Boolean | Set to `false` to disable the cartridge's built-in email delivery (e.g. when using a third-party provider). Defaults to `true` when unset. |
| `pwakitStorefrontHosts` | String | Comma-separated list of allowed public-facing storefront hostnames (no protocol, no trailing slash). Example: `my-store.salesforcecommercecloudsites.com`. The first entry is used for server-side magic-link construction (GLO access code, passwordless magic link). If unset (or if the caller-supplied host is not in the list), magic-link CTA buttons are omitted from the email — the email is still delivered with an inline access code where applicable. |

The sender address is read from the **Site Preferences** `customerServiceEmail` custom attribute. If unset, it falls back to `no-reply@<site-https-hostname>`.

### Known limitation — site URL aliases

The magic link path uses `siteId.toLowerCase()` as the URL path segment (e.g. `refarchglobal`). If your PWA Kit storefront defines a `siteAlias` in `config/default.js` (e.g. `RefArchGlobal → global`), the generated link will not match the registered route. Add a CDN-level redirect from `/<siteId-lowercase>/...` to `/<alias>/...` to resolve this, or override the `sendOrderAccessCode` hook with an alias-aware implementation.

## Customizing email delivery

To use a third-party provider (SendGrid, Mailchimp, Postmark, etc.), replace the `sendNotification.send()` call body in `cartridge/scripts/helpers/sendNotification.js` with your provider's SDK or an HTTP service call. The `context` object passed to `send()` contains the template variables for each notification type:

| Template | Context keys |
|---|---|
| `email/guestOrderLookup` | `orderNo`, `accessCode`, `lookupLink` |
| `email/passwordlessLogin` | `magicLink`, `accessCode` (extracted from token in magicLinkPath, may be null) |
| `email/registrationVerification` | `token` |
| `email/passwordReset` | `magicLink` |

Set `pwakitNotifyEnabled` to `false` to prevent the default ISML/`dw/net/Mail` delivery from also firing.
