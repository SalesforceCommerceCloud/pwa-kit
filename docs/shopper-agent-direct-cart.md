# Shopper Agent direct cart on PWA Kit

The Commerce Client provider supports the cart-action contract released in widget
**1.58.1**. The default is `cc_cartTransport: 'agent'`. In `direct` mode only cart
buttons use Commerce API; typed requests continue through the agent.

Add these fields to the existing `app.commerceAgent` configuration:

```json
{
    "cc_cdnVersion": "1.58.1",
    "cc_cartTransport": "direct",
    "cc_storefrontCartPageUrl": ""
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
basket and invalidate old reads and queued actions.

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

## Checkout

The built-in direct cart links to standard storefront checkout. Merchants who
want express payment in Shopper Agent can build an integration using the
[existing PWA Kit provider framework](https://developer.salesforce.com/docs/commerce/commerce-api/guide/express-checkout.html).

## SFRA parity and validation checklist

Based on [SFRA PR #135](https://github.com/SalesforceCommerceCloud/plugin_commerce_client/pull/135),
[widget PR #16859](https://github.com/cimulate-ai/cimulate/pull/16859), and the
[PWA Kit express checkout guide](https://developer.salesforce.com/docs/commerce/commerce-api/guide/express-checkout.html).

- [x] Agent default; direct View Cart/add/quantity/remove/coupon button contract.
- [x] Selected variant and quantity; typed chat stays with the agent.
- [x] Authoritative reads, storefront/widget synchronization and header cart state.
- [x] Shopper-change invalidation and View Cart recovery after uncertain writes.
- [x] Optional iframe configuration and same-origin cart-changed signal.
- [x] Standard storefront checkout link.
- [ ] Real sandbox storefront/agent end-to-end validation with widget 1.58.1+.
- [ ] Wallet parity is deferred to merchant payment providers.
- [ ] Merchant cart iframe/Cart override and merchant-specific product flows.

Automated tests cover direct add, each cart action, two-way sync, empty baskets,
shopper changes, stale/late responses, and uncertain writes. These tests use
fixtures. A separate browser fixture smoke test with the released **1.58.1** UMD
verified View Cart, variant/line ids on quantity changes, removal and widget count
updates. Product sets,
configurable bundles, option-selection and bonus-product selection need existing
storefront-specific UI, as in SFRA.
