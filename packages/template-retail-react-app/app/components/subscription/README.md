# Marketing Consent Subscription Component

This directory contains components and hooks for managing marketing subscriptions via the Salesforce Commerce Cloud ShopperConsents API v1.1.3.

## Overview

The subscription system allows customers to opt into marketing communications from various UI locations (footer, checkout, registration, etc.). It dynamically fetches and subscribes to **all subscriptions** matching a given consent tag and channel.

**Key Features:**
- **Dynamic & Flexible**: Marketers configure subscriptions in Business Manager - no code changes needed
- **Tag-Based**: Uses consent tags (e.g., `CONSENT_TAGS.EMAIL_CAPTURE`) to group subscriptions by UI location
- **Bulk Operations**: Opts users into ALL matching subscriptions in a single API call
- **Channel-Aware**: Automatically filters subscriptions by channel (e.g., email, SMS)

Currently supports **email subscriptions**. SMS and other channels can be added by creating additional channel-specific hooks.

## Directory Structure

```
/app/components/subscription/
├── hooks/
│   ├── index.js                          # Hook exports
│   └── use-email-subscription.js         # Email subscription logic
├── index.js                              # Component exports
├── subscribe-marketing-consent.jsx       # Container component
├── subscribe-form.jsx                    # Presentational form component
└── README.md                             # This file
```

## Components

### `SubscribeMarketingConsent`
Main component that connects the subscription form to the consent API. Dynamically subscribes users to ALL subscriptions matching the provided tag and email channel.

**Props:**
- `tag` (string, **required**) - The consent tag to filter subscriptions by (from `CONSENT_TAGS`)

**Example:**
```jsx
import SubscribeMarketingConsent from '@salesforce/retail-react-app/app/components/subscription'
import {CONSENT_TAGS} from '@salesforce/retail-react-app/app/constants/marketing-consent'

// Footer newsletter signup
<SubscribeMarketingConsent tag={CONSENT_TAGS.EMAIL_CAPTURE} />

// Registration page opt-ins
<SubscribeMarketingConsent tag={CONSENT_TAGS.REGISTRATION} />

// Checkout page opt-ins
<SubscribeMarketingConsent tag={CONSENT_TAGS.CHECKOUT} />
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

### `useEmailSubscription`
Channel-specific hook for managing email subscription form state and API calls. **Dynamically fetches** all subscriptions matching the provided tag and email channel, then subscribes to ALL matching subscriptions on submit.

**Location:** `app/components/subscription/hooks/use-email-subscription.js`

**Parameters:**
- `tag` (string, **required**) - The consent tag to filter subscriptions by

**Returns:**
- `state` - Form state
  - `email` (string) - Current email value
  - `isLoading` (boolean) - Whether submission is in progress
  - `isFetching` (boolean) - Whether subscriptions are being fetched
  - `matchingSubscriptionsCount` (number) - Number of subscriptions found
  - `feedback` (object) - User feedback message and type
- `actions` - Available actions
  - `setEmail` (function) - Update email value
  - `submit` (function) - Submit the subscription (opts into ALL matching subscriptions)

**How It Works:**
1. On mount: Fetches ALL subscriptions from API
2. Filters by: `tag` AND `channel='email'`
3. On submit: Creates bulk update for ALL matching subscriptions
4. Single API call opts user into multiple subscriptions at once

**Example:**
```jsx
import {useEmailSubscription} from './hooks'
import {CONSENT_TAGS} from '@salesforce/retail-react-app/app/constants/marketing-consent'

