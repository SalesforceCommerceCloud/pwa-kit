# Design

## Related Components

- [NavHeader](#!/NavHeader)
- [NavItem](#!/NavItem)
- [NavMenu](#!/NavMenu)
- [NavSlider](#!/NavSlider)
- [Sheet](#!/Sheet)
- [Lockup](#!/Lockup)

## UI Kit

![](../../assets/images/components/nav/nav-uikit.png)

*Symbol Path: Homepage + Navigation*

## Purpose

The nav component is a panel that holds the site navigation, providing the user with way to access all product categories and other important pages.

## Appropriate Uses

- The nav is often accessed by an icon in the menu bar (typically a [hamburger menu](#!/HamburgerMenu)).
- Nav is the container that holds links to the main product categories.
- Often used to hold links to the customer's various social media channels.
- Often includes legal copy such as a copyright line.
- Typically contains a logged in/out status and links to the my account section.

## User Interactions

- Interactions within the nav component vary, but typically they will be made up of links, interactions that reveal child links within parent categories and a close button.
- User can also click outside the component to close the panel.

## Usage Tips & Best Practices

- Typically the Nav component is positioned within a left hand sidebar, but this is variable depending on the positioning of the button that opens it.
- Most users will expect Nav to open from the left, consider usability norms if choosing to position this anywhere else.
- Always have a close button as well as a link outside the component to close the navigation state. This close button is usually positioned in the top right of the component.
- The primary goal of any Nav component is to provide navigation. Links to anything else should be considered a lesser priority and designed as so.
- The Nav is a good place to hold global content that does not relate to the core user experience (e.g. social icons or external links to a blog). However, these should be positioned away from the core action of choosing a product category.
- Ensure the nav component has enough room to grow should the customer add more product categories.

## Accessibility

- Ensure a nav state is a focussed view, will clear context of the page beneath. This can be done using a translucent layer.
- When setting the style for translucent layers, be aware of the effect contrast can have on cognitive load. If the opacity contrast is too fine, this may result in the main window losing its focus.
- If using an x icon for the close button, consider the user's ability to understand what this does. Are they likely to have been exposed to this action before? If in doubt back the icon up with a text label.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/components/nav/nav-merlins.png)

### Lancome:

![](../../assets/images/components/nav/nav-lancome.png)
