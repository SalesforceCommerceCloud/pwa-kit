# Design

## Related Components

- [LazyLoad](#!/LazyLoad)
- [SkeletonBlock](#!/SkeletonBlock)

## UI Kit

![](../../assets/images/components/inline-loader/inlineloader-uikit.png)

*Symbol Path: global -> InlineLoader*

## Purpose

Inline loaders are designed to provide feedback to the user that an action is being performed without altering the state of the current page.

## Appropriate Uses

- Within a button to show that the button has been tapped and the corresponding action has been triggered.
- On top of a disabled page state to provide a state between the action and the subsequent loading of a new page or state.
- During initial app load, before content is available.
- In between page loads on the mobile web site, when transitioning from one page to another.
- As an alternative to placeholders for product images during lazy loading, while new content items load in as a user scrolls down the screen.

## User Interactions

- The InlineLoader does not contain any actions of its own but is often placed on top of actions to indicate a loading, disabled state.

## Usage Tips & Best Practices

- Favour inline loading over full page disablement, this is better for perceived performance.
- Use an inline loader to replace button text whilst that button's action is loading.
- Initiate the loader after the 'tapped' state of an add to cart button, whilst the product is being added to cart.
- On slow connections a user may see this state for some time before the JS script has finished adding to cart, therefore the loading graphic should be continuous.
- On fast connections, the InlineLoder may only flash up for a split second. It is therefore important to ensure the design for this is simple so as not to leave the user confused as to what they just saw.
- If using a spinner, favour native components over a custom spinner as this is perceived as being more performant.
- If using a loader during page transitions, the designer has a choice to place the spinner on the first screen before sliding in the fully-loaded second screen, or immediately translate to the not-loaded second screen and place a spinner there while content loads. Performance is perceived more favourably in the latter case.
- Spinners, throbbers and placeholder images are all valid visual approaches, decisions on which to use should come down to placement and function. Typically throbbers have a landscape orientation and worrk well on buttons, placeholders work best at simulating products and cards, spinners work better when placed in the middle of a full page.

## Accessibility

- The inline loader does not correlate to any timeframe, therefore the animation should be clear that it is rotating continuously rather than having a beginning and end.

## Example Implementations

### Lancome (add to cart):

![](../../assets/images/components/inline-loader/inlineloader-lancome.png)

### Babista (quantity change):

![](../../assets/images/components/inline-loader/inlineloader-babista.png)
