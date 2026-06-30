# Order Management

The order detail page surfaces three [Salesforce Order Management
(OMS/SOM)](https://help.salesforce.com/s/articleView?id=commerce.order_management.htm)
shopper actions: **returning** eligible items, **cancelling** an order, and
**tracking** shipments. All three are driven by the OMS data attached to the order —
eligibility, returnable/cancellable quantities, statuses, and tracking details come
from OMS — and the authoritative accept/reject for the mutating actions happens
server-side via the corresponding order action.

There is **no feature flag**. Each action is gated entirely on data and shopper
identity in [`order-detail.jsx`](../app/pages/account/order-detail.jsx). ECOM-only
orders (no `omsData`) never expose the return or cancel flows, and fall back to raw
order/shipment status everywhere.

## Prerequisites

These features require a **Salesforce Order Management (SOM) core org connected to
the storefront's B2C Commerce instance**. SOM is what enriches orders with the
`omsData` this UI depends on — order- and item-level OMS data (returnable/cancellable
quantities, item statuses, shipment tracking) and the `oms-return-order` /
`oms-cancel-order` SCAPI order actions. See the [Order Management
setup](https://help.salesforce.com/s/articleView?id=commerce.order_management.htm)
docs for connecting and provisioning the org.

Without a connected SOM org, orders carry no `omsData`: they are treated as ECOM-only,
the return and cancel actions never render, return reasons can't load, and the status
badge falls back to the raw `order.status`. Nothing errors — the features simply stay
hidden. There is no storefront flag to turn them on; presence of OMS data on the order
is the switch.

## Order Returns

Registered shoppers can return eligible items. A shopper opens the **Start a return**
modal, picks items and per-item quantities, chooses a reason, reviews, and submits.
The order status badge then reflects the return's progress, including
partially-returned multi-unit lines.

### Eligibility

| Condition | Source | Meaning |
| --- | --- | --- |
| Registered shopper | `useCustomerType().isRegistered` | Guests never see the return UI. |
| Owns the order | `order.customerInfo.customerId === customerId` | A shopper can only return their own orders. |
| OMS-managed order | `!!order.omsData` | ECOM-only orders carry no OMS data. |
| Has returnable items | `getReturnableItems(order).length > 0` | At least one line has `omsData.quantityAvailableToReturn > 0`. |

### How It Works

1. **Determine returnable items.**
   [`getReturnableItems(order)`](../app/utils/return-utils.js) filters
   `order.productItems` to those whose `omsData.quantityAvailableToReturn` is a
   positive number. We trust that field verbatim rather than maintaining a
   client-side status allowlist.
2. **Load return reasons.** The modal calls
   [`useOmsMetaData`](https://github.com/SalesforceCommerceCloud/commerce-sdk-react)
   and reads `returnReasonCodes` (`{reason, default}` entries). The OMS-default
   reason is pre-selected for every checked item.
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

Reasons are not hard-coded — they come from OMS via
`useOmsMetaData().returnReasonCodes`, where each entry is `{reason, default}`. The
entry flagged `default: true` is pre-selected and omitted from the request body so
the server applies it. Change the available reasons in Order Management; no
storefront change is needed.

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
**Cancel order** button renders unconditionally (so its position is stable) but is
disabled — with a screen-reader hint explaining why — when the order isn't eligible,
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
cancelled in full. Once any unit has shipped, the order is no longer cancellable.

### How It Works

1. The shopper confirms in the
   [`CancelOrderModal`](../app/components/cancel-order-modal) (optionally supplying a
   reason).
2. The page submits via
   `useShopperOrdersMutation(ShopperOrdersMutations.CancelOmsOrder)`
   (`POST .../actions/oms-cancel-order`); the `reason` is sent only when provided.
3. On success an "Order cancelled" alert is shown (after a short delay so screen
   readers finish announcing the modal close) and the order status badge flips to
   **Cancelled**.
4. On failure, cancellation follows the same convention as returns (see
   [Error Handling](#error-handling) above): a `404` or `409` is **terminal** — the
   order can no longer be cancelled, so the button is permanently disabled with an
   explanatory hint — while any other error shows a generic, retryable message. Unlike
   returns, cancellation has no per-`errorCode` classifier; it keys off the HTTP
   status alone.

Return feedback is kept separate from cancel feedback so the **Cancelled** badge
(which keys off the cancel result) never fires on a return success.

## Order Tracking

[`OrderTracking`](../app/components/order-tracking) is a presentational block
rendered once per shipment on the order detail page. It shows the shipping method
heading, the localized shipping status, the provider name, the tracking number, and —
when present — the expected and actual delivery dates.

Key behaviors:

- **Carrier link safety.** When a tracking URL is available, the tracking number is
  hyperlinked through [`ensureExternalUrl`](../app/utils/url.js), which normalizes the
  scheme and rejects unsafe inputs (`javascript:` URLs, host-spoofing like
  `https://www.ups.com@evil.com`, and relative paths) — returning `undefined` so the
  number renders as plain text instead. Otherwise the tracking number is shown
  unlinked.
- **Date guarding.** Missing, null, or unparseable delivery dates render nothing
  rather than a misleading value. The `!value` guard is load-bearing: `new Date(null)`
  returns the epoch (1970-01-01), not an Invalid Date, so without it a null delivery
  date would display "31 Dec 1969".
- **OMS-over-ECOM fallback.** The component receives already-resolved scalar props;
  the fallback that prefers OMS shipment fields over ECOM ones lives at the call sites
  in `order-detail.jsx`.

### Multi-shipment (limited support)

Shipment data arrives on the order in two separate lists with no correlation key
between them: tracking info (status, tracking number/URL, dates) in
`order.omsData.shipments`, and shipping addresses in `order.shipments` (ECOM
delivery groups). The two lists can't be reliably paired — ECOM models a *delivery
group* (the shopper's intent: which items go to which address) while OMS models a
fulfillment *shipment* (a physical package), and a single delivery group can fan out
into several OMS shipments (e.g. units of one line shipped from different
warehouses). Pairing by index would risk showing the wrong address against a
tracking number.

The agreed scope is therefore **a flat list with no address association**:

- Tracking renders as a flat list of cards, one per `order.omsData.shipments[]` entry
  (falling back to `order.shipments[]` when there are no OMS shipments). Each card
  shows the carrier/provider, status, the tracking number as a carrier link, and the
  expected/delivered dates.
- **No per-shipment shipping address and no positional OMS↔ECOM index-join.** A single
  order-level Shipping Address block is shown only for single-shipment delivery
  orders; multi-shipment orders omit it. The address is reachable through the carrier
  tracking link anyway, so nothing is lost and nothing is mispaired.
- A single order-level **Track Shipment** action links to the first shipment with a
  carrier URL (disabled when none). _(Arriving via PR #3906; not yet on this branch.)_

Multi-shipment **grouped by address** is out of scope, deferred to a TD pending SCAPI
returning correlated address data on `order.omsData.shipments`.

## Status Badge

The order status badge reflects fulfillment, cancellation, and return progress in one
place. [`getOrderDisplayStatus(order)`](../app/utils/order-status-utils.js) aggregates
item-level SOM statuses into a single order-level display status, because SOM exposes
status per line item rather than a reliable order-level status.

> **Status is computed from item-level OMS data — by design, not preference.**
> The order-level `omsData.status` is known to be unreliable: in SOM it can stay
> `Approved` even after every item has been cancelled or returned, because the
> order-level rollup lags behind (or never reflects) the item-level state. The
> item-level `omsData` *is* updated correctly, so this storefront derives the
> displayed status entirely from the per-item (and per-unit) data and never trusts
> the order-level status field. This is a known SOM limitation outside the
> storefront's control; if the badge looks "wrong" versus the SOM order record, the
> SOM order-level status is the stale side, not the badge.

Aggregation works at the **unit** level, not the line level. A line with
`quantityOrdered > 1` can straddle several states at once (e.g. 1 of 2 units returned
while the other ships). `getItemUnitBuckets` reconstructs the true per-unit breakdown
from the quantity fields (`quantityCanceled`, `quantityReturned`,
`quantityReturnInitiated`, and the remainder), so a partially-returned or
partially-cancelled multi-unit line reads correctly instead of masquerading as merely
"in progress".

The return-related display statuses —

- `RETURN_INITIATED`
- `PARTIAL_RETURN_INITIATED`
- `RETURN_COMPLETE`
- `PARTIAL_RETURN_COMPLETE`

are grouped by `isReturnDisplayStatus`. The
[`OrderStatusBadge`](../app/components/order-status-badge/index.jsx) renders these in a
neutral badge with their own localized labels, leaving the cancelled (red) and
raw-status (green) branches untouched. ECOM-only orders, which carry no item-level OMS
status, fall back to the raw `order.status`.

## Customization

The pieces a project most commonly overrides:

- **Eligibility** — adjust the gating (`showStartReturn` / `canCancel`) in
  [`order-detail.jsx`](../app/pages/account/order-detail.jsx), or the predicate in
  [`getReturnableItems`](../app/utils/return-utils.js), if your business rules differ.
- **Messages** — return modal copy lives in
  [`return-items-modal/constants.js`](../app/components/return-items-modal/constants.js);
  cancel and tracking copy are inline `react-intl` messages. Localize or reword via
  translation files.
- **Error mapping** — extend `ERROR_CODE_TO_KIND` in
  [`return-error-utils.js`](../app/utils/return-error-utils.js) to give a new return
  `errorCode` its own inline message instead of the generic fallback.
- **Status labels and colors** — override the labels and badge styling in
  [`OrderStatusBadge`](../app/components/order-status-badge/index.jsx); the pure
  aggregation in [`order-status-utils.js`](../app/utils/order-status-utils.js) stays
  presentation-free.
- **Tracking links** — the external-URL hardening lives in
  [`ensureExternalUrl`](../app/utils/url.js); tighten or relax the allowed schemes
  there.
