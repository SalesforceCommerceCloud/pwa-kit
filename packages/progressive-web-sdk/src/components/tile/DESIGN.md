# Design

## Related Component

- [Image](#!/Image)
- [Rating](#!/Rating)
- [SkeletonText](#!/SkeletonText)
- [SkeletonBlock](#!/SkeletonBlock)

## UI Kit

![](../../assets/images/components/tile/tile-uikit.png)

*Symbol Path: product -> ProductTile*

## Purpose

The tile component is used wherever a group of components come together to form a repeatable product card. Typically they contain an image, title, price, rating and Link.

## Appropriate Uses

- On a PLP to hold information about each product listed in a category.
- On search results to hold information about each product returned from a search query.
- In the shopping cart to hold information about the product added to cart.
- In the added to cart modal to reiterate the item that has just been added.
- In the checkout payment page to reiterate the products about to be purchased.
- On the PDP showing related items.
- Anywhere else where a product card may be repeated in a list.

## User Interactions

- Typically the only interaction is a link leading to the subsequent product page.
- Swatches may be introduced to the PLP product tiles, these toggle the image thumbnail.

## Usage Tips & Best Practices

- The variations in format of the tile component are designed for the needs of the templates they appear on. Product tiles in the checkout for example have smaller images, leaving more space for the key tasks of that page.
- When sizing elements in the Tile component, consider the key user interaction on that page. Users browsing a product list page will benefit from larger images as it helps them compare items. Tiles in an added to cart modal have less need for a larger image as it is only there to reassure users that the correct product was added.
- When choosing which Tile variation to use on a PLP, consider how this best fits the product catalogue. Do the products generally have long titles or short titles? (longer titles are better suited to the Row variation) Is the user looking for higher detail in the images and will benefit from a full width tile?

## Accessibility

- When placing several tiles next to each other, ensure there is a clear difference in the between the tiles and the space between the product titles and the images. If this difference is not clear enough, some users may not connect the product titles their corresponding images.
- Users will click all elements of a tile expecting to navigate to that product. Ensure the link attribute is wrapped around the entire tile, not just the product title.

## Example Implementations

### Lancome (PLP):

![](../../assets/images/components/tile/tile-lancome.png)

### Merlin's Potions (Added to cart):

![](../../assets/images/components/tile/tile-merlins.png)
