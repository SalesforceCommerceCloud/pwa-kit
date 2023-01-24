# API Overview

The Shopper Search API enables you to implement search functionality that lets shoppers search for products using keywords and refinement. The search results can be products or suggestions based on the endpoint you choose in the API.

## Authentication & Authorization

The client requesting the API must have access to the product search and search suggestion resource.
The Shopper Search API requires a JWT acquired via the Shopper Customers endpoint:

```
https://{shortCode}.api.commercecloud.salesforce.com/customer/shopper-customers/v1/organizations/{organizationId}/customers/actions/login .
```

## Use Cases

### Provide Search Suggestions

Use the Shopper Search API to provide search suggestions as a shopper searches.

For example, a developer who is building a shopping app using the Salesforce Commerce API would like to provide product, brand, and category suggestions. When a shopper types in a search phrase that exceeds a definable minimum length and the GET Search Suggestion endpoint is requested, the platform delivers a set of suggestions with products (name, ID), brands (name), and categories (name, ID). Shoppers can reach their desired search results more quickly using the suggested completion and correction.

### Provide Search Results

Use the Shopper Search API to gather product results for a shoppers search query.

For example, a developer who is building a shopping app using the Salesforce Commerce API would like to implement a product search functionality. When a shopper enters a search phrase and the GET Product Search endpoint is requested, the platform performs a keyword search and a sorted search result is returned. The sorted search result can be refined according to given values (for example, a price range).
The product search result contains a definable number of product search hits. A product search hit describes a matching product with its ID and name. Furthermore, the search hit contains product images, prices, represented products, and variations. In addition to the search hits, the search results also deliver refinement and sorting options.
