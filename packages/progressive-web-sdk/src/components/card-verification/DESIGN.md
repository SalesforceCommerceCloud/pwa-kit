# Design

## Related Components/Templates

- [CardInput](#!/CardInput)
- [CheckoutPayment](#!/CheckoutPayment)

## UI Kit

![](../../assets/images/components/card-verification/cardverification-uikit.png)

*Symbol Path: form -> Field*

## Purpose

The CardVerification component is used on the payment step of checkout as a dynamic form input field. It is designed to present the user with a helpful image on where to fine their CVV number. The image changes depending on the card type defined in previous fields.

## Appropriate Uses

- In place of a tooltip popup showing the user where to find their card security code.
- In the payment step of checkout or anywhere that a credit card number and card type is captured.

## User Interactions

- Image is automatically displayed after the user has entered their card number and a card type has been detected.

## Usage Tips & Best Practices

- A number pad should be defined as the contextual keyboard.\
- Normally only 2 images; AMEX and not-AMEX.
- Use SVGs for images in order to maintain legibility at all screen sizes.
- Restrict characters to only accept numbers in order to reduce errors.
- Restrict to a maximum of 3 digits.
- Image is best positioned on the right of the form field.

## Accessibility

- Ensure images are as legible as possible by using clear vector graphics.

## Examples

### Merlin's Potions:

![](../../assets/images/components/card-verification/cardverification-merlins.png)
