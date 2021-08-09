# Design

## UI Kit

![](../../assets/images/components/badge/badge-uikit.png)

*Symbol Path: general -> Badge*

## Purpose

The badge calls attention to a particular action through an subtle yet attention grabbing piece of UI. A badge is used to show the user that there is important information to access behind an action, such as unread messages or items in a shopping cart.

## Appropriate Uses

- A badge on top of the shopping cart icon shows the number of items left in the cart.
- A badge on top of a particular list item can show that there are new items to be found in that section.
- A badge on top of a link can be used to show how many unread notifications there are.
- A badge on top of a product option can show a successful selection or that an item in stock

## User Interactions

- Badges should be placed on top of action buttons, and should therefore contain no independent interaction.

## Usage Tips & Best Practices

- Badges need to attract attention and should utilize a high contrast color.
- Users typically associate red with notifications, think carefully before deviating from this established mindset.
- Typically a badge contains a number, if this number cannot be fetched then a colored badge without a number is enough to serve the purpose of attracting attention.
- Numbers can grow to multiple digits, ensure the badge can grow to fit multiple characters or restrict the value shown (e.g. anything over 3 digits and more can be made to fit using using "99+" instead of expanding the actual number).
- A badge is best positioned in the top or bottom right of the action it relates to.

## Accessibility

- Text size in badges often needs to be kept small, ensure the color contrast between text and background color is as high as possible.
- Ensure text size does not decrease below 8px.

## Examples

### Babista (Items in Cart)

![](../../assets/images/components/badge/badge-babista.png)

### Lancôme (Item in stock)

![](../../assets/images/components/badge/badge-lancome.png)
