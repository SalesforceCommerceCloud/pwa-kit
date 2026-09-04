# Order Management

The order detail page surfaces three [Salesforce Order Management
(OMS/SOM)](https://help.salesforce.com/s/articleView?id=commerce.om_order_management.htm&type=5)
shopper actions: **returning** eligible items, **cancelling** an order, and
**tracking** shipments. All three are driven by the OMS data attached to the order—
eligibility, returnable/cancellable quantities, statuses, and tracking details come
from OMS—and the authoritative accept/reject for the mutating actions happens
server-side via the corresponding order action.

There is **no feature flag**. Each action is gated entirely on data and shopper
identity in [`order-detail.jsx`](../app/pages/account/order-detail.jsx). B2C Commerce-only
orders (no `omsData`) never expose the return or cancel flows, and fall back to raw
order/shipment status everywhere.

## Prerequisites

These features require a **Salesforce Order Management (SOM) core org connected to
the storefront's B2C Commerce instance**. SOM is what enriches orders with the
`omsData` this UI depends on—order- and item-level OMS data (returnable/cancellable
quantities, item statuses, shipment tracking) and the order actions
`POST .../orders/{orderNo}/actions/oms-return-order` (`returnOmsOrder`) and
`POST .../orders/{orderNo}/actions/oms-cancel-order` (`cancelOmsOrder`) on the
[Shopper Orders B2C Commerce API (SCAPI)](https://developer.salesforce.com/docs/commerce/commerce-api/references?meta=shopper-orders:Summary).
See the [Integrate Order Management with B2C Commerce](https://help.salesforce.com/s/articleView?id=commerce.om_impl_storefront_integration.htm&type=5)
docs for connecting and provisioning the org.

Without a connected SOM org, orders carry no `omsData`: they are treated as B2C Commerce-only,
the return and cancel actions never render, return reasons can't load, and the status
badge falls back to the raw `order.status || order.omsData?.status`. Nothing errors—the features simply stay
hidden. There is no storefront flag to turn them on; presence of OMS data on the order
is the switch.

## Order Returns

Registered shoppers can return eligible items. A shopper opens the **Return Items**
modal, picks items and per-item quantities, chooses a reason, reviews, and submits.
The order status badge then reflects the return's progress, including
partially-returned multi-unit lines.

### Eligibility

| Condition | Source | Meaning |
| --- | --- | --- |
| Registered shopper | `useCustomerType().isRegistered` | Guests never see the return UI. |
| Owns the order | `order.customerInfo.customerId === customerId` | A shopper can only return their own orders. |
| OMS-managed order | `!!order.omsData` | B2C Commerce-only orders carry no OMS data. |
| Has returnable items | `getReturnableItems(order).length > 0` | At least one line has `omsData.quantityAvailableToReturn > 0`. |

### How It Works

1. **Determine returnable items.**
   [`getReturnableItems(order)`](../app/utils/return-utils.js) filters
   `order.productItems` to those whose `omsData.quantityAvailableToReturn` is a
   positive number. We trust that field verbatim rather than maintaining a
   client-side status allowlist.
2. **Load return reasons.** The order-detail page calls
   [`useOmsMetaData`](https://github.com/SalesforceCommerceCloud/commerce-sdk-react)
   once and forwards `returnReasonCodes` (`{reason, default}` entries) into the
   modal via a `reasonCodes` prop — mirroring how `cancelReasonCodes` reaches
   `CancelOrderModal`. The OMS-default reason is pre-selected for every checked
   item. If the metadata fetch fails, the modal drops the Reason column
   entirely and lets the shopper proceed without one — reason is optional on
   the return API and the server applies the OMS default when omitted, so this
   matches the graceful behaviour of `CancelOrderModal` (which hides its reason
   dropdown too). No banner and no retry — the shopper closes and reopens the
   modal (or reloads the page) to retry the fetch.
3. **Select and review.** The shopper checks items, sets a per-item quantity (capped
   at that line's available-to-return count), and picks a reason; a review step
   summarizes the request before submission.
4. **Build the request.**
   [`buildReturnProductItems(selection, defaultReasonCode)`](../app/utils/return-utils.js)
   produces the `productItems` array for the `OmsReturnOrderRequest`. Quantity is
   serialized as a JS `Number`; the `reason` field is omitted when the shopper kept
   the OMS default, so the server applies it.
5. **Submit.** Via the
   `useShopperOrdersMutation(ShopperOrdersMutations.ReturnOmsOrder)` mutation
   (`POST .../actions/oms-return-order`). On success the page refetches the order so
   the returnable quantities and status badge reflect the new state.
6. **Classify failures.**
   [`classifyReturnError(error)`](../app/utils/return-error-utils.js) normalizes any
   error into a [`ReturnErrorKind`](../app/utils/return-error-utils.js), which the
   modal maps to a specific inline message and recovery affordance.

### Return Reason Codes

Reasons are not hard-coded—they come from OMS via
`useOmsMetaData().data.returnReasonCodes`, fetched by the order-detail page and
passed into the return modal as the `reasonCodes` prop. Each entry is
`{reason, default}`. The entry flagged `default: true` is pre-selected and omitted
from the request body so the server applies it. Change the available reasons in
Order Management; no storefront change is needed.

### Error Handling

`classifyReturnError` inspects the HTTP status and (for `400`) the body's `errorCode`
discriminator, returning one of these kinds:

| `ReturnErrorKind` | Trigger | UI behavior |
| --- | --- | --- |
| `INVALID_REASON` | `400` `InvalidReasonCode` | Inline: reason no longer available, pick another. |
| `UNKNOWN_ITEMS` | `400` `UnknownProductItemIds` | Inline: affected items can't be returned. |
| `QUANTITY_EXCEEDED` | `400` `ReturnQuantityExceeded` | Inline: requested quantity too high. |
| `NOT_FOUND` | `404` | Terminal: order not found. |
| `CONFLICT` | `409` | Terminal: order no longer in a returnable state. |
| `NETWORK` | No HTTP response (fetch rejected) | Inline, retryable. |
| `UNKNOWN` | Any other status (incl. `400 OrderReturnFailed`, `5xx`) | Inline, retryable. |

The `409` case is the authoritative server-side refusal: even if the client thinks an
item is returnable, OMS has the final say. A mid-flow `401` is intercepted and
refreshed by the SDK auth layer before the classifier ever sees it.

## Order Cancellation

Registered shoppers can cancel an order that hasn't started fulfillment. The
**Cancel Order** button renders unconditionally (so its position is stable) but is
disabled—with a screen-reader hint explaining why—when the order isn't eligible,
a cancellation just succeeded, or a terminal error made the order un-actionable.

### Eligibility

`canCancel` in [`order-detail.jsx`](../app/pages/account/order-detail.jsx) requires:

| Condition | Source |
| --- | --- |
| Registered shopper | `useCustomerType().isRegistered` |
| Owns the order | `order.customerInfo.customerId === customerId` |
| OMS-managed order | `!!order.omsData` |
| Every item fully cancellable | `item.omsData.quantityAvailableToCancel === item.omsData.quantityOrdered` for **all** `productItems` |

Cancellation is all-or-nothing: it's offered only when every line can still be
cancelled in full. Once any unit has shipped, the order is no longer cancelable.

### How It Works

1. The shopper confirms in the
   [`CancelOrderModal`](../app/components/cancel-order-modal) (optionally supplying a
   reason).
2. The page submits via
   `useShopperOrdersMutation(ShopperOrdersMutations.CancelOmsOrder)`
   (`POST .../actions/oms-cancel-order`); the `reason` is sent only when provided.
3. On success an "Order cancelled" alert is shown (after a short delay so screen
   readers finish announcing the modal close) and the order status badge flips to
   **Canceled**.
4. On failure, cancellation follows the same convention as returns (see
   [Error Handling](#error-handling) above): a `404` or `409` is **terminal**—the
   order can no longer be canceled, so the button is permanently disabled with an
   explanatory hint—while any other error shows a generic, retryable message. Unlike
   returns, cancellation has no per-`errorCode` classifier; it keys off the HTTP
   status alone.

Return feedback is kept separate from cancel feedback so the **Cancelled** badge
(which keys off the cancel result) never fires on a return success.

## Refunds (Out of PWA Kit Scope)

**Payment refunds are not owned by the storefront.** The PWA Kit UI only *initiates*
a return (see [Order Returns](#order-returns)) or a cancellation (see
[Order Cancellation](#order-cancellation)). The refund itself is a fully automated
downstream process inside OMS/SOM, with nothing running in B2C Commerce. This
section documents that flow so developers understand where a shopper's refund actually
comes from.

For a return, the refund happens only after the item is physically returned—not
when the shopper initiates the return:

1. Shopper requests a return in self-service. A return order is triggered via the
   create-return-order API.
2. The return order is created in OMS. The item moves to **Return Initiated** status.
3. The item is physically returned. The return order is closed (manually in the OMS
   UI, or via an API integration such as a WMS).
4. A close event fires. It triggers the `EnsureRefunds` API (a SOM process).
5. `EnsureRefunds` makes a callout to the payment service provider (PSP) to process the
   refund. A credit memo is generated.

For a cancellation, the same automated downstream refund fires on the order's
status change (there is no "return the item" step to wait on).

Notes:

- Return-label generation is a gray area OMS does not handle out of the box—the
  merchant arranges it with their carrier or label aggregator. (The storefront's return
  success alert says "We'll email a return label shortly," which assumes such an
  integration exists.)
- There is **nothing to implement in PWA Kit** for refunds. The storefront's
  responsibility ends at initiating the return or cancellation.

## Order Tracking

[`OrderTracking`](../app/components/order-tracking) is a presentational, bordered
**tracking card**—one per shipment—rendered in a single flat **Tracking** section
on the order detail page. Each card shows the carrier / shipping-method name, the
localized shipping status, the tracking number, and—when present—the expected and
actual delivery dates. A card carries **no shipping address** (addresses live with the
items; see [Shipments and addresses](#shipments-and-addresses) below).

The cards are built from `trackingEntries` (`order-detail.jsx`): one entry per
`order.omsData.shipments[]`, falling back to `order.shipments[]` (B2C Commerce) only when there
are no OMS shipments. B2C Commerce-fallback cards have no provider, tracking URL, or dates
(those are OMS-only).

Key behaviors:

- **Carrier link safety.** When a tracking URL is available, the tracking number is
  hyperlinked through [`ensureExternalUrl`](../app/utils/url.js), which normalizes the
  scheme and rejects unsafe inputs (`javascript:` URLs, host-spoofing like
  `https://www.ups.com@evil.com`, and relative paths)—returning `undefined` so the
  number renders as plain text instead. Otherwise the tracking number is shown
  unlinked.
- **Date guarding.** Missing, null, or unparseable delivery dates render nothing
  rather than a misleading value. The `!value` guard is load-bearing: `new Date(null)`
  returns the epoch (1970-01-01), not an Invalid Date, so without it a null delivery
  date would display "31 Dec 1969".
- **OMS-over-B2C Commerce fallback.** The component receives already-resolved scalar props;
  the fallback that prefers OMS shipment fields over B2C Commerce ones lives at the call site
  in `order-detail.jsx`. A provider-less OMS shipment borrows the delivery shipment's
  method name **only** in the unambiguous one-OMS-↔-one-delivery case; multi-shipment
  never joins, so a provider-less card simply shows no carrier name.

### Track Shipment action

A single **Track Shipment** order action sits in the actions row alongside Return
Items / Cancel Order. Its source is `trackingUrlOptions`—the externalizable
(`ensureExternalUrl`'d) carrier URLs from `order.omsData.shipments`—so it can never
diverge from the tracking-number links in the cards. It has three states:

- **No externalizable URL** → the button renders **disabled** (kept visible, focusable
  via `aria-disabled` with a screen-reader hint "Tracking is not available for this
  order yet.").
- **Exactly one URL** → a single external-link button opening the carrier site in a new
  tab (the common single-shipment case).
- **Multiple URLs** → a dropdown (Popover) listing one carrier link per shipment, since
  a tracking entry can't be reliably tied to a specific shipment.

### Shipments and addresses

Shipment data arrives on the order in two lists with no correlation key between them:
tracking info (status, tracking number/URL, dates) in `order.omsData.shipments`, and
shipping addresses in `order.shipments` (B2C Commerce delivery groups). They can't be reliably
paired—B2C Commerce models a *delivery group* (the shopper's intent: which items go to which
address) while OMS models a fulfillment *shipment* (a physical package), and a single
delivery group can fan out into several OMS shipments (e.g. units of one line shipped
from different warehouses). Pairing by index would risk showing the wrong address
against a tracking number.

The resulting layout keeps the two associations the data *can* support and avoids the
one it can't:

- **Items ↔ address (supported).** In the Items Ordered section, products are grouped
  into a box per delivery shipment, and each box shows that delivery group's
  **Shipping Address**. This is a B2C Commerce-internal grouping (`shipmentId`), so it's
  reliable. A single-shipment order is one box; BOPIS pickup-only orders (no delivery
  shipment) fall back to one flat product list.
- **Tracking ↔ shipment (not associated).** The Tracking section is a flat list of
  cards rendered as peers *below* the shipment boxes, with **no address** and **no
  positional OMS↔B2C Commerce index-join**—the layout is honest that neither the shopper nor
  the storefront can say which tracking entry belongs to which box.

Multi-shipment tracking **grouped by address** remains out of scope, deferred to a TD
pending SCAPI returning correlated address data on `order.omsData.shipments`.

## Status Badge

The order status badge reflects fulfillment, cancellation, and return progress in one
place. [`getOrderDisplayStatus(order)`](../app/utils/order-status-utils.js) aggregates
item-level SOM statuses into a single order-level display status, because SOM exposes
status per line item rather than a reliable order-level status.

> **Status is computed from item-level OMS data—by design, not preference.**
> The order-level `omsData.status` is known to be unreliable: in SOM it can stay
> `Approved` even after every item has been cancelled or returned, because the
> order-level rollup lags behind (or never reflects) the item-level state. The
> item-level `omsData` *is* updated correctly, so `getOrderDisplayStatus` derives the
> aggregated status entirely from the per-item (and per-unit) data and never reads
> the order-level `omsData.status` in that path (the raw order-level status is used
> only as the green-badge fallback when no item carries OMS status). This is a known SOM limitation outside the
> storefront's control; if the badge looks "wrong" versus the SOM order record, the
> SOM order-level status is the stale side, not the badge.

Aggregation works at the **unit** level, not the line level. A line with
`quantityOrdered > 1` can straddle several states at once (e.g. 1 of 2 units returned
while the other ships). `getItemUnitBuckets` reconstructs the true per-unit breakdown
from the quantity fields (`quantityCanceled`, `quantityReturned`,
`quantityReturnInitiated`, and the remainder), so a partially-returned or
partially-cancelled multi-unit line reads correctly instead of masquerading as merely
"in progress".

The return-related display statuses—

- `RETURN_INITIATED`
- `PARTIAL_RETURN_INITIATED`
- `RETURN_COMPLETE`
- `PARTIAL_RETURN_COMPLETE`

are grouped by `isReturnDisplayStatus`. The
[`OrderStatusBadge`](../app/components/order-status-badge/index.jsx) renders these in a
neutral badge with their own localized labels, leaving the cancelled (red) and
raw-status (green) branches untouched. B2C Commerce-only orders, which carry no item-level OMS
status, fall back to the raw `order.status || order.omsData?.status`.

## Customization

The pieces a project most commonly overrides:

- **Eligibility**—adjust the gating (`showStartReturn` / `canCancel`) in
  [`order-detail.jsx`](../app/pages/account/order-detail.jsx), or the predicate in
  [`getReturnableItems`](../app/utils/return-utils.js), if your business rules differ.
- **Messages**—return modal copy lives in
  [`return-items-modal/constants.js`](../app/components/return-items-modal/constants.js);
  cancel and tracking copy are inline `react-intl` messages. Localize or reword via
  translation files.
- **Error mapping**—extend `ERROR_CODE_TO_KIND` in
  [`return-error-utils.js`](../app/utils/return-error-utils.js) to give a new return
  `errorCode` its own inline message instead of the generic fallback.
- **Status labels and colors**—override the labels and badge styling in
  [`OrderStatusBadge`](../app/components/order-status-badge/index.jsx); the pure
  aggregation in [`order-status-utils.js`](../app/utils/order-status-utils.js) stays
  presentation-free.
- **Tracking links**—the external-URL hardening lives in
  [`ensureExternalUrl`](../app/utils/url.js); tighten or relax the allowed schemes
  there.
