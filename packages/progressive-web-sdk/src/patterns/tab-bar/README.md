<div style="color:red; margin-bottom:20px;">
    This component is not yet available in the SDK. Consider this a design pattern.
</div>

## Purpose

Tab bars are the primary navigation control in iOS apps. They give people the ability to quickly navigate within an app and get an understanding of the app’s layout.

## Appropriate Uses

- Primary navigation in an iOS app.
- Not appropriate for mobile web. Sites like [Quartz](http://qz.com/) have experimented with them, but the cross-platform nature of the web precludes using OS-specific UI patterns.
- Not appropriate for Android. It isn't a standard pattern, and therefore out of place on that platform.

## User Interactions

- Tapping an icon immediately changes between views. State of previous view is preserved, so tapping back returns to wherever a user was in a flow.
- Tapping a 'More' tab exposes a menu of options.

## Usage Tips

- As this is the standard interaction model for iOS apps, it's highly recommended that you stick with this pattern unless you have a very good reason not to.
- The Tab Bar Pattern requires primary navigation re-thinking if the app is to exist on both Android and iOS, and a different visual design for each.

## Example Implementations

### ThinkGeek iOS App

Globally-available tab bar featuring Discover, Shop, Favorites, My ThinkGeek, and a More menu

![](../../assets/images/patterns/tab-bar/thinkgeek.jpeg)

### Ritchie Brothers iOS App

Globally-available tab bar featuring Auctions, Equipment, Profile, and a More menu

![](../../assets/images/patterns/tab-bar/ritchie-bros.jpeg)

## Variations & States

- Tab Bars offer a maximum of five primary modes. You can squeeze in more with an ellipses icon / More tab.
- Three icons are uncommon, tab bars usually contain four or five items.
- Icons and text are single-color, but you have full control over the foreground and background color.
- Tab bars can be opaque or translucent.
