# Design

## Component Group

- [HeaderBar](#!/HeaderBar)
- [HeaderBarActions](#!/HeaderBarActions)
- [HeaderBarTitle](#!/HeaderBarTitle)

## UI Kit

![](../../assets/images/components/header-bar/headerbar-uikit.png)

## Purpose

Header bars are used in both mobile web and apps to contain wayfinding and globally-available navigation options. The header is a source of truth at letting the user know where they are and offer links to the most important sections.

## Appropriate Uses

- Typically a header is comprised of buttons (icons with labels) and a logo.
- On the web, header bars tend to remain the same globally, as a user can deep link from search/social media and begin their experience from any page.
- App header bars tend to change to reflect the current page and offer links only related to that task.
- Header bars are typically `position:fixed` to the top of the viewport.
- Header bars typically hold the website logo, a menu to access the product catalogue, link to the shopping cart and search.
- Links to Stores and My Account is also commonly found in the header bar.
- Users browsing a PWA in full screen mode (added to home screen) may require some adjustment to the header bar in order to cope with the loss of the back button and sharing functions from the browser chrome. Design guides for this behavior are coming soon!

## User Interactions

- Variable depending on available actions.

## Usage Tips & Best Practices

- Fixed header bars are indicative of an app-like experience and are encouraged to be used on the mobile web. This approach also allows the user instant access to the shopping cart.
- Although a fixed header bar is encouraged, be aware that having too many pixels fixed on a small screen reduces the space used to display the current task. Ensure a fixed header bar takes up as little vertical space as possible.
- As above, ensure a fixed header bar is as simple in design as possible so as not to distract from the current task. See example below on how Lancome implement a simplified fixed header to reduce cognitive load yet maintain usability.
- Often the header bar will adopt a background color that matches the brand color. This is useful for users attempting to identify the website from others.

## Accessibility

- Do not assume that all users understand the meaning of all icons. Include labels beneath icons help improve comprehension.
- Reduce the vertical space occupied by fixed elements but do not allow this to reduce further than minimum tap target (typically 44px).

## Example Implementations

### Lancome

![](../../assets/images/components/header-bar/headerbar-lancome.gif)

### Paula's Choice

![](../../assets/images/components/header-bar/headerbar-paulas.png)

### ThinkGeek iOS App

![](../../assets/images/components/header-bar/headerbar-thinkgeek.png)
