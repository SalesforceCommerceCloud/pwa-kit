# Design

## Component Group

- [Swatch](#!/Swatch)
- [SwatchItem](#!/SwatchItem)

## UI Kit

![](../../assets/images/components/swatch/swatch-uikit.png)

*Symbol Path: product -> Swatch*

## Purpose

Swatches are used to display the variations of a product, and allow the user to select a variation before purchasing.

## Appropriate Uses

- On a [PDP](#!/Pdp) within the [product options](#!/ProductOptions) section to select size, color etc. before adding to cart.
- On a [PLP](#!/Plp) typically to show the availability of that product in other colors.
- On a [PLP](#!/Plp) to toggle the product image, typically to quickly view that product image in a different color.
- A more usable alternative to displaying product options than select menus.
- Within the [filter](#!/Filtering) menu typically for the color filter interaction.

## User Interactions

- Tap on an inactive swatch to select that option.
- Active swatches typically do not have associated interactions.
- Disabled swatches do not have associated interactions.
- Tapping on a swatch may result in a change of image both on a PLP and PDP.
- Tapping on a swatch or combination of swatches may result in a adjustment to the price on a PDP.
- Tapping on a swatch or combination of swatches may result in a change to the product availability on a PDP.

## Usage Tips & Best Practices

- Ensure swatches have an active, inactive and disabled state.
- The [badge](#!/Badge) component may be overlaid on a swatch to communicate that product option's availability.
- Do not hide out of stock options, instead use disabled states. This is important as users may wish to come back to check availability another time.
- Only use swatches for product options when the values are short. Multiple swatches when the options have a lot of text results in a cluttered layout and a poor user experience.
- Swatches are more effective than select menus as they show all the available options upfront. However, consider the cognitive load of using swatches for products with a large number of options. In this case a select menu may improve the UI.

## Accessibility

- Ensure active states are labelled by more than a change in color. Consider using a thicker border to help colorblind users.
- Disabled states should rely on more than color and opacity to differentiate from the active and inactive states. Consider using a diagonal line across the swatch.
- No matter how small the value in the swatch, ensure this has a minimum height and width to conform with minimum tap targets (typically 44px).
- If displaying color, always back this up with a text label.

## Example Implementations

### Babista:

![](../../assets/images/components/swatch/swatch-babista.png)

### Lancome:

![](../../assets/images/components/swatch/swatch-lancome.png)
