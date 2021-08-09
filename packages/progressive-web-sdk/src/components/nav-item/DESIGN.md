# Design

## Related Components

- [Nav](#!/Nav)
- [NavHeader](#!/NavHeader)
- [NavMenu](#!/NavMenu)
- [NavSlider](#!/NavSlider)

## UI Kit

![](../../assets/images/components/nav-item/navitem-uikit.png)

## Purpose

A NavItem is used for the various links to product categories within the navigation. These are contained within [NavMenu](#!/NavMenu).

## Appropriate Uses

- NavItems are grouped together to compose the navigation of a site.
- This component can be used to hold links to product list page and also to reveal a deeper set of links within the NavMenu.

## User Interactions

- Tap on a NavItem to navigate to a CLP or PLP.
- Tapping on a different NavItem may open the next set of navigation items within a multi-tiered navigation structure.

## Usage Tips & Best Practices

- Visually differentiate NavItems that lead to a page from those that lead to another set of navigation items.
- Those that lead to another set of items typically have a right chevron positioned at the end of the row.
- Differentiating text size or background color can help to create a visual hierarchy throughout the navigation tiers.
- If heading up a set of product categories with "View all ..." make this visually stand out (e.g. use a heavier weight).

## Accessibility

- If using a background color, ensure the font color of the category heading passes color contrast guidelines. Grey on Grey is very difficult to read unless the contrast is very high.

## Example Implementations

### Babista:

![](../../assets/images/components/nav-item/navitem-babista.png)

### Lancome:

![](../../assets/images/components/nav-item/navitem-lancome.png)
