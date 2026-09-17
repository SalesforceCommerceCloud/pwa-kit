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

```bash
b2c code activate <version> --config packages/template-retail-react-app/dw.json
```

Activation triggers SFCC's hook and Custom API discovery.

---

### Redeploying (subsequent updates)

```bash
npm run deploy:cartridge
b2c code activate <version> --config packages/template-retail-react-app/dw.json
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

## SLAS Admin configuration

The `pwakit-notify` Custom REST API (passwordless login, OTP, password reset emails) is called by the PWA Kit SSR server using a **private SLAS client** token. The SSR server calls `loginGuestUserPrivate` with a client secret to mint a server-side guest token, then uses that token to call the Custom REST API endpoint. SCAPI enforces the `c_pwakit_notify` scope on that token before invoking the endpoint.

**This is not the same as `enablePWAKitPrivateClient`.** That flag controls whether shoppers use a private client for their own auth flows. The `pwakit-notify` token is a separate server-side credential and the two are independent.

Both public and private SLAS client setups are supported:

- **Public client** (`PWA_KIT_SLAS_CLIENT_SECRET` not set): the SSR server mints a guest token via the PKCE guest flow (`loginGuestUser`) using the existing public `clientId`. No secret required; the PKCE authorize + code exchange happens entirely server-side.
- **Private client** (`PWA_KIT_SLAS_CLIENT_SECRET` set): uses `loginGuestUserPrivate` (client_credentials grant) — one fewer round-trip to SLAS on the first call. Prefer this if you already have a private client configured.

> **GLO email is not affected** — the `sendOrderAccessCode` hook is invoked directly by SCAPI and does not use this token at all. If you only need GLO email, you can skip this section entirely.

### 1. Add the scope to your SLAS client

In [Account Manager](https://account.demandware.com) → **API Client**, find the client whose `clientId` matches `config/default.js` → `commerceAPI.parameters.clientId`.

Under **Allowed Scopes**, add: `c_pwakit_notify`

This applies to both public and private clients.

### 2. (Private client only) Set the client secret on the SSR server

If you are using a private client, set `PWA_KIT_SLAS_CLIENT_SECRET` on the MRT environment:

```bash
pwa-kit-dev push --set-env PWA_KIT_SLAS_CLIENT_SECRET=<your-client-secret> ...
```

Or via the MRT Admin UI: **Environments → <env> → Environment Variables**.

If this variable is absent, the SSR server automatically falls back to the public PKCE guest flow.

### 3. Verify

Trigger a passwordless login or password reset flow and confirm the email is delivered. If you see `401` errors in the `pwakit-notify` log, the most common causes are:

- `c_pwakit_notify` not added to the API client's Allowed Scopes in Account Manager
- `PWA_KIT_SLAS_CLIENT_SECRET` set but incorrect (private client path fails, public fallback not used because the variable is present)
- Code version not yet activated after deploying the cartridge

---

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
| `email/guestOrderLookup` | `orderNo`, `accessCode`, `lookupLink` |
| `email/passwordlessLogin` | `magicLink`, `accessCode` (extracted from token in magicLinkPath, may be null) |
| `email/registrationVerification` | `token` |
| `email/passwordReset` | `magicLink` |

Set `pwakitNotifyEnabled` to `false` to prevent the default ISML/`dw/net/Mail` delivery from also firing.
