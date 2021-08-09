# Design

## Related Components

- [SkeletonLoader](#!/SkeletonLoader)
- [Pagination](#!/Pagination)

## Purpose

Lazy loading is a way of deferring heavy asset load time to speed up perceived performance. Additionally, it's an alternative to pagination when a page is required to display an above-standard number of items.

## Appropriate Uses

- LazyLoad can be applied to any component outside of initial view, ensuring the assets that is in view will load first.
- Applied to any code-heavy assets, such as images and SVG, to speed up initial page load.
- On long scrolling pages with many instances of similar items, ie. search results pages or product listing pages.
- As an alternative to [pagination](#!/Pagination) at loading the next set of products.

## User Interactions

- Use does not interact with the component itself, instead the component reacts to a scroll actions performed by the user - when items are scrolled in view, this triggers LazyLoading.
- When more content is loaded in, this often extends the height of the page which can now be scrolled further.
- Tapping a more button instead of automatic triggering (optional).

## Usage Tips & Best Practices

- Apply LazyLoading to all code-heavy assets that are outside of the initial view.
- Indicate that content is loading after a user has triggered the load using [InlineLoader](#!/InlineLoader) or [SkeletonBlock](#!/SkeletonBlock).
- Lazy-loading in place of pagination is not necessarily a superior pattern. A never-ending page of results can seem overwhelming and careful consideration should be taken before deciding on this approach.
- Consider any content that may exist below a set of results. If LazyLoading results in an increase in page height, then a user cannot access content below which will cause frustration. Using a 'Load More' button in place of automatic triggering can fix this issue.
- Consider a user wanting to share or bookmark certain pages. If LazyLoading is favoured over pagination, a user will not be able to share anything outside the first set of items on page 1.

## Example Implementations

### Lancome:

![](../../assets/images/components/lazy-loader/lazyload-lancome.gif)

### Babista:

![](../../assets/images/components/lazy-loader/lazyload-babista.png)
