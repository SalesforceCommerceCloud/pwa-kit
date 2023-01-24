# API Overview

The Shopper Orders API enables you to create orders based on baskets prepared using the Shopper Baskets API, and add payment information accordingly.

## Authentication & Authorization

The client requesting the order information must have access to the Order resource. The Shopper Orders API requires a shopper access token from the Shopper Login and API Access Service (SLAS).

For details on how to request a shopper access token from SLAS, see the guest user flows for [public clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-public-client.html#guest-user) and [private clients](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-private-client.html#guest-user) in the SLAS guides.

## Use Cases

### Order

Use the Shopper Orders API to submit an order based on a basket prepared using the Shopper Baskets API.

### Add a Payment Instrument

Use the Shopper Orders API to add a customers payment instrument to an order.

It is possible either to supply the full payment information or only a customer payment instrument ID and amount. In case the customer payment instrument ID was set, all the other properties (except amount) are ignored and the payment data is resolved from the stored customer payment information.

Note that the API doesn’t allow the storage of credit card numbers. The endpoint provides the storage of masked credit card numbers.

To update the payment status, use the Orders API.
