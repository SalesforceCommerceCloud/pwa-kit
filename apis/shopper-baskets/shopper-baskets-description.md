# API Overview

Use the Shopper Baskets API to create a basket in the B2C Commerce system and populate it with all the data required to ready the basket for checkout.

To create a basket, start with the [Create basket](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=createBasket) endpoint. The endpoint creates the basket in the B2C Commerce system and returns a JSON representation of the basket with a `basketId` property.

If you provide the JSON for a prepopulated basket to the [Create basket](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=createBasket) endpoint, you can create a basket using a single API request.

You can also create a basket and gradually populate it with data using subsequent API requests that reference the same `basketId`. The gradual approach allows you to validate the input data as you go.

The Shopper Baskets API includes endpoints to populate each part of a basket separately, including:

-   Billing address
-   Customer information
-   Line items
    -   Products
    -   Coupons
    -   Gift certificates
-   Payment methods
-   Price books
-   Shipments
-   Taxation (for items and the basket itself)

In addition to creating a basket, the main `/baskets` resource offers endpoints to get, transfer, merge, and delete baskets, depending on the HTTP method that you use and the parameters that you supply. These endpoints can you help you handle a variety of complex scenarios, such as when a user starts shopping as a guest and then logs in before checkout.

You can also use the main `/baskets` resource to add custom properties to your basket, prefixed with `c_` (example: `c_faxNumber`).

When your basket is fully populated, you can use its `basketId` property to create an order with the [Shopper Orders API](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-orders?meta=Summary).

## Authentication & Authorization

The client requesting the basket information must have access to the `/baskets` resource. The Shopper Baskets API requires a shopper access token from the Shopper Login and API Access Service (SLAS).

For details on how to request a shopper access token from SLAS, see the guest user flows for [public clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-public-client.html#guest-user) and [private clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-private-client.html#guest-user) in the SLAS guides.

The following resources require an Account Manager OAuth token with a client ID:

-   `/baskets/{basketId}/taxes`
-   `/baskets/{basketId}/items/{itemId}/taxes`
-   `/baskets/{basketId}/price-books`

## Basket Calculation

Unless you’re using [hooks](https://developer.salesforce.com/docs/commerce/commerce-api/guide/extensibility_via_hooks.html), each modification to a basket triggers the following calculations:

1.  Calculate product prices:
    -   Iterate through the product line items and determine the base price of each using its price model. If multiple price books apply to a product, the lowest price is used.
    -   Calculate product option line item prices using the product option model.
    -   For bonus products, check dependent adjustments in the basket to determine the price.
2.  Iterate through the gift certificate line items and calculate the price of each by multiplying the base price by the quantity.
3.  Recalculate for all promotions, adding and removing them as appropriate.
4.  Apply product-specific shipping costs.
5.  Calculate the total shipping cost.
6.  Recalculate for all promotions, adding and removing them as appropriate.
7.  Calculate prices for products added by the promotion engine.
8.  Calculate taxes using line item tax class codes.
    -   For internal tax mode, use the tax tables.
    -   For external tax mode, use the tax rates returned by the tax API endpoints.
9.  Calculate the order’s net, tax, and gross totals by adding up the line totals.

## External Taxation

The B2C Commerce API calculates taxes internally using tax tables. If you want to integrate with a third-party tax provider, or calculate tax on your own, you can use the external taxation feature to add a taxation rate and optional taxation value. When setting a taxation rate, the taxation is calculated for this specific rate. If you pass a value, this value is used as taxation value, as well, without recalculation. To use this feature, set the `taxMode` parameter to `external` when creating the basket.

**Important**: To use external tax calculation, [hooks](https://developer.salesforce.com/docs/commerce/commerce-api/guide/extensibility_via_hooks.html) must not be enabled in Business Manager.

When using external taxation, you must set a tax rate either in one request to the `/baskets/{basketId}/taxes` or with separate requests for each line item, using `/baskets/{basketId}/items/{lineItemId}/taxes`.

If the tax mode of a basket is set to `external`, a tax item is required for all line items even for zero-tax items to avoid oversights.
