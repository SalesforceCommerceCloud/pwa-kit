# Design

## Related Components

- [Rating](#!/Rating)
- [ReviewSummary](#!/ReviewSummary)

## UI Kit

![](../../assets/images/components/review/review-uikit.png)

*Symbol Path: product -> ProductReview*

## Purpose

A review shows the expressed opinion a single customer about a particular product.

## Appropriate Uses

- Listed within a set of Product reviews on the product detail page.
- Listed in a modal window from a PDP following a user action to 'Read reviews'

## User Interactions

- A common pattern is for users to mark a review as helpful or not helpful via a single tap.
- Longer reviews that have been shortened may be expended by clicking on a 'Read more' link.

## Usage Tips & Best Practices

- Reviews will typically contain a [star rating](#!/Rating), title, reviewer, reviewer location, description and feedback buttons.
- Some reviews will have multiple ratings for different product attributes.
- Ensure clear hierarchy within reviews to prioritize the content that is most useful. Typically the review title and description is of greater interest to a shopper than the reviewer/location, this therefore should be given larger prominence in text size and weight.
- Reviews can be long or short. Consider restricting the copy behind a Read More link to preserve the balance of review tiles.

## Accessibility

- Ensure the action buttons to give feedback on a review are sufficiently labelled as links by adding clear copy, icons and/or utilizing the site's link color.
- If using thumbs up/down icons, ensure these are given text labels so as not to confuse with Facebook's Like button.

## Example Implementations

### Lancome:

![](../../assets/images/components/review/review-lancome.png)

### Paula's Choice:

![](../../assets/images/components/review/review-paulas.png)
