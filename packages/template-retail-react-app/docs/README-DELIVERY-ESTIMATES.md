# PDP Delivery Estimates

The Retail React App can show an informational delivery estimate on a product
detail page (PDP). The estimate is a read-only, pre-checkout query: it does not
create or update a basket, choose a shipping method, change fulfillment, or
change pickup, cart, or checkout behavior.

The PDP requests an estimate for one product, a postal code, a country code,
and the current site. The delivery service remains authoritative for which
options are available and their delivery windows.

## Prerequisites

Before expecting estimates on a PDP, configure a delivery-estimate provider
for a non-production environment:

- Configure the provider Commerce App and bind it to
  `sfcc.app.shipping.estimate`.
- Give the storefront's Shopper API client the
  `sfcc.shopper-delivery-estimates` scope. A storefront that already needs the
  standard aggregate scope can use `sfcc.shopper-standard` instead.
- Use a site-assigned online PDP product that the configured provider can
  estimate for a serviceable destination.

The PDP calls a provider-neutral Shopper API. Provider setup is owned by the
merchant. For a Commerce Delivery Service-backed provider, this includes
connecting the B2C Commerce instance, configuring delivery-estimation carrier
methods and mappings for the site's products and fulfillment locations, and
completing the required synchronization to Commerce Delivery Service. Do not
add provider credentials or bearer tokens to a storefront project. The app
uses the configured PWA Kit Shopper API client through `useDeliveryEstimates`.

## PDP Behavior

The delivery-estimate calculator is rendered by
[`DeliveryEstimate`](../app/components/delivery-estimate/index.jsx) from the
PDP's [`ProductView`](../app/components/product-view/index.jsx). It calls the
Shopper Delivery Estimates API with the current site, one product ID, and a
destination postal code and country code.

The PDP displays only delivery options that:

- Do not contain `nonDeliverableReason`.
- Include parseable start and end delivery-window dates.
- Have a delivery-window start that is not after its end.

The summary and detail view use this same eligible-option set. The summary
selects the slowest eligible delivery window: latest start date, then latest
end date, then shipping-method ID as a deterministic tie-breaker. When more
than one eligible option exists, **View All Shipping Options** opens an accessible
dialog with every eligible option, including its shipping method, estimated
window, price when supplied, and description when supplied.

The estimate is not requested for a selected product whose inventory has an
available-to-sell count of zero or lower and is preorderable or backorderable.
The PDP's delivery and pickup controls remain available; the merchant's
inventory and checkout configuration determine their behavior.

The calculator labels validation and result states for assistive technology.
After a shopper submits a valid destination, a successful result is announced
and receives focus. The shipping-options dialog supports keyboard operation,
including its visible close control and standard dialog dismissal behavior.

## Destination Behavior

The calculator determines its starting destination in this order:

1. A valid `deliveryZipCode_<siteId>` browser cookie.
2. A registered shopper's saved address: preferred shipping address, then a
   shipping address, then billing address, then another preferred address, then
   the first saved address.
3. Shopper input.

The cookie stores a postal code and country code for the current site and
expires after 30 days. It is written only after a shopper explicitly submits a
destination that produces an eligible estimate. A registered shopper's address
is used for the current session but is not copied into the cookie. Guest
addresses are not used as an estimate source.

The site ID is a logical key in the cookie name, not a browser trust boundary.
The cookie is JavaScript-readable and contains location-related data. Unless
every subdomain is in the same trust boundary, leave `commerceAPI.cookieDomain`
unset so the cookie remains host-only. Apply the merchant's applicable consent,
privacy, and retention policy before enabling it across subdomains.

The default country comes from the active locale's region. Use locales with an
ISO country region, such as `en-US`, `en-GB`, or `fr-FR`. A locale without a
region does not provide a country for the estimate request.

## Empty And Unavailable Results

An unconfigured estimate provider can respond with HTTP 200 and an empty
response. The same shopper-facing unavailable state is used when the response
contains no eligible delivery window or returns HTTP 403 or 500. In each case,
the PDP retrieves the product's shipping methods. If a non-pickup catalog
description is available, it is shown in the selected **Delivery** option and
the calculator closes. The newly entered destination is not persisted.

If no usable catalog description is available, the calculator remains
available, does not show a delivery date, and uses this neutral fallback:

> Delivery dates unavailable. See checkout for options and costs.

Raw provider `nonDeliverableReason` values are never shown to shoppers.

## Merchant Verification

Run these checks only against a non-production storefront with the required
SLAS scopes and an active provider binding. Do not use production credentials
or production customer data.

1. Open a standard online PDP product and submit a valid, serviceable postal
   code. Configure or select a locale with the intended country/region, and
   clear an existing delivery-destination cookie when testing a new destination.
   Confirm an eligible delivery window is shown.
2. Select a product variant, submit the postal code, and confirm the estimate
   corresponds to that selected variant and the active locale country.
3. Reload the PDP after a successful explicit estimate. Confirm the site-scoped
   destination is reused.
4. Use a product or destination with multiple eligible options. Confirm **View
   All Shipping Options** moves focus into the dialog, `Tab` and `Shift+Tab`
   remain inside it, `Escape` and the visible close control close it, and focus
   returns to the trigger. Confirm it only shows options with valid delivery
   windows.
5. Verify an HTTP-200 empty response or a response with no eligible delivery
    options shows a non-pickup catalog shipping-method description in the
    selected **Delivery** option when one is configured. Confirm the newly
    entered destination is not persisted. Without a usable catalog description,
    confirm the calculator remains available without displaying provider reason
    text. When valid and invalid/non-deliverable options are returned together,
    confirm the valid options remain available and the other options are omitted.
6. Verify a controlled provider or API failure leaves the PDP usable and shows
    the unavailable state rather than failing the product page.
7. Verify a preorderable or backorderable product with zero available-to-sell
   inventory does not request or show a delivery estimate.
8. Recheck pickup selection, add-to-cart, basket, and checkout flows. Delivery
    estimates are informational and must not select shipping or change those
    flows.

For automated coverage, see
[`app/components/delivery-estimate/index.test.jsx`](../app/components/delivery-estimate/index.test.jsx),
[`utils.test.js`](../app/components/delivery-estimate/utils.test.js), and the
PDP integration coverage in
[`app/components/product-view/index.test.js`](../app/components/product-view/index.test.js).
