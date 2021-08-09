# Design

## Component Group

- [Tabs](#!/Tabs)
- [TabsPanel](#!/TabsPanel)

## UI Kit

![](../../assets/images/components/tabs/tabs-uikit.png)

*Symbol Path: general -> Tabs*

## Purpose

Tabs provide a compact way to navigate between different sibling sections of content or functional parts of an interface. Tabs appears as a strip of horizontal buttons, each attached to a content pane immediately below, allowing the user to reveal a single pane at a time.

## Appropriate Uses

- To split up any content sections under a single common context.
- On the sign in page - login form in one tab, register as a new customer in the other.
- On the shopping cart to divide items ready to buy now and items saved for later.
- In search results to split the products from other content or articles, all under a common search query.
- In the checkout to divide the various methods of payment.
- As an alternative to the accordion component.

## User Interactions

- User can tap on the inactive tab to switch views.
- If using the overflow state, a user can swipe left/right to bring the tab items hidden off screen into view.

## Usage Tips & Best Practices

- Tabs should not be used to navigate between elements that do not contain clearly related information.
- Tab do not work as well when the customer needs to compare information between tabs. Consider another approach if this is a valid use case.
- When deciding to use either tabs or an accordion, consider how many groups there are. Tabs may not fit on the screen when the number of divisions is greater than 4.
- If the space taken up by the tab headings exceeds the width of the width, consider using the overflow variation.
- The overflow various is not a recommended pattern when the tab headings hidden off screen are critical to the user experience. These are hidden from view and may be missed. If this is a concern, consider using the accordion component instead.
- Tabs should always be shown with the first panel opened by default, unless specified by a previous action.
- Tabs have a natural hierarchy where the first pane is more prominent that the closed panes. If this hierarchy is not true to the user experience of the page then another component should be considered.
- Organize the panes such that they transition left and right like a carousel, mirroring the order of their corresponding tabs.
- Favor returning long text headings to two lines over truncation or hiding tab options off-screen.
- Keep tab headings concise, this will help avoid text returning to multiple lines.
- Avoid complex interaction journeys within tabs. Having too many additional actions within the first action of choosing a tab, can result in users losing where they are in the journey.
- Do not nest tabs within tabs.
- Be careful of full width dividers or background color switches within tab panes, this could be mistaken as the end of the content in that tab.

## Accessibility

- Be clear which are the active and inactive tabs using more than just color. A bottom border on the active tab is a common pattern, along with increase font size/weight.
- If using icons, ensure there is a text label to aid comprehension.
- Visually connect the tab bar to the content below. It can be helpful to match the background color of the pane to the background color of the active tab.

## Example Implementations

### Lancome (sign in):

![](../../assets/images/components/tabs/tabs-lancome.png)

### Paula's Choice (Search results):

![](../../assets/images/components/tabs/tabs-paulas.png)
