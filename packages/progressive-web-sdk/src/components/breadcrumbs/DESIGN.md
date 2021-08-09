# Design

## UI Kit

![](../../assets/images/components/breadcrumbs/breadcrumb-uikit.png)

*Symbol Path: general -> Breadcrumb*

## Purpose

Breadcrumbs are a common wayfinding pattern that gives the user a sense of where they are in a site's hierarchy. They also offer a quick way to move back up a level or more.

## Appropriate Uses

- Typically displayed above the title of the page to describe and allow access to its parent categories.
- Especially effective when user requires context about which part of the site they are on.
- A valuable web pattern for when a user deep links (from search or social media) into a page deep within the product catalogue.
- Less valuable in apps where users typically browse linearly from the homepage and have access to built-in back buttons.

## User Interactions

- Users can tap a link in the hierarchy to retreat to that level.
- When the breadcrumbs take up more space than a single page width, an x-overflow can be enabled allowing users to swipe left/right to view the full hierarchy.

## Usage Tips & Best Practices

- If you provide breadcrumbs, ensure each level in the hierarchy is a link to that level's landing page.
- If utilizing an x-overflow ensure that there is clear indication that content exists outside of the view (e.g. by using an alpha -> white gradient at the end).
- It is recommended to show the full hierarchy at all times, however if this results in too many levels that the UI becomes confusing then the number of levels can be restricted and an ellipse used to indicate higher levels than are shown.
- Separators can vary visually. Mobify recommends an approach which shows a forwards motion such as > or /.

## Accessibility

- If breadcrumbs are links they should be indicated so by using the site's link color or an underline.
- Tappable links should be separated visually from non-interactive text.
- Ensure the distance between links is minimum tap target (normally 44px), especially when breadcrumbs span over two lines.

## Example Implementations

### Merlin's Potions

![](../../assets/images/components/breadcrumbs/merlins-breadcrumb.png)

### Lancôme (x-overflow)

![](../../assets/images/components/breadcrumbs/lancome-breadcrumb.png)
