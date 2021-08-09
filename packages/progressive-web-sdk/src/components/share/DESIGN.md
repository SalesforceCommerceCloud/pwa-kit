# Design

## Related Components

- [AddToHomescreen](#!/AddToHomescreen)
- [PDP](#!/PDP)

## UI Kit

![](../../assets/images/components/share/share-ui-kit.png)

*Symbol Path: global -> Share*

## Purpose

The share component is for use any time the user interaction is to share the url via email or on social media. The Share function also allows a user to print the page or copy the url instead of using the browser UI.

## Appropriate Uses

- The UI which follows a 'share' interaction most commonly found on the Product Detail Page.
- Following the Share interaction from within the overflow menu found in the header bar of apps launched from the homescreen.

## User Interactions

- CopyURL will copy the text of the url to the device clipboard.
- Email will trigger the device's default emailing app.
- Print will open the device's native print dialogue.
- Tapping a social media icon (e.g. Facebook) will prompt the user to open that platform's app or launch the platform's share dialogue in the browser.
- Tapping outside of the dialogue or the close icon will exit the share component.

## Usage Tips & Best Practices

- Any prompt to share should be presented inline next to the context that a user may want to share. If this is a product it should be presented as a secondary action to adding the item to the cart or wishlist.
- It is recommended to use [Google's Material Design Icons](https://material.io/icons/) for the actions within the share dialogue to match the UI of the device.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/components/share/share-merlins.gif)
