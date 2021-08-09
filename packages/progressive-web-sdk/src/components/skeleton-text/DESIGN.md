# Design

## Related Components

- [SkeletonBlock](#!/SkeletonBlock)
- [InlineLoader](#!/InlineLoader)

## UI Kit

![](../../assets/images/components/skeleton-text/skeletontext-uikit.png)

*Symbol Path: global -> SkeletonText*

## Purpose

Skeleton Loaders are used in place of progress loaders (linear, determinate or otherwise) in order to divert the attention of the user away from the fact that they need to wait for content to load. They are also designed to communicate the basic structure of the loaded page.

## Appropriate Uses

- SkeletonText is used alongside [SkeletonBlock](#!/SkeletonBlock) to mimic this visual hierarchy and page structure of the loaded page.
- Animation is commonly used to create the impression to the user that something is in progress.
- Use in place of inline loaders, progress bars or full screen spinners/logos that indicate page load.
- Example use cases: Facebook for iOS and Android, Slack App, Open Table app.

## User Interactions

- Often user interaction is locked while the skeleton renders the page, this is not recommended - the user should be able to move back to previous step if they choose.
- Scrolling is enabled while the skeleton is visible in the viewport.

## Usage Tips & Best Practices

- The key to a good skeleton state is to make it look enough like the loaded page that the user does not notice any change between the two states. Choose a skeleton layout that depicts less UI than the final page over a state that insinuates more information - users are more likely to question absent UI than additional UI.
- Care should be taken as to how many elements are replaced with a skeleton state. Only elements that communicate a page's key functions should be shown. Too many elements will cause the user to question the skeleton state. This state should not be noticed by the user as any more than a segway between the page not being loaded and the final, loaded page.
- Most elements that will load will vary in size. Care should should be taken when designing skeletons as to how much the loaded content may affect page layout. Skeleton states should reflect the most likely layout.
- Be monotone when designing skeleton states. Too much color or contrast will attract too much attention.
- Tone may can be used to indicate typographic hierarchy (e.g. a darker color for H1s vs a lighter grey for running copy).
- While most Skeleton loaders are indeterminate in nature, the indeterminate visual communication fails to effectively convey a perceived sense of speed and often times can enforce the sense of poor latency. The Buffer and Transformative approaches might be options to pursue, that from the outset, communicate a sense of progress.

## Example Implementations

### Pure Formulas:

![](../../assets/images/components/skeleton-text/skeletontext-pureformulas.png)

### Paula's Choice:

![](../../assets/images/components/skeleton-text/skeletontext-paulas.png)
