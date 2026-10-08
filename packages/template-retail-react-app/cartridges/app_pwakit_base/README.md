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

This registers `pwakitNotifyEnabled` under **Administration → Global Preferences → Custom Preferences → PWA Kit**, and `pwakitStorefrontHost` under **Merchant Tools → Custom Preferences → pwakit** (site-level).

**4. Configure `pwakitStorefrontHost` per site** (one-time, via Business Manager)

In Business Manager → **Merchant Tools → Custom Preferences → pwakit**, set `Storefront Host` to the public-facing hostname of your storefront (no protocol, no trailing slash). Example: `my-store.salesforcecommercecloudsites.com`. This is used to construct magic-link and order-lookup URLs in transactional emails.

If left unset, magic-link CTA buttons are omitted from emails — the email is still delivered with an inline access code where applicable.

**5. Activate the code version**

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

A dedicated SLAS private client scoped only to `c_pwakit_notify` is required. Using the shopper client would expose that scope to browser tokens, which this setup is specifically designed to prevent.

> **GLO email is not affected** — the `sendOrderAccessCode` hook is invoked directly by SCAPI and does not use this token at all. If you only need GLO email, you can skip this section entirely.

### 1. Register a dedicated notify SLAS client

In [SLAS Admin](https://account.demandware.com/dwsso/oauth2/authorize) (separate from Account Manager), create a new private client with:

- **Private client**: yes (`isPrivateClient: true`)
- **Default Scopes**: `c_pwakit_notify` only — do not include shopper scopes
- **Channels**: add every site ID this storefront serves, or the guest token request will fail
- **Client Secret**: generate and save a secret; you will need it in step 2

Note the new client's ID. Do **not** add `c_pwakit_notify` to your existing shopper client — if that scope is present on the shopper client, browser tokens could carry it.

### 2. Configure the client ID and secret

Set the client ID in `config/default.js` → `commerceAPI.parameters.notifyClientId`:

```js
commerceAPI: {
    parameters: {
        clientId: '<your-shopper-client-id>',
        notifyClientId: '<your-notify-client-id>',
        // ...
    }
}
```

Set the client secret as an environment variable on the MRT environment:

```bash
pwa-kit-dev push --set-env PWA_KIT_NOTIFY_SLAS_CLIENT_SECRET=<your-notify-client-secret> ...
```

Or via the MRT Admin UI: **Environments → <env> → Environment Variables**.

If either value is missing, the callback routes will return 500 and log the missing-config error on first use — there is no fallback to the shopper client.

### 3. Verify

Trigger a passwordless login or password reset flow and confirm the email is delivered. If you see `401` errors in the `pwakit-notify` log, the most common causes are:

- `c_pwakit_notify` not added to the notify client's Default Scopes in Account Manager
- `commerceAPI.parameters.notifyClientId` in config does not match the registered client
- `PWA_KIT_NOTIFY_SLAS_CLIENT_SECRET` incorrect or not yet deployed
- Code version not yet activated after deploying the cartridge

---

## Configuration

| Preference | Type | Description |
|---|---|---|
| `pwakitNotifyEnabled` | Boolean (org) | Set to `false` to disable the cartridge's built-in email delivery (e.g. when using a third-party provider). Defaults to `true` when unset. |
| `pwakitStorefrontHost` | String (site) | Public-facing hostname of this storefront site (no protocol, no trailing slash). Example: `my-store.salesforcecommercecloudsites.com`. Used to construct magic-link and order-lookup URLs in transactional emails. Configure once per site in **Merchant Tools → Custom Preferences → pwakit**. If unset, magic-link CTA buttons are omitted — the email is still delivered with an inline access code where applicable. |

The sender address is read from the **Site Preferences** `customerServiceEmail` custom attribute. If unset, it falls back to `no-reply@<site-https-hostname>`.

### Customer existence validation

The `pwakit-notify` endpoint validates the recipient against B2C's customer directory differently depending on the notification type:

| Type | Customer check | Reason |
|---|---|---|
| `passwordless-magic-link` | Yes — silently succeeds if not found | Passwordless login requires a pre-existing account. Silently succeeding (no email sent, 200 returned) prevents email enumeration. |
| `password-reset` | Yes — silently succeeds if not found | Same as above. |
| `otp` | Yes — silently succeeds if not found | SLAS creates the B2C customer profile at authorize time, before the callback fires. Requiring the profile to exist prevents a crafted payload from sending verification emails to arbitrary addresses. Verified/unverified state is not checked — that is managed by SLAS and is not reliably exposed through the B2C scripting API. |

The silent-success behaviour for `passwordless-magic-link` and `password-reset` is intentional — the storefront flow completes normally and the shopper receives no indication of whether their email is registered. If you need to audit skipped sends, filter the `pwakit-notify` log for `skipping send`.

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