const MyComponent = () => {
  const {state, actions} = useEmailSubscription({
    tag: CONSENT_TAGS.EMAIL_CAPTURE
  })
  
  console.log(`Will subscribe to ${state.matchingSubscriptionsCount} subscription(s)`)
  
  return (
    <>
      {state.isFetching && <Spinner />}
      <input 
        value={state.email}
        onChange={(e) => actions.setEmail(e.target.value)}
        disabled={state.isLoading || state.isFetching}
      />
      <button onClick={actions.submit}>Subscribe</button>
    </>
  )
}
```

### `useMarketingConsent`
Base hook that wraps the ShopperConsents API. This is a global hook used by all channel-specific subscription hooks.

**Location:** `app/hooks/use-marketing-consent.js`

**Returns:**
- `data` - Subscription data
- `updateSubscription` - Function to update a single subscription
- `updateSubscriptions` - Function to update multiple subscriptions (bulk)
- `isUpdating` - Loading state
- `getSubscriptionStatus` - Helper to check opt-in/opt-out status
- `hasChannel` - Helper to check if subscription includes a channel

## Validation Utilities

### Location: `app/utils/subscription-validators.js`

This module provides reusable validation functions for different contact point types:

**Functions:**
- `validateEmail(email)` - Validates email format
- `validatePhone(phone)` - Validates phone number (E.164 format)
- `createValidator(regex)` - Factory for custom validators

**Example:**
```javascript
import {validateEmail} from '@salesforce/retail-react-app/app/utils/subscription-validators'

const result = validateEmail('user@example.com')
// { valid: true }

const badResult = validateEmail('invalid')
// { valid: false, error: 'invalid_format' }
```

**Error Codes:**
- `required` - Value is empty or missing
- `invalid_format` - Value doesn't match expected format

## Constants

Defined in `app/constants/marketing-consent.js`:

- `CONSENT_STATUS` - Opt-in/opt-out status values
- `CONSENT_CHANNELS` - Available channels (email, SMS)
- `CONSENT_TAGS` - Tags for organizing subscriptions by context

## Configuration Requirements

### 1. B2C Commerce Consent Management

You need to configure subscriptions in Business Manager with appropriate tags:

1. Navigate to **Merchant Tools > Site Preferences > Consent Management**
2. Create subscriptions with meaningful IDs (e.g., 'weekly-newsletter', 'promotional-offers')
3. **Configure tags** for each subscription to match your UI locations:
   - `email_capture` - For footer/homepage email capture subscriptions  
   - `account` - For account settings/user profile subscriptions
   - `checkout` - For checkout page opt-ins
   - `registration` - For signup page opt-ins
4. Configure the channels (email/SMS) for each subscription
5. Set the subscription status to **Active**

**Example Configuration:**
```
Subscription ID: weekly-newsletter
Tags: email_capture
Channels: email
Status: Active

Subscription ID: promotional-offers  
Tags: email_capture
Channels: email
Status: Active

Subscription ID: order-updates
Tags: checkout
Channels: email, sms
Status: Active
```

With this setup, the footer (using `CONSENT_TAGS.EMAIL_CAPTURE`) will automatically subscribe users to all subscriptions tagged with `email_capture` when they submit their email.

### 2. API Configuration

The component uses the ShopperConsents API which requires:
- SLAS (Shopper Login and API Access Service) to be configured
- Guest or registered customer session
- Proper CORS and API permissions

### 3. Consent Tags

**Important:** Consent tags define WHERE subscriptions appear in your UI. The constants are defined in:
```javascript
// app/constants/marketing-consent.js
export const CONSENT_TAGS = {
    ACCOUNT: 'account',
    CHECKOUT: 'checkout',
    REGISTRATION: 'registration',
    EMAIL_CAPTURE: 'email_capture'
}
```

**If no subscriptions match the tag:**
- The form will show an error message
- Dev console will log: `"No subscriptions found for tag..."`
- Check Business Manager configuration

## Integration Examples

### Footer
```jsx
import SubscribeMarketingConsent from '@salesforce/retail-react-app/app/components/subscription'
import {CONSENT_TAGS} from '@salesforce/retail-react-app/app/constants/marketing-consent'

<SubscribeMarketingConsent tag={CONSENT_TAGS.EMAIL_CAPTURE} />
```

### Registration Page
```jsx
<SubscribeMarketingConsent tag={CONSENT_TAGS.REGISTRATION} />
```

### Checkout Page
```jsx
<SubscribeMarketingConsent tag={CONSENT_TAGS.CHECKOUT} />
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

### Add Subscriptions to a Tag
Simply configure new subscriptions in Business Manager with the same tag. The component will automatically pick them up - no code changes needed!

