:loudspeaker: Hey there, Salesforce Commerce Cloud community!

We’re excited to hear your thoughts on your developer experience with PWA Kit and the Composable Storefront generally! Your feedback is incredibly valuable in helping us guide our roadmap and improve our offering.

:clipboard: Take our quick survey here: [Survey](https://forms.gle/bUZNxQ3QKUcrjhV18) 

Feel free to share this survey link with your colleagues, partners, or anyone who has experience with PWA Kit. Your input will help us shape the future of our development tools.

Thank you for being a part of our community and for your continuous support! :raised_hands:

## :warning: Planned API Changes :warning:

### Shopper Context

Starting July 31st 2024, all endpoints in the Shopper context API will require the `siteId` parameter for new customers. This field is marked as optional for backward compatibility and will be changed to mandatory tentatively by January 2025. You can read more about the planned change [here](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-context?meta=Summary) in the notes section.

### Shopper Login (SLAS)

SLAS will soon require new tenants to pass `channel_id` as an argument for retrieving guest access tokens. You can read more about the planned change [here](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas.html#guest-tokens).

Please be aware that existing tenants are on a temporary allow list and will see no immediate disruption to service.  We do ask that all users seek to adhere to the `channel_id` requirement before the end of August to enhance your security posture before the holiday peak season.

### Summary of Changes for PWA Kit v2

To comply with the planned API changes effective July 31st, 2024, you need to update your PWA Kit v2 projects. These changes involve adding the `channel_id` parameter for Shopper Login and optionally scoping your local storage keys and cookie names with the `siteId` prefix if your site uses multisite.

**1. Update `auth.js` to Include `channel_id` in Calls to Shopper Login**

Add the `channel_id` parameter in the appropriate functions for obtaining tokens.

#### Example Changes:
```diff
// In the Auth class, add channel_id to the data in loginWithCredentials method
data.append('channel_id', this._config.parameters.siteId)

// In the refreshToken method, add channel_id to the data
data.append('channel_id', this._config.parameters.siteId)
```

**2. Scope Local Storage Keys and Cookie Names per Site for Multisite Projects**

For customers using multiple site IDs, it is recommended to scope your local storage keys and cookie names per site to avoid conflicts. This ensures that tokens from different sites (e.g., RefArch and RefArchGlobal) are not incorrectly used across sites.

```diff
// Add siteId parameter in LocalStorage and CookieStorage constructors
constructor(siteId, ...args) {
super(args);
if (typeof window === 'undefined') {
throw new Error('LocalStorage is not available in the current environment.');
}
this.siteId = siteId;
}

// Create storage key with siteId prefix
createStorageKey(key) {
return `${this.siteId}_${key}`;
}

// Set item in local storage with siteId prefix
set(key, value) {
window.localStorage.setItem(this.createStorageKey(key), value);
}

// Get item from local storage with siteId prefix
get(key) {
return window.localStorage.getItem(this.createStorageKey(key));
}

// Delete item from local storage with siteId prefix
delete(key) {
window.localStorage.removeItem(this.createStorageKey(key));
}

// Similar changes for CookieStorage
```

Full example of the changes in the `auth.js` file:
https://github.com/SalesforceCommerceCloud/pwa-kit/compare/949b8b3b7...534dab260

<div align="center">

<h1>The Progressive Web App (PWA) Kit</h1>

[![npm](https://img.shields.io/npm/v/pwa-kit-react-sdk.svg)](https://www.npmjs.com/package/pwa-kit-react-sdk)
[![License](https://img.shields.io/github/license/SalesforceCommerceCloud/pwa-kit.svg)](https://github.com/SalesforceCommerceCloud/pwa-kit/blob/master/LICENSE)
[![Checks](https://img.shields.io/github/checks-status/SalesforceCommerceCloud/pwa-kit/develop.svg)](https://github.com/SalesforceCommerceCloud/pwa-kit)
[![npm](https://img.shields.io/npm/dm/pwa-kit-react-sdk.svg)](https://www.npmjs.com/package/pwa-kit-react-sdk)

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

-   Node 14.17.0 or later
-   npm 6.14.4 or later

### Create Your First Project

```bash
npx pwa-kit-create-app
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

See the [Localization README.md](./packages/template-retail-react-app/app/translations/README.md) for important setup instructions for localization.

## ⚠️ License Information

The PWA Kit is licensed under a BSD 3-Clause license. See the [license](./LICENSE) for details.

## ➕ Contribute

Your contributions are welcome! Refer to the [CONTRIBUTING](./CONTRIBUTING.md) guide to get started. If you like `pwa-kit`, consider adding a ⭐ on the [GitHub Repo](https://github.com/SalesforceCommerceCloud/pwa-kit/). It helps other people discover PWA Kit!

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
