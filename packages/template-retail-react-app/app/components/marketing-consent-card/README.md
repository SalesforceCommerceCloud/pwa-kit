# Marketing Consent Card

A component for managing customer marketing communication preferences in the Account Profile page.

## Overview

The Marketing Consent Card allows customers to control their subscription preferences for:
- **Email Newsletter** - Weekly updates and product information
- **Promotional Offers** - Exclusive deals and special promotions  
- **SMS Alerts** - Order updates and important alerts (only shown if customer has a phone number)

## Features

- **Toggle Card Pattern** - Follows the same design as ProfileCard and PasswordCard
- **View/Edit Modes** - Summary view shows current preferences, edit mode allows changes
- **Bulk Updates** - Uses `updateSubscriptions` API to update multiple preferences at once
- **Real-time State** - Automatically loads and syncs with ShopperConsents API
- **Form Validation** - Ensures customer has required contact information
- **Accessibility** - Fully keyboard navigable with proper focus management

## Integration

The component is integrated into the Account Profile page (`app/pages/account/profile.jsx`):

```jsx
import MarketingConsentCard from '@salesforce/retail-react-app/app/components/marketing-consent-card'

const AccountDetail = () => {
    return (
        <Stack spacing={4}>
            <ProfileCard allowPasswordChange={!isExternal} />
            {!isExternal && <PasswordCard />}
            <MarketingConsentCard />
        </Stack>
    )
}
```

## Configuration

### Subscription IDs

The component uses these subscription IDs (must match your Business Manager configuration):

```javascript
const SUBSCRIPTION_IDS = {
    EMAIL_NEWSLETTER: 'newsletter',
    EMAIL_PROMOTIONS: 'promotional-offers',
    SMS_ALERTS: 'sms-alerts'
}
```

### Business Manager Setup

1. Navigate to **Merchant Tools > Site Preferences > Consent Management**
2. Create three subscriptions:
   - **ID: `newsletter`**
     - Channel: Email
     - Title: "Email Newsletter"
   - **ID: `promotional-offers`**
     - Channel: Email  
     - Title: "Promotional Offers"
   - **ID: `sms-alerts`**
     - Channel: SMS
     - Title: "SMS Alerts"

### Customization

To customize subscription options, modify the `SUBSCRIPTION_IDS` constant and update the UI accordingly:

```javascript
// Add a new subscription
const SUBSCRIPTION_IDS = {
    EMAIL_NEWSLETTER: 'newsletter',
    EMAIL_PROMOTIONS: 'promotional-offers',
    SMS_ALERTS: 'sms-alerts',
    PRODUCT_UPDATES: 'product-updates' // New
}
```

Then add the corresponding UI in the edit mode:

```jsx
<FormControl display="flex" alignItems="center">
    <Switch
        id="product-updates"
        isChecked={localPreferences.productUpdates}
        onChange={(e) =>
            setLocalPreferences({
                ...localPreferences,
                productUpdates: e.target.checked
            })
        }
        mr={3}
    />
    <FormLabel htmlFor="product-updates" mb="0" cursor="pointer">
        <Text fontWeight="medium">Product Updates</Text>
        <Text fontSize="sm" color="gray.600">
            Get notified about new product releases
        </Text>
    </FormLabel>
</FormControl>
```

## API Integration

The component uses the `useMarketingConsent` hook which wraps the ShopperConsents API v1.1.3:

```javascript
const {
    data: subscriptionsData,      // Current subscription data
    updateSubscriptions,           // Bulk update function
    isUpdating,                    // Loading state
    getSubscriptionStatus,         // Check opt-in/opt-out status
    error: consentError           // API errors
} = useMarketingConsent()
```

### Bulk Update Flow

1. Customer toggles switches in edit mode
2. On save, builds array of subscription objects:
   ```javascript
   [
       {
           subscriptionId: 'newsletter',
           channel: 'email',
           status: 'opt_in',
           contactPointValue: 'customer@example.com'
       },
       // ... more subscriptions
   ]
   ```
