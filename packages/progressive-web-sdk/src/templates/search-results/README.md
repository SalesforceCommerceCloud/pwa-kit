<div style="color:red; margin-bottom:20px;">
    This is a template made up of several components
</div>

## Common Components

- [Breadcrumbs](#!/Breadcrumbs)
- [Accordion](#!/Accordion)
- [Button](#!/Button)
- [Select](#!/Select)
- [SkeletonBlock](#!/SkeletonBlock)
- [Sheet](#!/Sheet)
- [Search](#!/Search)
- [Pagination](#!/Pagination)
- [LazyLoader](#!/LazyLoader)
- [Tile](#!/Tile)

## UI Kit

![](../../assets/images/templates/search-results/searchresults-uikit.png)

## Purpose

Search results lists the items returned by a user's search query. [Filters](#!/Filtering) may be presented that allow the user to refine the search results by price, color, size, etc.
Search results may be presented as a listing, a grid, or both with a control to toggle between each.

## Appropriate Uses

- The template which follows submission of a search query.
- Typically this template shares the same components as the [PLP template](#!/Plp).

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

- Use the page heading to reiterate the user's search query (e.g. Search results for "Shoes").
- Providing tile view and list view on search results listings is appropriate when showing images with search results that may benefit from a larger viewing and less search result details.
- If a site supports the searching of articles and content as well as products, the user should be able to toggle the list of results (see the Paula's Choice example below). The [Tab component](#!/Tabs) is useful at grouping these result types.
- Optional is the inclusion of a [search bar](#!/Search), allowing the user to quickly refine their search query and search again.
- Sorting maintains the amount of items in a list, filtering changes the amount of items returned, these two actions should therefore be treated separately.
- Filtering by category will often result in a url change which may remove any previously applied filters, consider visually separating this from other filtering options.
- Present a number above the listed items to show how many results are below, this can help the user decide whether to filter or not.
- Place numbers next to filters if available to show the user how many items that filter will return.
- Aim to present the sort option upfront so that the user is aware how the list is ordered.
- Present any applied filters upfront on the page and allow the user to turn them off easily.
- Present reviews only if these are a good comparison tool. If a site has very few reviews consider hiding this from the PLP.
- Add to cart buttons can be included if the user does not have to choose secondary options (e.g. size) first.
- Explore adding Add to cart buttons to the Search results if shopping behavior is one of quick, low cost purchasing.
- Only use automatic lazy loading if each load results in a change in url, add indicators after each page load.
- Ensure an empty state is designed for queries that return no results. This state should have a clear visible difference from the search results template in order to draw attention to the search query (which may be spelled incorrectly).

## Example Implementations

### Paula's Choice

![](../../assets/images/templates/search-results/searchresults-paulas.png)

### Lancome

![](../../assets/images/templates/search-results/searchresults-lancome.png)
