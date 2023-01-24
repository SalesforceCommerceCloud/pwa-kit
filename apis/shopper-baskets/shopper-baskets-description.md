# API Overview

The Shopper Baskets API provides a set of resources to build a ready-for-checkout basket for a customer.

It provides functionality to add product items and gift certificate items to the basket, apply coupons, group items to particular shipments, define shipping methods and addresses. Payment information can be posted using this API or the Shopper Orders API.

## Authentication & Authorization

The client requesting the basket information must have access to the Basket resource. The Shopper Baskets API requires a shopper access token from the Shopper Login and API Access Service (SLAS).

For details on how to request a shopper access token from SLAS, see the guest user flows for [public clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-public-client.html#guest-user) and [private clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-private-client.html#guest-user) in the SLAS guides.

The following resources require an Account Manager OAuth token with a clientId:

-   /baskets/{basketId}/taxes
-   /baskets/{basketId}/items/{itemId}/taxes
-   /baskets/{basketId}/price-books

## Use Cases

Any basket defines an intent with all the information necessary to create an order. It basically needs customer information, shipping and billing information, and at least one product line item or a gift certificate line item. This basket can be created using the particular sub resources or by posting an entire pre-populated basket.

Once a basket has been provided with the necessary information, it can be used to create an order using the Shopper Orders API.

### Pre-Populated Basket

Use the Shopper Baskets API to build a basket JSON right away and post it to the API. As long as the content is valid the basket gets created and returned.

### Build a Basket From Scratch

Use the Shopper Baskets API to create a basket.

A basket can be created by posting a basket and providing all other information using single API calls. Once a basket has been created, the ID can be used to add additional information to the basket such as customer contact details, billing and shipping addresses, items, coupons, gift certificate items, payment methods, and custom properties.

A simple basket needs at least one item (product or gift certificate), and the billing and shipping addresses. Once the basket was found complete, it can be used to create an order using the Shopper Orders API.

#### Modify Customer Information

Use the Shopper Baskets API to modify customer information.

Based on the customer specified in the JWT (registered or guest) the created basket is assigned to that particular customer. In case a customer started a journey as a guest and then logs in, the basket handling must be implemented by the app. Possible scenarios include merge, replace, or use the basket of the registered customer.

#### Add Product Items

Use the Shopper Baskets API to add product items to the basket.

When adding a product item to the basket, the whole basket is recalculated.

When an order is created, the product stock level is reduced. The inventory list can be optionally specified per item.

#### Add External Taxation

Salesforce Commerce API calculates taxes internally using tax tables. In case you want to integrate with a third-party tax provider, or calculate tax on your own, you can take advantage of the external tax API.

Use the Shopper Baskets API’s external taxation feature to add a taxation rate and optional taxation value. When setting a taxation rate, the taxation is calculated for this specific rate. If you pass a value, this value is used as taxation value, as well, without recalculation. To use this feature on a basket, this basket must have `taxMode` set to `external`.

To create an “external taxed basket” call the basket resource with an additional query parameter taxMode.

`POST /baskets?siteId=SiteGenesis=external`

When creating a basket without a taxMode, the default is “internal” and taxation tables is used for calculation.

When using external taxation, it is necessary for order creation to set a tax rate either in one call by calling `/baskets/{basketId}/taxes`.

```
{
  "taxes": {
    "154452ac9bc523570dfcbad359": {
      "taxItems": [
        {
          "id": "US_MAINE",
          "rate": 0.055
        }
      ]
    },
    "52c736d905dc28ac6862e1c53a": {
      "taxItems": [
        {
          "id": "US_MAINE",
          "rate": 0.055
        }
      ]
    },
    "2ac1f1cec85f811ff75c292254": {
      "taxItems": [
        {
          "id": "US_MAINE",
          "rate": 0.055
        }
      ]
    }
  }
}
```

or with different calls each per line item, using `/baskets/{basketId}/items/{lineItemId}/taxes`.

```
{
  "taxItems":
  [
    {
      "id": "US_MAINE",
      "rate": 0.055
    }
  ]
}
```

If the tax mode of a basket is set to external, the basket API requires a tax item - even if it’s zero tax - for all line items to make sure that nothing has been forgotten or overseen. Consider all line item types to have proper tax set.

Mandatory:

-   product line items
-   option line items
-   shipping line items
-   coupon line items
-   bonus discount line item

Optional:

-   gift certificate line items (default tax set to zero - can be overridden)

Calculated or Inherited:

-   price adjustments (depending on the type, the tax rate is either obtained from the related line item or computed as prorate of the basket)

When not setting all those items and using external taxation mode, you get a validation error during order creation.

```
{
    "title": "Validation",
    "type": "https://api.commercecloud.salesforce.com/documentation/error/v1/errors/validation",
    "detail": "Order total missing, calculation failed.",
    "validationMessage": "Order total missing, calculation failed.",
    "validationPath": "$.order_total",
    "validationType": "OrderTotalNotSet"
}
```

**Drop Tax Items**

When changing taxation related information, the system automatically drops corresponding tax items. The following changes on a line item are considered:

-   quantity
-   price

The system removes the taxation for the changed line item only. However the complete taxation is dropped if changing the following data:

-   address
-   payment information

#### Add Addresses

Use the Shopper Baskets API to set or update the billing and shipping addresses on a basket. For example, during checkout the shopper enters their billing address and wants to use it as the shipping address.

#### Add Shipments

Use the Shopper Baskets API to define one or more shipments for a basket. Use this API to add a shipping method or shipping address for a shipment. For example, the shopper selects 'Express' during checkout for one item. It is possible to add a new shipment for this specific item.

#### Add Payment

Use the Shopper Baskets API to define one or more payments for a basket. Use this API to add a payment method to the payment. For example, the shopper selects Credit Card during checkout as a payment method. Note the API _doesn’t_ allow the storage of credit card numbers. The endpoint provides the storage of masked credit card numbers.

#### Add Price Books

Use the Shopper Baskets API to add one or more price books to the basket. Adding a price book recalculates the basket. If a product has prices in multiple price books added to the basket, the basket uses the lowest one. Specifying an invalid price book ID returns a 404 error.

## Basket Calculation

Every basket modification triggers the following calculation process:

1.  Calculate product prices :<br/>
    a. Iterate through the product line items and determine the base price of each using its price model. If multiple price books apply to a product, the lowest price is used.<br/>
    b. Calculate product option line item prices using the product option model.<br/>
    c. For bonus products, check dependent adjustments in the basket to determine the price.
2.  Iterate through the gift certificate line items and calculate the price of each by multiplying the base price by the quantity.
3.  Recalculate for all promotions, adding and removing them as appropriate.
4.  Apply product-specific shipping costs.
5.  Calculate the total shipping cost.
6.  Recalculate for all promotions, adding and removing them as appropriate.
7.  Calculate prices for products added by the promotion engine.
8.  Calculate taxes using line item tax class codes.<br/>
    a. For internal tax mode, use the tax tables. <br/>
    b. For external tax mode, use the tax rates returned by the tax API endpoints.
9.  Calculate the order’s net, tax, and gross totals by adding together the line totals.