3. Calls `updateSubscriptions()` to update all at once
4. Shows success toast and returns to view mode

## State Management

### Local State
During editing, preferences are stored locally in `localPreferences`:
```javascript
const [localPreferences, setLocalPreferences] = useState({
    emailNewsletter: false,
    emailPromotions: false,
    smsAlerts: false
})
```

### Syncing with Server
On component mount and data refresh:
```javascript
useEffect(() => {
    if (subscriptionsData && customer?.email) {
        setLocalPreferences({
            emailNewsletter: getSubscriptionStatus('newsletter', 'email') === 'opt_in',
            // ... sync other preferences
        })
    }
}, [subscriptionsData, customer?.email])
```

## User Experience

### View Mode
- Shows simple bullet list of current preferences
- "Subscribed to..." or "Not subscribed to..." for each option
- Edit button to enter edit mode

### Edit Mode
- Toggle switches for each subscription
- Descriptive text explaining each option
- Disclaimer about SMS rates
- Save/Cancel buttons with proper focus management

### Error Handling
- Shows alert for missing email address
- Displays API errors in a user-friendly format
- Console logs detailed errors for debugging

## Internationalization

All user-facing text uses `FormattedMessage` for i18n support:

```json
{
  "consent_card.title.marketing_preferences": "Marketing Preferences",
  "consent_card.description": "Choose how you'd like to hear from us...",
  "consent_card.label.email_newsletter": "Email Newsletter",
  "consent_card.label.promotional_offers": "Promotional Offers",
  "consent_card.label.sms_alerts": "SMS Alerts",
  "consent_card.info.preferences_updated": "Communication preferences updated",
  "consent_card.error.update_failed": "Failed to update preferences. Please try again.",
  "consent_card.error.email_required": "Email address is required to manage subscriptions.",
  "consent_card.status.newsletter_subscribed": "Subscribed to email newsletter",
  "consent_card.status.newsletter_not_subscribed": "Not subscribed to email newsletter"
}
```

## Testing

### Manual Testing
1. Log in to your account
2. Navigate to **Account > Profile**
3. Scroll to **Marketing Preferences** card
4. Click **Edit** button
5. Toggle subscription preferences
6. Click **Save** and verify success toast
7. Refresh page and verify preferences persisted
8. Check Business Manager consent records

### Test Cases
- ✓ Card loads and displays current preferences
- ✓ Edit mode shows all subscription options
- ✓ SMS option only shows when phone number exists
- ✓ Toggles update local state correctly
- ✓ Save button submits to API
- ✓ Success toast appears after save
- ✓ Cancel button reverts to server state
- ✓ Error alerts display properly
- ✓ Focus management works correctly

## Accessibility

- Keyboard navigable (Tab, Enter, Space)
- Proper ARIA labels on all form controls
- Focus management on edit/cancel/save
- Screen reader announcements for state changes
- Proper heading hierarchy

## Troubleshooting

### Card shows error on load
- Verify subscription IDs match Business Manager configuration
- Check API credentials and SLAS setup
- Ensure customer has an active session

### SMS option not showing
- Customer needs a phone number in their profile
- Add phone in the Profile Card first

### Changes not persisting
- Check browser console for API errors
- Verify Business Manager subscriptions are active
- Ensure customer email/phone matches contact point values

### "Email address required" error
- Customer needs email in their profile
- This shouldn't normally happen for registered customers

## Dependencies

- `useMarketingConsent` hook
- `useCurrentCustomer` hook
- `ToggleCard` components
- Chakra UI components
- React Hook Form (via FormActionButtons)

## Performance

- Uses `useEffect` with proper dependencies to avoid unnecessary re-renders
- Local state during editing prevents API calls on every toggle
- Bulk update API call on save instead of individual calls
- Skeleton loaders for initial load state

