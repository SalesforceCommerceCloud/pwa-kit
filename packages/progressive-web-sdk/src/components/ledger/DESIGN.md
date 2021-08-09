# Design

## Component Group

- [Ledger](#!/Ledger)
- [LedgerRow](#!/LedgerRow)

## UI Kit

![](../../assets/images/components/ledger/ledger-uikit.png)

*Symbol Path: general -> LedgerRow*

## Purpose

A ledger comprising of a line item description and a value, displayed in a row typically aligned left and right respectively.

## Appropriate Uses

- In the [shopping cart](#!/CheckoutCart) to display the item total, tax, discount and order total, along with their corresponding monetary values.
- In the [payment](#!/CheckoutPayment) step of checkout to repeat the same content as the shopping cart before the final purchase decision.
- Anywhere where content is positioned left/right in this way, repeated vertically in a list.

## User Interactions

- Some LedgerRows may contain actions that remove the row or trigger an action that will adjust the value (e.g. the shipping calculate button on the shopping cart).

## Usage Tips & Best Practices

- A bottom border may be added to aid the visual separation between LedgerRows.
- LedgerRow styling should be adjusted for any row that indicates a total of a row of items above (e.g. Order total has a larger font size to indicate a summary of the rows above).
- Discounts should be styled to attract attention by using a callout color (typically red).

## Accessibility

- If including a link within a LedgerRow, ensure this is clearly indicated as a button by using the link color or underlining the text.
- Include a description with any LedgerRow that is not self explanatory.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/components/ledger/ledger-merlins.png)

### Paula's Choice:

![](../../assets/images/components/ledger/ledger-paulas.png)
