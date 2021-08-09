# Design

## Related Components

- [Review](#!/Review)
- [Rating](#!/Rating)

## UI Kit

![](../../assets/images/components/review-summary/reviewsummary-uikit.png)

*Symbol Path: product -> ProductReviewSummary*

## Purpose

A review summary is used on the PDP to display a summary of all the product reviews submitted by customers.

## Appropriate Uses

- Listed at the top of a set of Product reviews on the product detail page.
- On the PDP to give the user an 'at a glance' view of how satisfactory other customers found the product before choosing to read individual reviews.

## User Interactions

- Most commonly the summary appears above a set of product reviews and is not interactive.
- Sometimes a button may be utilized below the summary to 'Read all reviews' which would open a modal window containing the reviews.

## Usage Tips & Best Practices

- ReviewsSummary will typically contain a [star rating](#!/Rating) and details of how many customers have reviewed the product.
- Optional is the inclusion of a product thumbnail image for when the review applies to a particular product option (e.g. that product in red)
- Some review summaries may include further content such as pros and cons.

## Accessibility

- If the number of reviews is not a link, ensure this is clear by removing any link color or underline attribute.

## Example Implementations

### Lancome:

![](../../assets/images/components/review-summary/reviewsummary-lancome.png)

### Paula's Choice:

![](../../assets/images/components/review-summary/reviewsummary-paulas.png)
