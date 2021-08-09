<div style="color:red; margin-bottom:20px;">
    This is a template made up of several components.
</div>

## Common Components

- [ProgressSteps](#!/ProgressSteps)
- [Field](#!/Field)
- [FieldRow](#!/FieldRow)
- [HeaderBar](#!/HeaderBar)
- [Button](#!/Button)
- [Accordion](#!/Accordion)
- [Ledger](#!/Ledger)
- [LedgerRow](#!/LedgerRow)

## UI Kit

![](../../assets/images/templates/checkout-payment/payment-uikit.png)


## Purpose

To capture the payment information required to complete the purchase. This includes card details and a billing address. The page gives the user a chance to review the details of their cart before placing the order.


## Appropriate Uses

- The next step after completing the shipping page.
- The final step before placing an order.
- Used to consolidate the payment step with a review step.


## User Interactions

Primarily form inputs. Interactions vary if a user is logged in.

### Input payment information
Form fields to capture the required payment details.

### Specify different address for billing
Deselect “same as shipping address” to specify a separate address for billing.

### Add a promo code
Allows user to apply a promo code if they didn’t do this in the shopping cart.

### Select a saved card (logged in)
Existing customers can select a previously used card.

### Add a new card (logged in)
Existing customers choose to input new card information.

### Used saved address for billing (logged in)
Existing customers not using their shipping address as billing can select a previously saved address as billing address.


## Usage Tips & Best Practices

- Cardholder name should be pre-filled using the full name field from the shipping step.
- Card type should be automatically defined using data inputted into the card number field.
- The correct image for how to find the CVC code should be shown based on the card type.
- Same as shipping address should contain the address entered in the shipping address step so that the user can review the input.
- Same as shipping address should be checked by default.
- Use contextual keyboards where appropriate - card number, expiry date and CCV should use the numerical keypad.
- Use input masks where applicable to ensure data is inputted correctly. For example, add spaces to the card number field to separate 4 numbers and add a slash (/) in the date input.
- Ensure the expiry field has a placeholder for how the user should enter the date e.g. mm/yyyy.
- Ensure a user can tab directly to the next field using the native keyboard.
- Inline validation should be utilized reduce post submit errors.
- Once all the information is inputted and validated inline, introduce a duplicate place order button and stick this to the bottom of the browser.
- Ensure the sticky Place Order button is around a touch area’s distance from the bottom of the browser to cope with the Safari deadzone. A total price can be added to fill this gap.
- Remove this duplicate button from view (animate down) when the user scrolls down far enough that the primary button is in view.
- Show the cart contents below the place order button for the user to review.
- Show the shipping and tax values using the Ledger component.
- Show the selected shipping method here for the user to review.
- Add secure logos and icons to give the buyer confidence.
- Ensure the browser or device’s back button navigates back to the shipping step.

## Variations & States

### Logged in
Logged in users can choose from a number of pre-saved cards or add new cards

### Pay with Paypal
Some customers may offer Paypal as a method of payment. If a user chooses this, the card details will be hidden and the Place Order is replaced with “Proceed to Paypal” where they will complete the purchase.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/templates/checkout-payment/payment-merlins.png)
