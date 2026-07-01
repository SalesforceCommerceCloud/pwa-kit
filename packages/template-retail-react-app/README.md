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

## Configuring item-level returns (OMS)

The order detail page (`app/pages/account/order-detail.jsx`) lets registered shoppers start an item-level return when the order is managed by an Order Management System (OMS). The storefront UI is driven entirely by data the OMS returns on the order — there is no storefront-side configuration to enable returns beyond having OMS-managed orders.

### Return eligibility (OMS-driven)

Returnability is decided by the OMS, not the storefront. An order carries an `omsData` envelope, and each `productItem` carries its own `omsData` with a per-item `quantityAvailableToReturn`. An item is offered for return when `quantityAvailableToReturn > 0` (see `getReturnableItems` in `app/utils/return-utils.js`).

- Orders **without** an `omsData` envelope (plain ECOM orders) never show the return CTA.
- The merchant controls which order/item states are returnable by configuring the OMS upstream; the OMS surfaces the result to the storefront as `quantityAvailableToReturn`. There is **no** storefront config key (such as a status allowlist) — the client trusts the OMS-computed quantity.
- The authoritative refusal is server-side: `POST .../actions/oms-return-order` returns `409` when the order can no longer be returned, even if a stale quantity briefly suggested otherwise.

### Return reason codes

The return modal populates its per-item "reason" dropdown from the OMS metadata API, read via `useOmsMetaData().data.returnReasonCodes`. Each entry is `{reason, default}`:

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
