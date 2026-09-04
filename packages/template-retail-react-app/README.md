:loudspeaker: Hey there, Salesforce Commerce Cloud community!

We’re excited to hear your thoughts on your developer experience with PWA Kit and the Composable Storefront generally! Your feedback is incredibly valuable in helping us guide our roadmap and improve our offering.

:clipboard: Take our quick survey here: [Survey](https://forms.gle/bUZNxQ3QKUcrjhV18) 

Feel free to share this survey link with your colleagues, partners, or anyone who has experience with PWA Kit. Your input will help us shape the future of our development tools.

Thank you for being a part of our community and for your continuous support! :raised_hands:

# The Retail React App

A project template that includes an isomorphic JavaScript storefront and [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) built using [React](https://reactjs.org/) and [Express](https://expressjs.com/). It uses a modern headless architecture that enables developers to decouple front-end code from back-end systems. It leverages popular open-source libraries in the React ecosystem, such as [Chakra UI](https://chakra-ui.com/) components, [Emotion](https://emotion.sh/docs/introduction) (CSS-in-JS), [Webpack](https://webpack.js.org/), and many more.

Developers don’t have to worry about the underlying infrastructure, whether they’re developing their app locally, deploying it to a [Managed Runtime](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/mrt-overview.html) environment, or testing the app live.

## Requirements

-   Node 16.11 or later
-   npm 8 or later

## Get Started

To start your web server for local development, run the following command in your project directory:

```bash
npm start
```

Now that the development server is running, you can open a browser and preview your commerce app:

-   Go to http://localhost:3000/

## Localization

See the [Localization README.md](./translations/README.md) for important setup instructions for localization.

## Configuration Files

The Retail React App's configuration files are located in the `app/config` folder. For more details, see [Configuration Files](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/configuration-options.html) in the documentation.

### MRT Data Store (local development)

You can resolve **MRT Data Store** custom preferences during SSR without DynamoDB by using the in-memory provider from **`@salesforce/pwa-kit-dev`** (loaded by `@salesforce/pwa-kit-runtime` when you are **not** in a full Managed Runtime process).

- **Turn the feature on:** set **`app.mrtDataStore.enabled`** in `config/default.js`, and/or **`PWAKIT_MRT_DATA_STORE_ENABLED=true`** (use `false` to force off without editing files).
- **Use local defaults:** set **`MRT_DATA_STORE_DEFAULTS`** to a JSON object whose keys are **full DAL keys** and values are plain objects. For example, site preferences use `<siteId>-custom-site-preferences` (such as `RefArch-custom-site-preferences`); global preferences use **`custom-global-preferences`**.
- **Use the local provider, not DynamoDB:** in development, keep **`AWS_REGION`**, **`MOBIFY_PROPERTY_ID`**, and **`DEPLOY_TARGET`** unset for the dev server. If all three are set, the runtime uses the **real** Data Store instead of your defaults map.
- **Optional:** **`MRT_DATA_STORE_WARN_ON_MISSING=false`** silences console warnings when a key is missing.

```bash
export PWAKIT_MRT_DATA_STORE_ENABLED=true
export MRT_DATA_STORE_DEFAULTS='{"RefArch-custom-site-preferences":{},"custom-global-preferences":{}}'
npm start
```

See the comments above **`mrtDataStore`** in `config/default.js` for related env vars.

## Running the Commerce Client shopping agent widget (local development)

The storefront's shopper agent (`app/components/shopper-agent/index.jsx`) supports two providers: **MIAW** (Salesforce Embedded Messaging, the default) and the **Commerce Client** widget (`provider: 'commerce-client'`). The Commerce Client provider loads the Cimulate messaging UMD bundle (`messaging.umd.js`) and injects a shopping-agent panel via `window.CimulateMessaging.injectMessagingWidget`.

Everything is driven by the `COMMERCE_AGENT_SETTINGS` environment variable — a JSON blob loaded from `.env` by the `npm start` script and parsed in `config/default.js`. Defaults for every field live in `app/utils/config-utils.js`.

### 1. Set up `.env`

The `start` script auto-loads `.env` from the package root (`set -a; . ./.env`). Create `packages/template-retail-react-app/.env` if you don't have one. When `useSLASPrivateClient: true` in `app/ssr.js` (the default), also set your SLAS private client secret or the dev server won't start:

```bash
PWA_KIT_SLAS_CLIENT_SECRET='your-slas-private-client-secret'
```

### 2. Configure the Commerce Client provider

Add `COMMERCE_AGENT_SETTINGS` to `.env`. The value is JSON wrapped in single quotes (double-quoted keys/values, no trailing commas, and no `#` comments between the braces). A minimal working config:

```bash
COMMERCE_AGENT_SETTINGS='{
  "enabled": "true",
  "provider": "commerce-client",
  "scrt2Url": "https://<your-org>.my.salesforce-scrt.com",
  "salesforceOrgId": "00D...",
  "cc_esDeveloperName": "ShopperAgentCommerceClient",
  "cc_cdnVersion": "1.23.0",
  "cc_showFab": "true"
}'
```

Required fields for `provider: "commerce-client"` (validated by `validateCommerceClientAgentSettings` in `app/utils/shopper-agent-utils.js`):

| Field                                                    | Purpose                                                                 |
| ------------------------------------------------------- | ---------------------------------------------------------------------- |
| `enabled: "true"`                                       | Master on/off; the widget only mounts when `"true"`.                    |
| `provider: "commerce-client"`                           | Selects the Commerce Client provider (default is `"miaw"`).            |
| `scrt2Url`                                               | Your SCRT2 instance URL (`https://….salesforce-scrt.com`).             |
| `salesforceOrgId`                                        | Salesforce org id, forwarded to the widget as `orgId`.                 |
| `cc_esDeveloperName`                                     | Embedded Service developer name (falls back to `embeddedServiceName`). |
| `cc_cdnVersion` **or** `commerceClientScriptSourceUrl`  | Where to load `messaging.umd.js` from (see step 3).                    |

### 3. Choose where the bundle loads from

- **Cimulate CDN (common):** set `cc_cdnVersion` (e.g. `"1.23.0"`). It resolves to `https://cdn.search.cimulate.ai/copilot-widget/<version>/messaging.umd.js`.
- **Local or self-hosted bundle:** set `commerceClientScriptSourceUrl` to an explicit URL (it wins over `cc_cdnVersion`). Use this to test an unmerged widget build:

```bash
  "commerceClientScriptSourceUrl": "http://localhost:5050/messaging.umd.js",
```

The bundle URL must be served from a trusted domain — `cimulate.ai`, `*.cimulate.ai`, or `*.sfcc-store-internal.net` — or from `localhost` / `127.0.0.1` when not running in production (see `validateCommerceClientDomain`). The Content-Security-Policy in `app/ssr.js` already allows `*.cimulate.ai`, `*.sfcc-store-internal.net`, and `http://localhost:5050` in `script-src`. If you serve the bundle from a different host or port, add it to `script-src` in `app/ssr.js` or the browser will block it.

### 4. Start the app

```bash
npm start
```

Open http://localhost:3000/. The widget mounts on the client once the basket finishes loading. With `cc_showFab: "true"` a floating action button appears in the configured corner; you can also open the agent from the header button when `enableAgentFromHeader: "true"`.

### Useful optional settings

Every field is documented inline in the `commerceAgent` block of `config/default.js` (the committed source of truth), with the full default map in `app/utils/config-utils.js` and per-field descriptions in the `CommerceClientAgentWindow` JSDoc in `app/components/shopper-agent/index.jsx`. Handy optional ones for local dev:

- `cc_isDevelopment: "true"` — logs widget events to the console.
- `cc_isOpen: "true"` — opens the panel automatically on load.
- `cc_widgetPosition: "bottom-left" | "bottom-right"` — corner to dock to.
- `cc_pagePush: "true"` — shifts page content aside for the panel instead of overlaying it (desktop, full-height dialog only).
- `cc_headerText`, `cc_logoUrl`, `cc_theme`, `cc_searchConfig` — branding and search-input customization.

### Troubleshooting

If the widget doesn't appear, open the browser console:

- `Invalid json format` — `COMMERCE_AGENT_SETTINGS` isn't valid JSON (check quotes / trailing commas). Restart the dev server after editing `.env`.
- `Invalid Commerce Client agent settings…` — a required field from step 2 is missing or empty.
- `…must be served from a trusted cimulate.ai or sfcc-store-internal.net domain` — the resolved bundle URL isn't allowed (see step 3).
- The bundle is blocked by CSP — add its host to `script-src` in `app/ssr.js`.

## Configuring item-level returns (OMS)

The order detail page (`app/pages/account/order-detail.jsx`) lets registered shoppers start an item-level return when the order is managed by an Order Management System (OMS). The storefront UI is driven entirely by data the OMS returns on the order — there is no storefront-side configuration to enable returns beyond having OMS-managed orders.

### Return eligibility (OMS-driven)

Returnability is decided by the OMS, not the storefront. An order carries an `omsData` envelope, and each `productItem` carries its own `omsData` with a per-item `quantityAvailableToReturn`. An item is offered for return when `quantityAvailableToReturn > 0` (see `getReturnableItems` in `app/utils/return-utils.js`).

- Orders **without** an `omsData` envelope (plain ECOM orders) never show the return CTA.
- The merchant controls which order/item states are returnable by configuring the OMS upstream; the OMS surfaces the result to the storefront as `quantityAvailableToReturn`. There is **no** storefront config key (such as a status allowlist) — the client trusts the OMS-computed quantity.
- The authoritative refusal is server-side: `POST .../actions/oms-return-order` returns `409` when the order can no longer be returned, even if a stale quantity briefly suggested otherwise.

### Return reason codes

The return modal populates its per-item "reason" dropdown from the OMS metadata API. The order-detail page fetches this once via `useOmsMetaData().data.returnReasonCodes` and forwards it into the modal as the `reasonCodes` prop (mirroring how it forwards `cancelReasonCodes` to `CancelOrderModal`). Each entry is `{reason, default}`:

- Merchants define the available reasons (and mark exactly one as the default) **in the OMS**; the storefront renders them as-is.
- When the shopper keeps the default reason, the submitted payload **omits** `reason` so the server applies its own default (see `buildReturnProductItems`). A non-default selection is sent as `reason`.
- A reason is required to proceed: a checked item validates only once it has a reason code (see `isSelectionValid`). A newly checked row is pre-filled with the reason marked `default` when one exists, so configuring a default in the OMS lets shoppers complete a return in one click; without a default they must pick a reason manually before continuing. Configure at least one reason code in the OMS.

### Error-code contract

On submit failure, `classifyReturnError` (`app/utils/return-error-utils.js`) maps the response to a shopper-facing outcome. OMS returns a discriminator in the `400` body's `errorCode`:

| HTTP status / `errorCode`   | Classified kind    | Shopper-facing behavior                                                        |
| --------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| `400 InvalidReasonCode`     | `invalidReason`    | Drops to select view; reasons refetched, stale reason cleared, banner shown.   |
| `400 UnknownProductItemIds` | `unknownItems`     | Drops to select view; order refetched and selection reconciled; banner shown.  |
| `400 ReturnQuantityExceeded`| `quantityExceeded` | Drops to select view; order refetched and quantities clamped; banner shown.    |
| `400` (other / missing code)| `unknown`          | Inline retry banner on the review view; Submit stays enabled.                  |
| `404`                       | `notFound`         | Terminal in-modal banner; Submit disabled (close the modal to dismiss).        |
| `409`                       | `conflict`         | Terminal in-modal "reach out to the merchant" banner; Submit disabled.         |
| no HTTP response            | `network`          | Inline banner on the review view; Submit stays enabled to retry.               |

## Documentation

The full documentation for PWA Kit and Managed Runtime is hosted on the [Salesforce Developers](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/overview) portal.

### Useful Links:

-   [Get Started](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html)
-   [Skills for Success](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/skills-for-success.html)
-   [Set Up API Access](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/setting-up-api-access.html)
-   [Configuration Options](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/configuration-options.html)
-   [Proxy Requests](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/proxying-requests.html)
-   [Push and Deploy Bundles](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html)
-   [The Retail React App](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/retail-react-app.html)
-   [Rendering](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/rendering.html)
-   [Routing](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/routing.html)
-   [Phased Headless Rollouts](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/phased-headless-rollouts.html)
-   [Launch Your Storefront](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/launching-your-storefront.html)
