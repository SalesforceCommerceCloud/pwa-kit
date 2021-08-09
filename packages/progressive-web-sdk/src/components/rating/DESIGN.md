# Design

## Related Components

- [Review](#!/Review)
- [ReviewSummary](#!/ReviewSummary)

## UI Kit

![](../../assets/images/components/rating/rating-uikit.png)

*Symbol Path: product -> Rating*

## Purpose

Rating is used to display an average user satisfaction level of a product, it is the summary of the ratings given by users in the product reviews section.

## Appropriate Uses

- On a PLP as part of the product tile.
- At the top of a PDP to deliver an 'at a glance' summary of the product's customer reviews.
- Within the product review summary of a PDP to show the average satisfaction level of all customer reviews.
- Within each product review on a PDP to display the satisfaction level from that particular customer.

## User Interactions

- A user should be able to tap on the rating at the top of a PDP, this will automatically scroll the user down to the reviews section further down the page.

## Usage Tips & Best Practices

- Typically ratings are visualized using a star icon, beware of using any other icon to indicate rating (e.g. hearts may be confused with adding to wishlist)
- Users naturally associate a light color such as yellow or orange with stars, however certain brands may prefer to use a more subtle tone (see Lancome example below). Consider the effect a strong color will have on an otherwise neutral palette, ratings should not be more attention grabbing that the product or add to cart action.
- The ratings component is built to cope with decimal places and will visualize 3.2 stars suitably different to 3.5. If the product catalogue requires this fine level of separation for shoppers to effectively compare items, consider adding a text label to the star rating.
- When summarizing reviews using Rating, be sure to include the number of reviews that have resulted in that average, except on PLP templates where space is premium. Here it is not necessary to include the number of reviews as this extra content may clutter the UI.

## Accessibility

- If using the rating component as an anchor at the top of a PDP, ensure the number of reviews text is given clear indication that it is a link by utilizing the link color or an underline.
- It is not recommended to rely solely on color or opacity to differentiate empty stars from filled stars. Consider using a border to help colorblind users tell the difference.

## Example Implementations

### Lancome (PLP):

![](../../assets/images/components/rating/rating-lancome.png)

### Paula's Choice (PDP):

![](../../assets/images/components/rating/rating-paulas.png)
