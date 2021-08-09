# Design

## UI Kit

![](../../assets/images/components/banner/banner-uikit.png)

*Symbol Path: global -> Alert*

## Purpose

Banners are primarily used to display timely information to the user in a position and style which is attention grabbing. Typically they will notify the user of the success/failure of a previous action, or display a state of browsing such as offline mode.

## Appropriate Uses

- Displaying the availability of a promo code or other promotional messaging.
- Notifying the user that they are browsing in offline mode.
- Alerting the user that a form has not been submitted due to errors.

## User Interactions

- On tap, a user can follow a link to a url with further information.
- On tap, an action can be set to open a modal which contains further information.

## Usage Tips & Best Practices

- Usually there will be multiple variations of background color and icon.
- At the very top of the page, below the header bar or fixed to the bottom of the viewport are common places to position a banner.
- If a banner is being used for success/failure messaging, it should be attention grabbing in color.
- If a banner is used for promotional messaging sitewide, it should utilize a color which does not distract from the main actions on the page.
- Banner messages should contain very few words and be clear. If there is more information required to explain the message, this should be accessible from another page or modal window.

## Accessibility

- Be sure to check the contrast of text on background color to ensure it passes a11y guidelines. [Use this handy tool](http://www.contrastchecker.com).
- Green for success and red for failure, however do not rely on color to convey your message. Include icons and be clear in the wording.

## Examples

### Paula's Choice (promo)

![](../../assets/images/components/banner/banner-paulas.png)

### Babista (offline mode)

![](../../assets/images/components/banner/banner-babista.png)
