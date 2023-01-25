# API Overview

The Shopper Product API enables you to access product details for products that are online, merchandised to a particular site catalog, and ready to be sold. You can use these product details to merchandise the product on other ecommerce channels. To set up category navigation paths on other commerce apps or storefronts, you can use the Categories API.

## Authentication & Authorization

The client requesting the product information must have access to the Products resource. The Shopper Products API requires a shopper access token from the Shopper Login and API Access Service (SLAS).

For details on how to request a shopper access token from SLAS, see the guest user flows for [public clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-public-client.html#guest-user) and [private clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-private-client.html#guest-user) in the SLAS guides.

## Use Cases

### Populate Product Listing Pages

Use the Shopper Product API so that a customer, browsing on a commerce shopping app built using Commerce Cloud APIs, can see a list of products. For example, hydrate a list of products (max 24). The API returns product details including images, prices, promotions, and product availability.

![b2c-commerce-shopper-products-screenshot-1.png](https://resources.docs.salesforce.com/rel1/doc/en-us/static/misc/b2c-commerce-shopper-products-screenshot-1.png)

### Get Variation Product Details on an Ecommerce Channel

Use the API so that a customer, browsing on a commerce shopping app built using Commerce Cloud APIs, can switch between different variation products. The API returns product details including images, prices, promotions, and available to sell inventory.

![b2c-commerce-shopper-products-screenshot-2.png](https://resources.docs.salesforce.com/rel1/doc/en-us/static/misc/b2c-commerce-shopper-products-screenshot-2.png)

## Resources

### Product

A full representation of a product or service that is to merchandise. A ready to merchandise product is one that is online, categorized, and published to a channel. The information associated with a product includes, the product name, description, custom and system attributes, variations, price, availability, and images.

### Category

Categories and subcategories are the structure by which products are organized and grouped in a catalog and on a storefront. Categories can have relationships to other categories. Further, each category can provide context that is inherited by subcategories. For example, a category can have an assigned attribute. A product assigned to that category or any subcategory inherits the categories’s attribute value. Once the product is removed from the category, the attribute value is no longer inherited by the product. You can also use category linking for site hierarchical navigation. For example, inside the Clothing category you may have Men’s, and inside the Men’s category you may have Pants.

Categories are not tags.

## Endpoints

### GET /products

Returns product details for up to 24 products in one API request. You can use this API for use cases that require populating or hydrating multiple products at a time, such as populating the Product Listing Pages.

The response data includes availability, promotions, images, and prices, along with the basic product information for the products requested.

### GET /products/{id}

Returns product details about a single product. Use this API for use cases that require populating or hydrating one product at a time, such as the Product Detail Pages.

The response data includes availability, promotions, options, images, prices, variations, bundled_products, set_products, recommendations, and the basic product information for the product requested.

### GET /categories

Returns category details including the parent child relationships for one or more categories. The limit on depth for the parent-child relationship is 2.
