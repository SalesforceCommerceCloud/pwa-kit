# API Overview

With the Shopper Context API, you can set any context information as a key/value pair and use it to retrieve personalized promotions, payment methods, and shipping methods. The context information that is set is evaluated against the customer group definitions to determine a customer group (shopper segment) and then used to activate the experiences that are associated with a particular segment, such as promotions.

You can also get personalized API responses triggered by shopper context from the [Open Commerce API](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/OCAPI/current/usage/OpenCommerceAPI.html) (OCAPI). Support for both the B2C Commerce API and OCAPI allows shopper context to be used in hybrid deployments.

**Note**: To extend the context set for a shopper for more than 7 days, consider refreshing it by creating a new context. As a best practice, refresh your contexts periodically to ensure that the right personalized experience is rendered for your shoppers.

**Important:** For detailed usage information, see the [Shopper Context guides](https://developer.salesforce.com/docs/commerce/commerce-api/guide/shopper-context-api.html).

To use the Shopper Context API, you must:

- Get a JSON Web Token (JWT) for the Shopper Login and API Access Service (SLAS).
- Add `sfcc.shopper-context.rw` to the scopes configuration for the SLAS API client.

For more information, see [Authorization for Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-shopper-apis.html) in the Get Started guides.

**Warning**: As with all APIs, never store access tokens in the browser because this creates a security vulnerability.
