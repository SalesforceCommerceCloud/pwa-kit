# Design

## UI Kit

![](../../assets/images/components/button/button-uikit.png)

*Symbol Path: action -> Button*

## Purpose

A button indicates an action. This action can link to a page, open a modal or can be used to change the state of the page UI. Buttons contain multiple state variations and can be styled to adopt different levels of emphasis (primary, secondary, etc.)

## Appropriate Uses

- Buttons are used in almost every template, often multiple per page.
- Primary buttons are used to denote primary tasks such as adding to cart, or proceeding to the next step in a multi step process (e.g. checkout).
- Multiple icon buttons are used in the header navigation to link to primary site sections.

## Usage Tips & Best Practices

- There should only ever be one primary button visible to the user at one time.
- Use secondary button styles when the action is less important than actions on the page adopting the primary style (e.g. add to wishlist vs add to cart).
- Use tertiary buttons when the action is less important that other actions on the page (e.g. newsletter signup form in footer)
- All buttons should have active and disabled states to let the user know when it is not clickable.
- All buttons should have 'tapped' and 'loading' states to give the user feedback that it has been tapped and the corresponding action is working.
- Icons can be added to buttons in order to bolster the messaging (e.g. lock icon added to 'check out' button indicates security).

## Accessibility

- Disabled state should rely on more than color/opacity to differentiate them from the active button state.
- Ensure color contrast of button text on background color meets a11y contrast guidelines. [Use this handy tool](http://www.contrastchecker.com).
- Buttons should be sized to fit minimal tap size (normally 44px).

## Example Implementations

### Lancome (disabled, active & tapped states)

![](../../assets/images/components/button/lancome-buttons.gif)

### Merlin's Potions (Primary and secondary)

![](../../assets/images/components/button/merlins-button.png)

### Paula's Choice (Half width)

![](../../assets/images/components/button/paulas-button.png)
