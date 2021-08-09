# Design

## Component group

- [Carousel](#!/Carousel)
- [CarouselItem](#!/CarouselItem)

## UI Kit

![](../../assets/images/components/carousel/carousel-uikit.png)

*Symbol Path: general -> Carousel*

## Purpose

Image Carousels allow the display of multiple images in a constrained space, typically with controls to allow the user to flip between them.

## Appropriate Uses

- On a PDP to allow browsing of multiple images.
- On a homepage to rotate promotional graphics one at a time.

## User Interactions

- Tapping on-screen controls to scroll forward and backward through the selection of images.
- Swiping left and right to scroll forward and backward through the selection of images.

## Usage Tips & Best Practices

- Implementing swiping to advance images is useful and expected behavior, but even with swiping it's still good practice to provide visual indicators of user actions, ie. previous/next arrow indicators.
- It is good practice to indicate the number of elements in a carousel by using Pips (multiple dots positioned below the carousel), a thumbnail gallery or a text indicator (1 of 4).
- A carousel may be used for a single image, where other images may be added in future.

## Accessibility

- Carousels typically contain images controlled on the client side. In order to ensure an accessible color contrast, navigation controls should be positioned on top of a suitable background color.
- If using Pips, ensure the active state and non-active states are differentiated by more than opacity or color (such as a border or variation in size).

## Example Implementations

### Babista (Product page)

![](../../assets/images/components/carousel/carousel-babista.png)

### Merlins Potions (Homepage)

![](../../assets/images/components/carousel/carousel-merlins.png)
