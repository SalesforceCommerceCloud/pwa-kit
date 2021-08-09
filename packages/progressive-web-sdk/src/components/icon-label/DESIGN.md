# Design

## Related Components

- [Icon](#!/Icon)
- [HeaderBar](#!/HeaderBar)

## UI Kit

![](../../assets/images/components/icon-label/iconlabel-uikit.png)

*Symbol Path: icons -> IconLabel*

## Purpose

IconLabel is favored over Icon when the meaning of that icon may not be 100% clear to the user.

## Appropriate Uses

- In the header bar to enable multiple actions to fit in a small space.
- Anywhere where an icon is used instead of text, and where some users may struggle to comprehend the meaning of that icon.

## User Interactions

- Variable depending on the actions.

## Usage Tips & Best Practices

- Research has shown that using labels with certain icons improve comprehension and interactivity. A good example of this is the Hamburger menu.
- Do not use labels for icons where multiple instances of the same icon exists in the same place (e.g. no label is required for the + icons in an accordion)
- Users learn the meaning of an icon through repeat exposure, consider removing the labels from icons when the icon has already been seen multiple times. A good example of this is the fixed header bar where the labels are removed from the icons after the user starts scrolling.
- Keep the labels short. Icons are designed to occupy a small space and a long label will negate this benefit.

## Accessibility

- Ensure the label size is small, yet legible. Do not allow the text size to fall below 8px.
- With such a small text size, be extra careful with color contrast of the label on top of the background color. [Use this handy tool](http://www.contrastchecker.com) to test contrast.

## Example Implementations

### Lancome (shopping cart actions):

![](../../assets/images/components/icon-label/iconlabel-lancome.png)

### Pure Formulas (header bar and homepage):

![](../../assets/images/components/icon-label/iconlabel-pureformulas.png)
