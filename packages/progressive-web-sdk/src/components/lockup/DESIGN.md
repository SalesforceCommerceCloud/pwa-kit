# Design

## Related Components

- [Sheet](#!/Sheet)

## Purpose

Lockup is used to prevent the user from being able to scroll.

## Appropriate Uses

- Applied to a page appearing behind a modal to prevent the user from scrolling content behind the active window.
- Applied to a page when content is loading in order to disable all other page actions.

## User Interactions

- By definition, Lockup disables all interactions on the element it is applied to.

## Usage Tips & Best Practices

- When lockup is applied to a container, use a translucent layer so that the user does not expect to be able to tap on any elements.
- A modal window above a translucent layer is a good way of giving the user content as to the overall task the current window relates to, however a strong enough contrast is required to keep focus on the active window.

## Accessibility

- When setting the style for translucent layers, be aware of the effect contrast can have on cognitive load. If the opacity contrast is too fine, this may result in the main window losing its focus.

## Example Implementations

### Babista:

![](../../assets/images/components/lockup/lockup-babista.png)

### Paula's Choice:

![](../../assets/images/components/lockup/lockup-paulas.png)
