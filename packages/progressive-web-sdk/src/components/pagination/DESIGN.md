# Design

## UI Kit

![](../../assets/images/components/pagination/pagination-uikit.png)

*Symbol Path: general -> Pagination*

## Purpose

Pagination is a way of breaking down large listings into smaller, more digestible sets and allowing the user to step through them in a sequential order.

## Appropriate Uses

- On large listings with many instances of similar items (e.g. search results pages or product listing pages).
- As an alternative to [lazy loading](#!/LazyLoader).

## User Interactions

- Tapping on a next/previous buttons will navigate the user sequentially forward or back through item sets (pages).
- Selecting a specific page number jumps to that set of items within the larger list.
- Jump to a specific page using a select menu.

## Usage Tips & Best Practices

- Pagination is a recognized pattern and should be considered standard UX when sectioning out a large number of items.
- Pagination forces user interaction, whereas lazy loading allows passive navigation. If your priority is putting as many results in front of the user as possible, consider [lazy loading](#!/LazyLoading) instead.
- The benefit of using pagination is that it allows each set of items to have a sharable url that is easier to navigate back and forward through, and increases discoverability of a particular item in a large list.
- The downside of pagination over a single page of results is that it creates an end point for users, effectively offering a natural point at which they may stop browsing.
- The UI kit features a few UI alternatives to pagination. The decision to use one of the other will depend on the length of the product catalogue and browsing behavior. If the catalogue typically contains a small number of pages (1-4) then the 'page-links' style works best, if user behaviors is to navigation non-sequentially, consider using the 'select' variation.

## Accessibility

- To aid comprehension of what is the first and last page, apply a disabled state to buttons that are not tappable.
- Do not hide the Previous buttons on page 1, apply a disabled state to the button instead.
- Do not rely solely on color to differentiate the active page from the clickable pages. Consider adding an underline to the active page state, this will help colorblind people understand which page they are on.


## Example Implementations

### Paula's Choice

![](../../assets/images/components/pagination/pagination-paulas.png)
