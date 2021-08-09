# Design

## Component group

- [Grid](#!/Grid)
- [GridSpan](#!/GridSpan)

## UI Kit

**Note. This is not yet available in the official UI kit release, only in the sandbox version on Github.**

![](../../assets/images/components/grid/grid-uikit.png)

## Purpose

Grid is how Mobify will eventually serve responsive templates to tablet and desktop sized devices. It has only been implemented on the checkout part of the Scaffold (merlinspotions.com). Using the Susy grid framework, Grid positions and resizes components on a template using defined widths, columns and break points in order to visually optimize content to larger screen sizes.

## Appropriate uses

- When the scope of a project requires optimization for screen sizes larger than mobile.
- Grid can be used on any template that contains a component or a selection of components.

## User interactions

- It is possible for users to influence the way Grid structures components on a page by changing the orientation of their device from landscape to portrait.

## Usage tips & best practices

- Designers should define the break points and number of columns across all templates to the developer.
- Break points should be the same across the site.
- Designers should define how many equal-width columns a template should have at each break point. It is recommended these rules are kept the same for every template.
- Define how many columns each component should occupy at a particular break point.
- Designers should consider the orientation of a device the user may be browsing on at each break point (e.g. If a user is browsing at a width of 728px they are most likely to be on a portrait tablet device and have more vertical space that those on a 1024px width).

## Accessibility

- Do not assume that users on a width indicating that of a desktop device will be using a mouse. Design everything for touch tap targets.
- Do not assume that larger screen sizes mean users find it easier to view smaller text sizes. Accessibility guidelines on text sizing and color contrast should be adhered to for ALL devices.

## Examples

### Merlin's Potions checkout (iPad LS):

![](../../assets/images/components/grid/grid-merlins728.png)

### Merlin's Potions checkout (iPad PT):

![](../../assets/images/components/grid/grid-merlins1024.png)
