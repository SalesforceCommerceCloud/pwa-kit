# Design

## UI Kit

![](../../assets/images/components/toggle/toggle-uikit.png)

*Symbol Path: general -> Toggle*

## Purpose

A toggle is used to give the user means to show or hide additional content, not central to the main interaction or task.

## Appropriate Uses

- On a PDP where the product description has been truncated down to the first few lines, a toggle allows the user to view the full descriptions without leaving the page.
- In the checkout to hide non-required fields, a user can toggle these fields in view if they want to supply that information.
- Within any page where non-essential content needs to be removed from view (but still remain accessible) in order to remove distractions from the core task.

## User Interactions

- Toggle the hidden content to be shown or hidden using a single tap.

## Usage Tips & Best Practices

- Toggles can take the form of an icon, just text or both icon and text. It is best practice to use both text and a directional arrow icon together.
- Icons should dictate the direction of the toggle - use a downward arrow when the toggled content is hidden and an upwards arrow to hide.
- A toggle can be customized to remove the hide state after a user has used the toggle to show the content. Generally we've found that this does not resonate as well with users as some will use a toggle simply for exploration.
- There are two variations to this component, the Fade variation uses a white to alpha gradient. This is a useful visual clue that there is more content to be shown and works especially well with truncated text.
- Using the Fade variation is not recommended when hiding interactive elements such as form fields.
- Use animation to help give the user context as to where the toggle has moved to, downwards or upwards.

## Accessibility

- Be contextual with the text that reveals the content. 'View more' works with truncated text but does not work for hidden form fields. In this example the toggle should express the fields that will be revealed (e.g. Add Company name).

## Example Implementations

### Lancome (Fade variation):

![](../../assets/images/components/toggle/toggle-lancome.png)

### Merlin's Potions:

![](../../assets/images/components/toggle/toggle-merlins.png)
