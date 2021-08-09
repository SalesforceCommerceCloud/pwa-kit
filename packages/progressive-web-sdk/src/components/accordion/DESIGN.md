# Design

## Component Group

- [Accordion](#!/Accordion)
- [AccordionItem](#!/AccordionItem)
- [AccordionItemContent](#!/AccordionItemContent)

## UI Kit

![](../../assets/images/components/accordion/accordion-uikit.png)

*Symbol Path: general -> AccordionItem*

## Purpose

Accordions (previously Bellows) are used to hide non-crucial content from view and allows a user to display it by toggling the accordion header. An accordion is comprised of accordion items. Each item is designed to vertically collapse page content sections into a descriptive heading. Each accordion header may contain an icon either on the left or the right (the left follows our best practices) and, when tapped, will open an area below it with content within. The content area should be able to house any type of content.

The use of Accordions is two-fold:

1. To make information digestible at a glance (much like a table of contents) and allows users to quickly infer the content and purpose of a page (like a mini IA)
2. To conserve vertical screen space in order to communicate as much as possible with minimal real-estate. This is especially important when page content is heavy and being able to concisely communicate reduces user anxiety.

An accordion is comprised of [AccordionItems](#!/AccordionItem).

## Appropriate Uses

- Nesting non-essential information
- Collapsing large and complex pages into digestible sections
- Filters with many grouped options
- Navigation paradigms
- Long forms that are clearly sectioned

## User Interactions

- On touch, the Accordion heading/container should show visual feedback
- On touch, the Accordion should also visually change state into an 'open' state
- On second touch, the Accordion should toggle back into a closed / initial state

## Usage Tips & Best Practices

- Mobify's best practices require that we use a '+' and 'x' icon for closed and open states respectively. [Read more](https://www.viget.com/articles/testing-accordion-menu-designs-iconography)
- Iconography should appear to the left of the label
- Expanding the accordion should NOT push the accordion label to the top of the viewport. Vertical positioned should be maintained to avoid disorientation
- Expanding the accordion DOES push down the page
- Common visual affordances for the Accordion include encapsulation and heavy rules. A visual affordance is recommended in order to differentiate the Accordion from the [Link List component](#!/LinkList)

## Accessibility

- Do not rely on color to show the difference between open/closed states - use a different icon changes or animate the + icon to a x.
- If using a light grey to differentiate open/closed states, ensure the contrast between background color and text passes a11y guides. [Use this handy tool](http://www.contrastchecker.com).

## Examples

### Paulas Choice:

![](../../assets/images/components/accordion/accordion-paulas.png)

### Crabtree & Evelyn:

![](../../assets/images/components/accordion/accordion-crabtree.png)
