<div style="color:red; margin-bottom:20px;">
    This component is coming soon to the UI kit and SDK.
</div>


## Purpose

Product zoom allows the user to get a closer look at a product thumbnail by expanding it.

## Appropriate Uses

- Primarily used on a PDP.
- Can be used within the shopping cart to give users a quick, closer look at the product.
- Positioned around the product image carousel.
- Anywhere else an image requires an optional larger view.

## User Interactions

- Tapping a product image or an icon expands the product image to fill the viewport.
- User can swipe to pan around (and possibly zoom in further on) the larger product image.
- Dismiss the larger image by tapping it, or tapping an 'x' icon.

## Usage Tips & Best Practices

- Provide a visual cue (such as an icon) that alerts users zooming is possible, but don't force them to click/tap on that. Implement the click/tap event handler on the entire image.
- If large image is high-resolution, consider providing the ability to pinch-zoom to resize the zoomed-in view.
- The close button should have a fixed position (typically top right) to allow the user to find and close the enlarged image irrelevant of where they are in panning the image.
- Enlarged image can expand to fill the entire viewport (recommended) or within a fixed size container smaller than the viewport.

## Accessibility

- If using a zoom icon, ensure this is different enough in appearance from the search icon so as not to confuse users.
- Consider using a label (e.g. "Zoom" or "Enlarge") to back up the zoom icon.
- Consider a text alternative to the zoom icon for increased clarity ("View larger image").

## Example Implementations

### Lancome:

![](../../assets/images/patterns/product-zoom/zoom-lancome.gif)

### Babista:

![](../../assets/images/patterns/product-zoom/zoom-babista.gif)
