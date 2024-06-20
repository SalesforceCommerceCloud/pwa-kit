<div align="center">

<h1>The Progressive Web App (PWA) Kit</h1>

[![npm](https://img.shields.io/npm/v/@salesforce/pwa-kit-react-sdk.svg)](https://www.npmjs.com/package/@salesforce/pwa-kit-react-sdk)
[![License](https://img.shields.io/github/license/SalesforceCommerceCloud/pwa-kit.svg)](https://github.com/SalesforceCommerceCloud/pwa-kit/blob/master/LICENSE)
[![Checks](https://img.shields.io/github/checks-status/SalesforceCommerceCloud/pwa-kit/develop.svg)](https://github.com/SalesforceCommerceCloud/pwa-kit)
[![npm](https://img.shields.io/npm/dm/@salesforce/pwa-kit-react-sdk.svg)](https://www.npmjs.com/package/@salesforce/pwa-kit-react-sdk)

</div>

<div align="center">

📖 [Read Docs](https://sfdc.co/pwa-kit) |
🏖️ [View Demo](https://pwa-kit.mobify-storefront.com/) |
🚀 [Deploy](https://runtime.commercecloud.com/) |
➕ [Contribute](https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/CONTRIBUTING.md)
<br /><br />
The PWA Kit is a storefront technology for headless commerce using Salesforce Commerce APIs and React. It provides front-end developers with a more flexible and agile approach to build and maintain modern shopping experiences.
<br/><br/>
<img alt="pwa-kit banner" src="https://raw.githubusercontent.com/SalesforceCommerceCloud/pwa-kit/develop/packages/template-retail-react-app/app/static/img/hero.png" style="width: 700px; height:auto;">

</div>

---

## 🏄 Get Started

### Requirements

-   Node 18 or later
-   npm 9 or later

### Create Your First Project

```bash
npx @salesforce/pwa-kit-create-app
```

Enter your [sandbox configuration](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html#new-project).

### Run the Project Locally

```bash
npm start
```

### Deploy to Managed Runtime

```
npm run push -- -m "Message to help you recognize this bundle"
```

**Important**: Access to the [Runtime Admin](https://runtime.commercecloud.com/) application is required to deploy bundles. To learn more, read our guide to [Push and Deploy Bundles](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html).

## 🌍 Localization

See the [Localization README.md](./packages/template-retail-react-app/translations/README.md) for important setup instructions for localization.

## ⚠️ License Information

The PWA Kit is licensed under a BSD 3-Clause license. See the [license](./LICENSE) for details.

## ➕ Contribute

Your contributions are welcome! Refer to the [CONTRIBUTING](./CONTRIBUTING.md) guide to get started. If you like `pwa-kit`, consider adding a ⭐ on the [GitHub Repo](https://github.com/SalesforceCommerceCloud/pwa-kit/). It helps other people discover PWA Kit!

## 🛠️ Nightly Builds

⚠️ PWA Kit releases nightly builds on a nightly cadence for better visibility about upcoming features and a chance for implementers to test code integrations via a "preview" release. These builds are untested and unsupported. Use at your own risk!
Nightly builds carry none of our guarantees associated with well-tested software. **Do not use these builds in production**.
Some feature included in the nightly builds may not be included in final PWA Kit releases.
These unreleased builds may not even load, may have undocumented features, known defects, and any number of other issues.
They are intended for use by developers and others wishing to get early access to planned PWA Kit features.

## 📖 Documentation

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

## 🔮 Forward-Looking Statements

This repository may contain forward-looking statements that involve risks, uncertainties, and assumptions. For more information, see [STATEMENTS](STATEMENTS.md)
