# Design

<div style="color:red; margin-bottom:20px; margin-top:20px;">
    This is a design pattern made up of multiple components.
</div>

## Related Components

- [Tabs](#!/Tabs)
- [Field](#!/Field)
- [Button](#!/Button)
- [Feedback](#!/Feedback)

## UI Kit

![](../../assets/images/components/inline-ask/inline-ask-ui-kit.png)

## Purpose

The Inline Ask component is designed to group together the prompts to sign up to the newsletter and for push notifications. The component can be varied to only show the email option if the device does not support push notifications.

## Appropriate Uses

- The component should be used selectively, outside of the footer component, to provide contextual prompts that relate to their current task.
- On the homepage following promotions and navigation is an appropriate place to prompt a place to subscribe to more promotions.
- At the end of the checkout is a good place to show the subscription prompt.
- If push subscriptions are used to alert the user about stock levels, the PDP is an appropriate place to prompt to subscribe to push subscription.

## User Interactions

- Users can toggle between subscribing to push or email using the [tabs](#!/Tabs) component.
- After Opt In button is pressed, the user is prompted to enable notifications through the browser's native 'soft ask' dialogue.
- To subscribe to email the user uses a text field and a submit button.

## Usage Tips & Best Practices

- GDPR requires copy that clearly explains what the user is signing up for and provides a reason to do so.
- Copy must be unambiguous with links to find out more.
- Use the [feedback](#!/feedback) component to communicate a successful subscription.
- Ensure the field component has placeholder text "Email address" to communicate the required data.
- A server request is required to discover the eligibility of the device. Whilst this is performing, use a loading indicator over the component, below the heading.
- If a user is using a device that doesn't support notifications, they should never see Push Notifications as an option.
- If a user has a supported device but has blocked push notifications, continue to display the option but present a dialogue which explains the blocked status.

## Accessibility

- During the loading process to check device eligibility, ensure there is sufficient blank space to minimize page reflow.

## Example Implementations

### Merlin's Potions:

![](../../assets/images/components/inline-ask/inline-ask-merlins.png)

### Merlin's Potions (after opting in):
![](../../assets/images/components/inline-ask/inline-ask-merlins-success.png)

### Merlin's Potions (blocked):
![](../../assets/images/components/inline-ask/inline-ask-merlins-denied.png)