**Example:** Add a new "Flash Sales" subscription to the footer:
1. In Business Manager, create subscription ID: `flash-sales`
2. Set tag: `email_capture`
3. Set channel: `email`
4. Activate the subscription
5. Footer now subscribes users to 3 subscriptions (if you had 2 before)

### Add SMS or Other Channel Support

To add support for SMS or other channels, follow this pattern:

1. **Create a new channel-specific hook** at `app/components/subscription/hooks/use-sms-subscription.js`:

```javascript
import {useCallback, useMemo, useState} from 'react'
import {CONSENT_CHANNELS, CONSENT_STATUS} from '@salesforce/retail-react-app/app/constants/marketing-consent'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'
import {validatePhone} from '@salesforce/retail-react-app/app/utils/subscription-validators'
import {useIntl} from 'react-intl'

export const useSmsSubscription = ({subscriptionId = 'sms-alerts'} = {}) => {
    const {updateSubscription, isUpdating} = useMarketingConsent()
    const {formatMessage} = useIntl()
    
    const [phone, setPhone] = useState('')
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')
    
    const messages = useMemo(() => ({
        success_confirmation: formatMessage({
            id: 'subscription.sms.success',
            defaultMessage: 'Thanks for subscribing to SMS alerts!'
        }),
        error: {
            enter_valid_phone: formatMessage({
                id: 'subscription.sms.error.invalid',
                defaultMessage: 'Enter a valid phone number.'
            }),
            generic_error: formatMessage({
                id: 'subscription.sms.error.generic',
                defaultMessage: "We couldn't process the subscription. Try again."
            })
        }
    }), [formatMessage])
    
    const handleSignUp = useCallback(async () => {
        const validation = validatePhone(phone)
        
        if (!validation.valid) {
            setMessage(messages.error.enter_valid_phone)
            setMessageType('error')
            return
        }
        
        try {
            setMessage(null)
            
            await updateSubscription({
                subscriptionId,
                contactPointValue: phone,
                channel: CONSENT_CHANNELS.SMS,
                status: CONSENT_STATUS.OPT_IN
            })
            
            setMessage(messages.success_confirmation)
            setMessageType('success')
            setPhone('')
        } catch (err) {
            console.error('SMS subscription error:', err)
            setMessage(messages.error.generic_error)
            setMessageType('error')
        }
    }, [phone, updateSubscription, subscriptionId, messages])
    
    return {
        state: {
            phone,
            isLoading: isUpdating,
            feedback: {message, type: messageType}
        },
        actions: {
            setPhone,
            submit: handleSignUp
        }
    }
}
```

2. **Export the new hook** from `app/components/subscription/hooks/index.js`:

```javascript
export {useEmailSubscription} from './use-email-subscription'
export {useSmsSubscription} from './use-sms-subscription'
```

3. **Create a new component or modify existing** to use the SMS hook

This architecture keeps each channel's validation and logic separate while sharing the common API wrapper (`useMarketingConsent`).

### Custom Validation
Modify validators in `app/utils/subscription-validators.js` to customize validation rules.

### Custom Error Messages
Override internationalization keys in your locale files to customize user-facing messages.

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
- The component uses standard email regex validation defined in `app/utils/subscription-validators.js`
- Customize the `validateEmail` function or `EMAIL_REGEX` constant if you need different validation rules

## Architecture Benefits

This architecture provides several advantages:

1. **Separation of Concerns**
   - Validation logic in `/utils` (reusable across the app)
   - API wrapper in `/hooks` (global, reusable)
   - Channel-specific logic in component `/hooks` (focused, maintainable)

2. **Extensibility**
   - Easy to add new channels without modifying existing code
   - Each channel hook is independent and testable
   - Shared validation utilities prevent duplication

3. **Colocation**
   - Subscription-specific hooks live with the subscription component
   - Easy to find and understand the complete feature
   - Follows React best practices for component organization

4. **Type Safety & Clarity**
   - Each hook has a clear, honest API (no unused parameters)
   - Type-specific state names (email/phone/etc.) instead of generic names
   - Reduces confusion and potential bugs

