# Design

## Component Group

- [Sheet](#!/Sheet)

## UI Kit

![](../../assets/images/components/sheet/sheet-uikit.png)

*Symbol Path: product -> ProductReviewSummary*

## Purpose

A modal window that that opens from any side (top, right, bottom, left) or from the center of the screen. Its purpose is to focus the user's attention on a new task whilst maintaining the context of the previous journey. A sheet can contain any combination of components and content.

## Appropriate Uses

- A sheet should overlay the main body area instead of displacing it.
- A sheet should be used to hold sub-tasks or messaging as part of a larger user journey.
- Common usage for sheets include navigation drawers, informational dialogues, filtering on the PLP, tooltips, estimating shipping in the shopping cart and showing product reviews on a PDP.

## User Interactions

- Sheets should always contain a Close button to return back to the original state.
- If using Sheet as a modal dialogue, this should always have a primary action. This could simply be an action to close the window or it could be navigational (e.g. a 'Proceed to checkout' action in an Added To Cart modal).
- All other interactions within a sheet depends on the components used.

## Usage Tips & Best Practices

- Use the [Lockup](#!/Lockup) component on the container below any sheet to ensure the user cannot scroll the content behind.
- In order to give context to the journey below, it is recommended that a sheet occupy only a portion of the screen rather than the entire window.
- Setting a Sheet to display full screen is possible, however consider the negative effect that this may have on a user's understanding of their place within a larger journey.
- When deciding on the position of a sheet (top, right, bottom, left), consider the position of the button that activated the sheet. Typically, buttons placed on the left of the display will open a sheet from the left (e.g. the [hamburger menu](#!/HamburgerMenu) and navigation drawer).
- If using a 'short sheet' (positioned at the bottom of the screen), consider the Safari deadzone when placing items at the base of the modal. Users tapping this space on iOS Safari will cause the browser chromes to appear instead of initiating the action. This frustrates users. A handy tip is to add some non-clickable content below the action button to naturally push button above the deadzone tap target
- When overlaying a sheet over the top of the main content, use an opaque layer in order to focus attention on the modal whilst giving context to the page below.

## Accessibility

- When setting the style for translucent layers, be aware of the effect contrast can have on cognitive load. If the opacity contrast is too fine, this may result in the main window losing its focus.
- If using an x icon for the close button, consider the user's ability to understand what this does. Are they likely to have been exposed to this action before? If in doubt back the icon up with a text label.

## Example Implementations

### Lancome (example of Safari deadzone issue):

![](../../assets/images/components/sheet/sheet-lancome.gif)

### Merlin's Potions:

![](../../assets/images/components/sheet/sheet-merlins.png)

### Babista:

![](../../assets/images/components/sheet/sheet-babista.png)
