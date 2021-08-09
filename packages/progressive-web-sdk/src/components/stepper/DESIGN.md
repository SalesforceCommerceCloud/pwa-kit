# Design

## Related Components

- [Field](#!/Field)
- [Button](#!/Button)
- [Icon](#!/Icon)

## UI Kit

![](../../assets/images/components/stepper/stepper-uikit.png)

*Symbol Path: form -> input -> Stepper*

## Purpose

Steppers are used to give the user a simple way to increase or decrease quantities by increments of one at a time.

## Appropriate Uses

- As an alternative to select menus or input fields when selecting item quantity.
- When choosing quantity on a PDP.
- When adjusting quantity in the shopping cart.
- On any form where it makes sense to have a default value that typically increases by one increment at a time.

## User Interactions

- Tap on the + button to increase value by 1.
- Tap on the - button to decrease value by 1.
- If in the shopping cart when value=1, tapping on the - button with remove the icon from the cart.
- User can tap on the number value to specify an input using the native number pad.

## Usage Tips & Best Practices

- Steppers are proven to be a more useful interaction than select menus or input fields for selecting quantity, and is a widely recognized pattern. Favor this over any alternatives.
- Do not use steppers where users are not likely to adjust increments by one each time. This will result in a poor user experience.
- Ensure disabled states are utilized when the value has reached maximum or minimum.
- Steppers should always default to 1 on PDPs (unless product inventory demands otherwise).
- Steppers on PDPs shouldn't ever have a 0 value. If item is out of stock use the [feedback](#!/Feedback) component to communicate this.
- Steppers in the shopping cart should be able to go down to 0, this would remove the item from the cart.

## Accessibility

- If using a stepper in the shopping cart where value:0 removes the item, ensure there is a confirmation dialogue in place to prevent users accidentally tapping the - icon too many times losing their items.
- Disabled states should rely on more than color and opacity to differentiate from the active state.
- Ensure there is enough space allocated to the icons and the field parts of the component to conform with minimum tap targets (usually 44px).

## Example Implementations

### Lancome:

![](../../assets/images/components/stepper/stepper-lancome.png)

### Merlin's Potions:

![](../../assets/images/components/stepper/stepper-merlins.png)
