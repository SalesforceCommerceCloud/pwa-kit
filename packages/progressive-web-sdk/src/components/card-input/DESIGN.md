## Related Components/Templates

- [CardVerification](#!/CardVerification)
- [CheckoutPayment](#!/CheckoutPayment)

## UI Kit

![](../../assets/images/components/card-input/cardinput-uikit.png)

*Symbol Path: form -> Field*

## Purpose

The CardInput component is used on the payment step of checkout as a dynamic form input field. It is designed to save the user time by pre-detecting the card type based on the card number.

## Appropriate Uses

- In place of a basic field for capturing Card Number.
- In the payment step of checkout or anywhere where credit card number and card type is captured.

## User Interactions

- User enters their credit card number into the field via system keyboard

## Usage Tips & Best Practices

- Input masks are utilized in the form field to visually separate 4 digits at a time, improving legibility.
- A number pad should be defined as the contextual keyboard.
- Use SVGs for card logos in order to maintain legibility at all screen sizes.
- Restrict characters to only accept numbers in order to reduce errors.
- Card is best positioned on the right of the form field.
- Ensure all card logos are the same width and height.

## Accessibility

- Ensure card logos are fully legible - use the logo of the company instead of a picture of the card in order to maximize legibility at a small size.

## Examples

### Merlin's Potions:

![](../../assets/images/components/card-input/cardinput-merlins.png)

### Lancome:

![](../../assets/images/components/card-input/cardinput-lancome.png)
