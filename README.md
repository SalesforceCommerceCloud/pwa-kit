# commerce-sdk-isomorphic

[![CircleCI][circleci-image]][circleci-url]

The Salesforce Commerce SDK Isomorphic allows easy interaction with the Salesforce B2C Commerce platform Shopper APIs through a lightweight SDK that works both on browsers and NodeJS applications. For a more robust SDK, which includes our B2C Data APIS and Shopper APIs, see [our Node.js Commerce SDK](https://github.com/SalesforceCommerceCloud/commerce-sdk).

## Getting Started

### Requirements

- Node `^12.x`, `^14.x`, or `^16.x`

### Installation

```bash
npm install commerce-sdk-isomorphic
```

### Usage

> **Note:** These are required parameters.

| Parameter      | Description                                                                |
| -------------- | :------------------------------------------------------------------------- |
| clientId       | ID of the client account created with Salesforce Commerce.                 |
| organizationId | The unique identifier for your Salesforce identity.                        |
| shortCode      | Region-specific merchant ID.                                               |
| siteId         | Name of the site to access data from, for example, RefArch or SiteGenesis. |

```javascript
/**
 * Configure required parameters
 *
 * To learn more about the parameters please refer to https://developer.salesforce.com/docs/commerce/commerce-api/guide/get-started.html
 */
import {helpers, ShopperLogin, ShopperSearch} from 'commerce-sdk-isomorphic';

// Create a configuration to use when creating API clients
const config = {
  proxy: 'https://localhost:3000', // Routes API calls through a proxy when set
  headers: {},
  parameters: {
    clientId: '<your-client-id>',
    organizationId: '<your-org-id>',
    shortCode: '<your-short-code>',
    siteId: '<your-site-id>',
  },
  throwOnBadResponse: true,
};

const shopperLogin = new ShopperLogin(config);
// Execute Public Client OAuth with PKCE to acquire guest tokens
const {access_token, refresh_token} = await helpers.loginGuestUser(
  shopperLogin,
  {redirectURI: `${config.proxy}/callback`} // Callback URL must be configured in SLAS Admin
);

const shopperSearch = new ShopperSearch({
  ...config,
  headers: {authorization: `Bearer ${access_token}`},
});

const searchResult = await shopperSearch.productSearch({
  parameters: {q: 'shirt'},
});
```

#### CORS

The Salesforce Commerce API (SCAPI) does not support CORS, so a proxy must be used to be able to use the SDK. Code example on SDK usage with a proxy can be seen above.

### Advanced options

Commerce SDK Isomorphic supports Fetch API options for [node-fetch](https://github.com/node-fetch/node-fetch/1#api) on server and [whatwg-fetch](https://github.github.io/fetch/) on browser with a simple configuration.
This sample code shows how to configure HTTP timeout and agent options.

```javascript
/**
 * Configure advanced timeout and agent parameters
 *
 * To learn more about the parameters please refer to the [Salesforce Developer Center](https://developer.salesforce.com/docs/commerce/commerce-api).
 */
// Create a configuration to use when creating API clients
const https = require('https');

const config = {
  proxy: 'https://localhost:3000',
  headers: {},
  parameters: {
    clientId: '<your-client-id>',
    organizationId: '<your-org-id>',
    shortCode: '<your-short-code>',
    siteId: '<your-site-id>',
  },
  fetchOptions: {
    timeout: 2000, //request times out after 2 seconds
    agent: new https.agent({
      // a custom http agent
      keepAlive: true,
    }),
  },
};
```

### Additional Config Settings

_headers:_ A collection of key/value string pairs representing additional headers to include with API requests.

_throwOnBadResponse:_ Default value is false. When set to true, the SDK throws an Error on responses with statuses that are not 2xx or 304.

### Public Client Shopper Login helpers

A collection of helper functions are available in this SDK to simplify [Public
Client Shopper Login OAuth
flows](https://developer.salesforce.com/docs/commerce/commerce-api/references?meta=shopper-login:Summary). See sample code above for guest login.

## License Information

The Commerce SDK Isomorphic is licensed under BSD-3-Clause license. See the [license](./LICENSE.txt) for details.

<!-- Markdown link & img dfn's -->

[circleci-image]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-isomorphic.svg?style=svg&circle-token=379eaa6f00e0840e10dd80585b2b045d02a8f3b7
[circleci-url]: https://circleci.com/gh/SalesforceCommerceCloud/commerce-sdk-isomorphic
