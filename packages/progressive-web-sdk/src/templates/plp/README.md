<div style="color:red; margin-bottom:20px;">
    This is a template made up of several components.
</div>

## Common Components

- [Breadcrumbs](#!/Breadcrumbs)
- [Accordion](#!/Accordion)
- [Button](#!/Button)
- [Select](#!/Select)
- [SkeletonBlock](#!/SkeletonBlock)
- [Sheet](#!/Sheet)
- [Pagination](#!/Pagination)
- [LazyLoader](#!/LazyLoader)
- [Tile](#!/Tile)

## UI Kit

![](../../assets/images/templates/plp/plp-uikit.png)

## Purpose

The product list page is designed to present the user with a selection of products grouped by category or search term. The template should allow the user to effectively compare products or refine a search for items the item(s) they are most interested in purchasing.

This is a template made up of several components. The structure should be the same for every category so that the user learns where to find the information they are looking for, and to reduce time spent on implementation.

## Appropriate Uses

- Displayed after a user clicks on the deepest link title within the product category navigation.
- Follows on from a Category List Page (CLP) template.
- Usually presented to the user before the [Product Detail Page](#!/Pdp).
- The template used to display search results.

## User Interactions

### Sort results
Products can be ordered by various attributes e.g. Lowest price, most popular.

### Filter/Refine
The user can choose to reduce the number of items returned by turning on attribute filters e.g. size: Medium.

### View product
Tapping on a product takes the user to a PDP.

### Toggle image
Some items allow the user to quickly view a different image, such as toggling a different color.

### Add to cart
Some sites will allow the user to add to cart directly form the PLP.

### Load more/next page
As soon as the user reaches the end of the list, more items can be loaded by navigating to the next page or loading more within the same page.

## Usage Tips & Best Practices

- Sorting maintains the amount of items in a list, filtering changes the amount of items returned, these two actions should therefore be treated separately.
- Filtering by category will often result in a url change which may remove any previously applied filters, consider visually separating this from other filtering options.
- Present a number above the listed items to show how many results are below, this can help the user decide whether to filter or not.
- Place numbers next to filters if available to show the user how many items that filter will return.
- Aim to present the sort option upfront so that the user is aware how the list is ordered.
- Present any applied filters upfront on the page and allow the user to turn them off easily.
- If the product offering is one that relies on images to sell (e.g. Apparel) then consider using a layout that supports larger images and less type.
- Present reviews only if these are a good comparison tool. If a site has very few reviews consider hiding this from the PLP.
- Add to cart buttons can be added to the PLP if the user does not have to choose secondary options (e.g. size) first.
- Explore adding Add to cart buttons to the PLP if shopping behavior is one of quick, low cost purchasing.
- If the PLP uses pagination, include a disabled ‘Previous’ button to maintain the layout on the next page.
- Only use automatic lazy loading if each load results in a change in url, add indicators after each page load.

## Variations & States

### Grid view/List view/Gallery view
Some product types may suit a variation in layout. If the site relies on its images to sell the products, consider user the gallery view. If the images are tall, consider using the grid layout to better balance the text with the images

### Add to cart
If customer behavior is to make lots of quick purchases often, consider allowing the user to add to cart directly from the PLP. Although this only works if the products do not have options on the PDP

### Filter view
Adding filters can be a fairly cumbersome process if the user chooses to make multiple selections. This task should be presented in a focused view (such as an modal) so that the UI is easy to follow

## Example Implementations

### Lancome

![](../../assets/images/templates/plp/lancome-plp.png)

### Crabtree & Evelyn

![](../../assets/images/templates/plp/crabtree-plp.png)
