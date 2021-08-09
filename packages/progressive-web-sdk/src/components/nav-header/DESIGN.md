# Design

## Related Components

- [Nav](#!/Nav)
- [NavItem](#!/NavItem)
- [NavMenu](#!/NavMenu)
- [NavSlider](#!/NavSlider)

## UI Kit

![](../../assets/images/components/nav-header/navheader-uikit.png)

*Symbol Path: global -> Nav*

## Purpose

The nav header is used within the [Nav](#!/Nav) component in predominently two ways:
1. To hold the nav component's close button and other content outside of the product navigation.
2. When there is the need for a navigation structure of multiple tiers/levels - the NavHeader provides the user with feedback as to which category they are in and a way to return to the previous level.

## Appropriate Uses

- Within the nav component as a top header bar containing the close button.
- Within the nav component, after a user has selected a top level category.
- At the top of a navigation tier, providing a link to go back to the previous level.
- Links to language switching.

## User Interactions

- Tap on a close button to close the nav component.
- User can tap on a back button in the header to move back to the previous tier.

## Usage Tips & Best Practices

- If using a smaller version of the customer logo in the main site header, the NavHeader can be a good place to use a larger version.
- Use a left chevron, the word "Back" or both to communicate the action of moving back a level.
- Visually help the user understand that the header is not a navigation item by giving it a different background color.
- It can visually aid hierarchy to use a heavier font weight for the current category.

## Accessibility

- If using a background color, ensure the font color of the category heading passes color contrast guidelines. Grey on Grey is very difficult to read unless the contrast is very high.
- If using an x icon for the close button, consider the user's ability to understand what this does. Are they likely to have been exposed to this action before? If in doubt back the icon up with a text label.

## Example Implementations

### Babista:

![](../../assets/images/components/nav-header/navheader-babista.png)

### Lancome:

![](../../assets/images/components/nav-header/navheader-lancome.png)
