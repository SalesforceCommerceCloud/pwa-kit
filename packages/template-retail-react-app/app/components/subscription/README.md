# Marketing Consent Subscription Component

This directory contains components for managing email subscriptions via the Salesforce Commerce Cloud ShopperConsents API v1.1.3.

## Overview

The subscription system allows customers to opt into marketing communications (email/SMS) directly from the footer. It integrates with the ShopperConsents API to manage consent preferences.

## Components

### `SubscribeMarketingConsent`
Main component that connects the subscription form to the consent API.

**Props:**
- `subscriptionId` (string, default: 'newsletter') - The subscription ID configured in your B2C Commerce consent management
- `channel` (string, default: 'email') - The channel to subscribe to ('email' or 'sms')

**Example:**
```jsx
import SubscribeMarketingConsent from '@salesforce/retail-react-app/app/components/subscription'

// Default usage (email newsletter)
<SubscribeMarketingConsent />

// Custom subscription
<SubscribeMarketingConsent 
  subscriptionId="promotional-offers" 
  channel="email" 
/>
```

### `SubscribeForm`
Presentational component that renders the subscription form UI.

**Props:**
- `subscription` (object, required) - Object containing:
  - `state.email` - Current email value
  - `state.isLoading` - Loading state
  - `state.feedback` - Feedback message and type
  - `actions.setEmail` - Function to update email
  - `actions.submit` - Function to submit form

## Hooks

### `useSubscription`
Custom hook that manages subscription form state and API calls.

**Parameters:**
- `subscriptionId` (string) - The subscription ID to opt into
- `channel` (string) - The channel ('email' or 'sms')

**Returns:**
- `state` - Form state (email, isLoading, feedback)
- `actions` - Form actions (setEmail, submit)

### `useMarketingConsent`
Base hook that wraps the ShopperConsents API (defined in `app/hooks/use-marketing-consent.js`).

**Returns:**
- `data` - Subscription data
- `updateSubscription` - Function to update a single subscription
- `updateSubscriptions` - Function to update multiple subscriptions (bulk)
- `isUpdating` - Loading state
- `getSubscriptionStatus` - Helper to check opt-in/opt-out status
- `hasChannel` - Helper to check if subscription includes a channel

## Constants

Defined in `app/constants/marketing-consent.js`:

- `CONSENT_STATUS` - Opt-in/opt-out status values
- `CONSENT_CHANNELS` - Available channels (email, SMS)
- `CONSENT_TAGS` - Tags for organizing subscriptions by context

## Configuration Requirements

### 1. B2C Commerce Consent Management

You need to configure subscription types in Business Manager:

1. Navigate to **Merchant Tools > Site Preferences > Consent Management**
2. Create a subscription with ID matching your `subscriptionId` prop (e.g., 'newsletter')
3. Configure the channels (email/SMS) and tags as needed

### 2. API Configuration

The component uses the ShopperConsents API which requires:
- SLAS (Shopper Login and API Access Service) to be configured
- Guest or registered customer session
- Proper CORS and API permissions

### 3. Subscription ID

**Important:** The default `subscriptionId` is set to `'newsletter'`. You should either:
- Configure a 'newsletter' subscription in Business Manager, OR
- Override the `subscriptionId` prop to match your configured subscription

Example:
```jsx
<SubscribeMarketingConsent subscriptionId="your-configured-id" />
```

## Integration in Footer

The component is integrated in `app/components/footer/index.jsx`:

```jsx
import SubscribeMarketingConsent from '@salesforce/retail-react-app/app/components/subscription'

// Used in footer
<SubscribeMarketingConsent />
```

## API Version

This implementation uses **ShopperConsents API v1.1.3** with the following methods:
- `updateSubscription` - Update a single consent subscription
- `updateSubscriptions` - Bulk update multiple subscriptions

## Differences from v1.1.0

If migrating from v1.1.0:
- API method names have been updated
- The hook structure is simplified (no separate `fetchConsentItems` needed)
- Direct `updateSubscription` call instead of querying first

## Testing

Test the subscription flow:
1. Enter a valid email address
2. Click "Sign Up"
3. Verify the success message appears
4. Check Business Manager consent records

## Customization

### Change Subscription ID
```jsx
<SubscribeMarketingConsent subscriptionId="promotional-emails" />
```

### Add SMS Subscription
```jsx
<SubscribeMarketingConsent 
  subscriptionId="sms-alerts" 
  channel="sms" 
/>
```

### Custom Error Handling
Modify `app/hooks/use-subscription.js` to customize error messages and behavior.

## Internationalization

All user-facing text is internationalized. Add translations in your locale files:

```json
{
  "footer.subscribe.heading.first_to_know": "Be the first to know",
  "footer.subscribe.description.sign_up": "Sign up to stay in the loop about the hottest deals",
  "footer.subscribe.button.sign_up": "Sign Up",
  "footer.success_confirmation": "Thanks for subscribing!",
  "footer.error.enter_valid_email": "Enter a valid email address.",
  "footer.error.generic_error": "We couldn't process the subscription. Try again.",
  "footer.subscribe.disclaimer": "By subscribing, you agree to our {terms} and {privacy}."
}
```

## Troubleshooting

### Error: "We couldn't process the subscription"
- Verify subscription ID matches Business Manager configuration
- Check API credentials and SLAS configuration
- Verify customer has an active session
- Check browser console for detailed error logs

### Success message shows but consent not recorded
- Verify API connectivity
- Check Business Manager consent records
- Ensure subscription is active in Business Manager

### Email validation fails
- The component uses standard email regex validation
- Customize in `use-subscription.js` if needed

