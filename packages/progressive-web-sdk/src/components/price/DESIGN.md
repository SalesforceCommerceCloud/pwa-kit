# Design

## Related Components

- [Ledger](#!/Ledger)
- [Tile](#!/Tile)

## UI Kit

![](../../assets/images/components/price/price-uikit.png)

*Symbol Path: product -> Price*

## Purpose

Price appears whenever a product is shown to display the cost of that item and whether it is on sale.

## Appropriate Uses

- Within the product [tile](#!/Tile) component on a [product list page]((#!/Plp).
- On a [product detail page](#!/Pdp) above or below the product name.
- In the [shopping cart](#!/CheckoutCart) to show the price of each item.
- In the checkout wherever a summary of the products being purchased are offered to the user.

## User Interactions

- Prices are typically informational and do not have any associated interactions.

## Usage Tips & Best Practices

- If a website has sale pricing, use a neutral tone for the prices that are not on sale and a striking tone (typically red) to draw attention to sale items.
- Sale pricing should always be accompanied by a previous price.
- Differentiate previous prices using size, color and/or decoration (e.g. strikethrough).
- Be clear with the dollar sign if the price is not in US dollar (e.g. us CAD or CA$ for Canadian dollar).
- Consider the spacing dedicated to pricing. Prices are controlled by the client and designers should be aware that some prices may vary extensively in number of characters.
- European pricing may use commas instead on decimals (see Babista example below).

## Accessibility

- Do not assume users will know that a previous price is not the final price without using either a strikethrough or the word "Was".
- Do not rely solely on color to differentiate previous price from sale price.
- Long prices are easier to comprehend when separated by commas. Be sure to add a comma after every 3 characters (e.g. $1000 should read $1,000).

## Example Implementations

### Babista:

![](../../assets/images/components/price/price-babista.png)

### Lancome:

![](../../assets/images/components/price/price-lancome.png)

### Merlin's Potions:

![](../../assets/images/components/price/price-merlins.png)
