# Shopper Agent direct cart on PWA Kit

The Commerce Client provider supports the cart-action contract released in widget
**1.58.1**. The default is `cc_cartTransport: 'agent'`. In `direct` mode only cart
buttons use Commerce API; typed requests continue through the agent.

Add these fields to the existing `app.commerceAgent` configuration:

```json
{
    "cc_cdnVersion": "1.58.1",
    "cc_cartTransport": "direct",
    "cc_storefrontCartPageUrl": "",
    "cc_expressCheckoutEnabled": "false"
}
```

Keep the existing provider, enabled flag, and SCRT2/Embedded Service settings.
When using `COMMERCE_AGENT_SETTINGS`, include the complete configuration: that
environment variable replaces the object. Reload existing tabs after changing
transport or widget configuration. Invalid transport values resolve to `agent`.

## Cart actions and synchronization

The widget dispatches `cimulate:cart-action` with `detail.respond`. The adapter
responds once with `{ok: true, cart}` or `{ok: false, error}`.

| Action | Fields | PWA Kit Commerce API client method |
| --- | --- | --- |
| View Cart (`get`) | none | `getCustomerBaskets`, then `getBasket` |
| Add (`add`) | selected variant `productId`, positive integer `quantity` | `addItemToBasket` |
| Quantity (`quantity`) | `itemId`, `productId`, positive integer `quantity` | `updateItemInBasket` |
| Remove (`remove`) | `itemId`, `productId` | `removeItemFromBasket` |
| Coupon (`coupon`) | nonblank `code` | `addCouponToBasket` |

Reads select the current shopper's non-temporary basket. View Cart never creates
one. Add creates one if needed, in the current currency. Each write is followed
by an authoritative read. Commerce API validates inventory, pricing and basket
rules. Catalog data decorates the cart with variant labels and images when
available; it does not determine the payable amounts.

The adapter updates the same customer-basket cache used by `useCurrentBasket`,
the cart page and header count, then publishes through
`CimulateMessaging.eventHandlers.cart.update`. Storefront basket-cache changes,
confirmed agent `cimulate:cart-update` events, and
`commerceclient:cart-changed` signals trigger fresh reads. Event payloads are
never treated as the current basket. The widget retains ownership of historical
conversation cart snapshots.

Actions are serialized, have an eight-second deadline, and are never automatically
retried. A lost write response or failed post-write read blocks further widget
edits. A successful explicit **View Cart** read, after the original request has
settled, is required to unlock editing; background sync cannot unlock it. Browser
timeouts cannot cancel a server-side mutation. Check the basket before deliberately
repeating an add. Shopper/site/locale/currency changes clear the widget's current
basket, revoke wallet launches, and invalidate old reads and queued actions.

## Optional merchant-owned cart iframe

`cc_storefrontCartPageUrl` accepts a root-relative path or HTTPS URL and defaults
to empty. It is forwarded only in direct mode. The widget owns precedence:
**Cart override → configured iframe → built-in cart**.

Supply an embeddable page with appropriate framing headers and storefront CSP;
the integration does not create a merchant cart route. Avoid embedding another
Shopper Agent instance. A same-origin embedded page can notify the parent after
its basket mutation succeeds:

```js
window.parent.dispatchEvent(
    new window.parent.CustomEvent('commerceclient:cart-changed')
)
```

Cross-origin cart pages require their own validated message bridge and shopper
session setup. This implementation does not accept cross-origin cart messages.

## Salesforce Payments wallets

Set `cc_expressCheckoutEnabled: 'true'` and enable Salesforce Payments express
checkout for `CART` in the site's existing payment configuration. The opt-in
provider reuses `SFPaymentsExpressButtons` in `/Payments-Express`; it keeps the
existing shell's same-origin parent validation, resizing and lifecycle protocol.
The neutral provider remains available as an application replacement point, and
product-surface express payments remain unavailable through this cart provider.

Only nonempty, non-temporary baskets with a positive known payable total and one
standard delivery shipment qualify. Pickup/multiship baskets use standard
checkout. The SDK determines Apple Pay/Google Pay availability on the current
device and gateway; other payment methods are excluded from the chat surface.
Apple Pay still requires merchant/domain registration and a supported device.

A wallet URL carries an opaque launch id, valid for fifteen minutes, bound in
same-origin session storage to the shopper, site, locale, currency, basket id and
quote version. Addresses and payment details are not copied into that record.
The provider checks the active basket on mount and on click, and re-reads the live
quote before shipping/payment/order callbacks. It rejects a changed shopper,
revoked launch, changed line items or a total that differs from the latest wallet
quote. Legitimate wallet shipping updates advance the expected quote. Commerce
API and the existing Salesforce Payments order/payment flow remain authoritative.

Success reports the order id through `express.payment.success`; cancellation and
failure use the existing lifecycle messages. The iframe signals a fresh parent
cart read after each outcome, including possible shipping/address changes, without
waiting for an agent turn. Normal storefront payment consumers keep their existing
confirmation navigation. Standard Checkout remains on the widget cart.

## SFRA parity and validation checklist

Based on [SFRA PR #135](https://github.com/SalesforceCommerceCloud/plugin_commerce_client/pull/135),
[widget PR #16859](https://github.com/cimulate-ai/cimulate/pull/16859), and the
[PWA Kit express checkout guide](https://developer.salesforce.com/docs/commerce/commerce-api/guide/express-checkout.html).

- [x] Agent default; direct View Cart/add/quantity/remove/coupon button contract.
- [x] Selected variant and quantity; typed chat stays with the agent.
- [x] Authoritative reads, storefront/widget synchronization and header cart state.
- [x] Shopper-change invalidation and View Cart recovery after uncertain writes.
- [x] Optional iframe configuration and same-origin cart-changed signal.
- [x] Existing Salesforce Payments component reused with cart-bound wallet launches,
      live-quote checks and lifecycle/cart-refresh callbacks.
- [ ] Real sandbox storefront/agent end-to-end validation with widget 1.58.1+.
- [ ] Real-device Apple Pay and Google Pay: availability, successful payment,
      cancellation, failure, shipping changes, stale quote and shopper switch.
- [ ] Merchant cart iframe/Cart override and merchant-specific product flows.

Automated tests cover direct add, each cart action, two-way sync, empty baskets,
shopper changes, stale/late responses, uncertain writes, wallet launch validation,
live totals, availability and success/cancel/failure callbacks. These tests use
fixtures. A separate browser fixture smoke test with the released **1.58.1** UMD
verified View Cart, variant/line ids on quantity changes, removal and widget count
updates. **No real sandbox wallet/device case has been verified**. Product sets,
configurable bundles, option-selection and bonus-product selection need existing
storefront-specific UI, as in SFRA.
