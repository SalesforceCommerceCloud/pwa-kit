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
