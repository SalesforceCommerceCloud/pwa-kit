<div style="color:red; margin-bottom:20px;">
    HamburgerMenu is a design pattern, not a component.
</div>

## Related Components

- [Nav](#!/Nav)
- [HeaderBar](#!/HeaderBar)

## UI Kit

![](../../assets/images/patterns/hamburger-menu/hamburger-uikit.png)

## Purpose

Hamburger menus are a popular top-level navigation pattern on the mobile web and in apps. They are useful at housing all the global links to things like product categories and my account, that would otherwise take up too much space on the small screen.

## Appropriate Uses

- Primary navigation on mobile websites.
- Primary navigation in Android and iOS apps.
- Alternative to a tabbed navigation structure.
- A place to group links that need to be accessed globally.

## User Interactions

- Tapping the icon opens up a previously off-screen menu of navigation options.
- A menu hidden off-screen to the left or right should be closed when the user swipes across the screen in the opposite direction.

## Usage Tips & Best Practices

- The hamburger menu is a widely recognized pattern on the web and in apps.
- Hamburger menus hides important navigation options from view [check this article](http://www.lukew.com/ff/entry.asp?1945). Consider using a navigation method that surfaces top product category links, such as a tabbed navigation structure, if this will work for the project.
- This pattern is an effective way of de-cluttering each page from global links that do not relate to the user's current task. Consider using a hamburger menu if a project requires a lot of global links unrelating to page content.
- The hamburger menu is expected in the top left corner. Beware of placing this interaction anywhere else.

## Accessibility

- The hamburger menu is a widely recognized pattern, however research has shown that adding the label "Menu" can [increase user interactions](http://www.bbc.com/news/magazine-31602745).

## Example Implementations

### Lancome (hamburger and tabbed navigation)

![](../../assets/images/patterns/hamburger-menu/hamburger-lancome.gif)

### Paula's Choice

![](../../assets/images/patterns/hamburger-menu/hamburger-paulas.gif)
