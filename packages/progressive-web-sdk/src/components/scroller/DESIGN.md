# Design

## UI Kit

![](../../assets/images/components/scroller/scroller-uikit.png)

*Symbol Path: templates -> SuggestedProducts*

## Purpose

Scrollers allow multiple items to be grouped in a row and positioned off the screen, accessible by a sideways scrolling action.

## Appropriate Uses

- For grouping related items on a product detail page and positioning them horizontally instead of vertically stacking.
- On a homepage to group related promotional images or navigational links in order to preserve page height.
- Anywhere to group related content horizontally to reduce the height of a page.

## User Interactions

- Users swipe left and right to browse through a list of items.
- Typically, each item will have an associated action. This interaction will depend on the content and the components used.

## Usage Tips & Best Practices

- Horizontal scrolling is a common pattern across the mobile web. It is an interaction which is recognisable by most users and encourages exploration.
- Due to its small requirement of screen real estate, this pattern is commonly used for related items on a PDP as it doesn't distract from the main action of purchasing that product.
- Using a scrolling is an inferior pattern if the items at the end of the list hold important content. These items are out of view and require an action to find them.
- Scrollers are an effective pattern if the list has a hierarchy of importance - items at the beginning of the list will be visible to the user and naturally have more exposure than those at the end of the list.
- If the list has no hierarchy then a superior pattern may be to stack the items rather than use Scroller.

## Accessibility

- If there are items positioned off the screen do not assume that the user understands this. Consider positioning the items so that a portion of the image is visible on screen.
- If using the method above, consider the resolution of the devices used to serve the website. If the user is browsing on an Android device their viewport may be larger than iOS users and the image may not cut off as intended.

## Example Implementations

### Paula's Choice:

![](../../assets/images/components/scroller/scroller-paulas.png)

### Lancome:

![](../../assets/images/components/scroller/scroller-lancome.png)
