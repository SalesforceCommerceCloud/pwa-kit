<div style="color:red; margin-bottom:20px; margin-top:20px;">
    This is a design pattern made up of multiple components.
</div>

## Related Components

- [AddToHomescreen](#!/AddToHomescreen)
- [HamburgerMenu](#!/HamburgerMenu)
- [HeaderBar](#!/HeaderBar)
- [Share](#!/Share)

## UI Kit

![](../../assets/images/patterns/add-to-homescreen/addtohomescreen-ui-kit.png)

## Purpose

Add to Home Screen is a feature of the Chrome browser on Android that allows the
user to "install" a PWA to their home screen behind an app icon. The user can
then launch the PWA in the same way they might launch an app, as a focussed
experience without the browser bar (FullScreenMode).

## Appropriate Uses

- An alternative header bar component that reintroduces actions lost from
  removing the browser UI, such as Share, Back and Refresh.
- An overflow menu that allows all the necessary global actions to be kept in
  the header bar where there isn't a lot of space.

## User Interactions

- All actions in the header bar should perform the same action as the PWA header
  bar.
- The overflow button opens a menu of items, including links and triggers.
- Forward returns the user to the previous screen (after going back).
- Share triggers the [Web Share API](#!/Share).
- If a user pulls down while browsing PWAs from fullscreen mode, the refresh
  action in initiated the same way it is in the browser.
- If a user progresses past the initial page, the menu action is replaced by the
  back button.

## Best Practices

- To provide a cohesive experience with a native Android app, move the alignment
  of the logo in the header bar to the left, next to the menu icon.
- App icons should be exported in several sizes and named appropriately. Export
  guidelines can be found on [Google's Developer
  site](https://developer.chrome.com/multidevice/android/installtohomescreen)
- Use [Google's Material Design Icons](https://material.io/icons/) for the
  actions that replace the browser UI (like Back) to make the fullscreen PWA
  appear as a native Android app.
- Remove labels from icons in the header bar that mimic browser behavior because
  we can assume that if the user if familiar with the add to home screen
  feature, they will be clear on what these icons mean.
- The top actions in the overflow menu should mimic those found in the PWA
  header bar.

## Accessibility

- After the overflow menu is opened, disable all other actions on the page
  (including scrolling). Tapping outside the menu closes the menu.
- The header bar should be stuck to the top of the browser to aid navigation
  back and forward through pages.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/patterns/add-to-homescreen/addtohomescreen-merlins.png)

### Lancome:

![](../../assets/images/patterns/add-to-homescreen/addtohomescreen-lancome.png)
