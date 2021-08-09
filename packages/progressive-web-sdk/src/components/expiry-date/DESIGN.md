# Design

## Related Templates

- [CheckoutPayment](#!/CheckoutPayment)

## UI Kit

![](../../assets/images/components/expiry-date/expirydate-uikit.png)

*Symbol Path: form -> Field*

## Purpose

Expiry dates are used to verify card data, typically when completing the checkout.

## Appropriate Uses

- On the payment step of the checkout when a user is inputting their card details to pay.

## User Interactions

- User will use the number pad on the native keyboard to input 2 numbers for day and 2 or 4 numbers for the year.

## Usage Tips & Best Practices

- Ensure the keyboard is contextual and set to numbers only.
- Validate the form to only accept numbers.
- Use an input mask to automatically input the / sign.
- Validate the form to only accept the defined number of digits (e.g 4 for dd/yy or 6 for dd/yyyy).

## Accessibility
- Ensure the form has placeholder values to indicate to the user how many digits to enter for year (yy or yyyy).

## Example Implementations

### Merlin's Potions:

![](../../assets/images/components/expiry-date/expirydate-merlins.png)
