# API Overview

The Shopper Orders API enables you to create orders based on baskets prepared using the Shopper Baskets API.

You can also use the Shopper Orders API to add a customers payment instrument to an order.

You can choose to supply the full payment information or supply only a customer payment instrument ID and amount. If the customer payment instrument ID is set, all the other properties (except amount) are ignored and the payment data is resolved from the stored customer payment information.

**Note:** The API doesn’t allow the storage of credit card numbers. The endpoint provides the storage of masked credit card numbers only.

To update the payment status, use the Orders API.
