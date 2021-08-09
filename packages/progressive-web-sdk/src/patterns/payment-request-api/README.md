<div style="color:red; margin-bottom:20px;">
    Payment Request API is browser-powered UI, not an SDK component.<br> [Read guides on how to implement this feature](https://docs.mobify.com/progressive-web/latest/guides/payments/)
</div>

## Related Templates

- [CheckoutCart](#!/CheckoutCart)
- [CheckoutPayment](#!/CheckoutPayment)

## UI Kit

![](../../assets/images/patterns/payment-request-api/prapi-uikit.png)

## Purpose

Payment Request API is a [W3C standard candidate](https://www.w3.org/TR/payment-request/) designed to speed up the checkout process on mobile. The Payment Request sheet leverages data stored on the browser to allow users to complete a multi-step checkout with a single interaction.

## Appropriate Uses

- [It's currently available](https://caniuse.com/#feat=payment-request) on Chrome for Android, Microsoft Edge, and Samsung Internet.
- As a express checkout for guest users.
- To bypass certain parts or the checkout, or the checkout process entirely.

## User Interactions

- The Payment Request sheet should be initiated by a 'Proceed to Checkout' or 'Buy Now' button.
- The interactions within the sheet itself are configurable but the UI is powered by the browser and cannot be altered within the project.
- The sheet's interactions include adding addresses and card details (if none have been previously saved), or simply using a fingerprint/faceID to confirm the purchase.
- The shopper is able to select from a number of different payment types within the sheet. This includes Android Pay (if already set up on the device) and credit cards, with Paypal in development.

## Usage Tips & Best Practices

- The shopper neither knows nor cares about Payment Request API. It should be invisible to them as an idea, reducing friction rather than inciting confusion as to what the feature is.
- The shopper never _chooses_ to use Payment Request API, they only choose to checkout. The sheet is simply a means to do that quickly.
- Payment Request serves guest users best since it has access to personal information without the user needing to log in to the website. Payment Request should therefor be placed before a login screen.
- The most optimal place to introduce the payment request sheet is on the shopping cart. This allows the shopper to build up an order over time with multiple items and benefit from other interactions in the cart such as estimating shipping and adding gift/promo codes.
- If the target shoppers are those that tend to place frequent low priced orders, the Payment Request sheet may be used behind a Buy Now button on the PDP to facilitate compulsive buying.
- Payment Request API should be treated as the primary method of payment. If the website offers payment types that are not supported, such as VISA Checkout, store credit cards or Paypal, it is important to present these outside of the primary checkout button as secondary options.
- Certain checkout interactions are not supported within the Payment Request sheet, gift message functionality for example. If these interactions are integral to the website, the data must be captured before triggering the sheet.
- Card information should always be the final entry before the purchase is made. Therefor the Payments Request sheet should be the last interaction the user performs before the order is confirmed.
- Non-required data such as special instructions or newsletter signups can be captured on the confirmation page.
- UX should be carefully considered and communicated with the client to decide whether the Payment Request can and should be used in place of the traditional checkout.

[Read the design guides](https://docs.mobify.com/design/build-phase/payments) for more detailed information around Payment UX considerations.

## Accessibility

- The sheet should always be triggered by an action button to "Checkout" "Buy" or "Pay".
- The sheet should appear in front of a opaque background to focus the user and disable all other interactions below the sheet.

## Example Implementations

### Merlins Potions

![](../../assets/images/patterns/payment-request-api/prapi-merlins.png)
