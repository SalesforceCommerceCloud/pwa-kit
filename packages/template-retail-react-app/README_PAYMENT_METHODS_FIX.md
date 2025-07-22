# Apple Pay "Buy Now" - Payment Methods 404 Fix

## Problem Statement

When implementing Apple Pay "Buy Now" functionality, the call to `api/adyen/paymentMethods?siteId=RefArch&locale=en-US` was returning a 404 "invalid basket" error. This prevented Apple Pay from being initialized because:

1. The original Adyen payment methods API requires a basket to be present
2. For "Buy Now" flow, we want to show Apple Pay before creating a basket
3. This creates a chicken-and-egg problem: we need payment methods to show Apple Pay, but the API needs a basket

## Solution Overview

We've implemented a custom payment methods controller that can fetch payment methods without requiring a basket dependency. This allows Apple Pay to be displayed in "Buy Now" scenarios while maintaining backward compatibility with the regular checkout flow.

## Implementation Details

### 1. Custom Payment Methods API (`app/api/adyen/paymentMethods/standalone.js`)

- **Endpoint**: `/api/adyen/paymentMethods/standalone`
- **Method**: GET
- **Purpose**: Fetch payment methods directly from Adyen without basket dependency

**Key Features:**
- Reads Adyen configuration from environment variables (prefixed with site ID)
- Calls Adyen API directly with minimal required parameters
- Returns payment methods along with environment configuration
- No basket ID required

### 2. Payment Methods Service (`app/components/apple-pay-express/utils/payment-methods.js`)

```javascript
export class AdyenPaymentMethodsService {
    async getPaymentMethods() {
        // Fetches payment methods without requiring basket ID
    }
}
```

### 3. Standalone Payment Methods Hook (`app/components/apple-pay-express/hooks/use-standalone-payment-methods.js`)

```javascript
export function useStandalonePaymentMethods(authToken, site, locale) {
    // Custom hook that fetches payment methods for "Buy Now" flow
}
```

### 4. Enhanced Apple Pay Component (`app/components/apple-pay-express/index.jsx`)

The ApplePayExpress component now supports dual modes:

**"Buy Now" Mode (when `sku` prop is provided):**
- Uses standalone payment methods API
- Creates temporary basket only when Apple Pay button is clicked
- Independent of main shopping cart

**Regular Mode (when no `sku` prop):**
- Uses original `useAdyenExpressCheckout` hook
- Requires existing basket
- Works with main shopping cart

## Environment Configuration

The standalone API requires the following environment variables:

```bash
# Replace 'RefArch' with your actual site ID
RefArch_ADYEN_API_KEY="your_api_key"
RefArch_ADYEN_MERCHANT_ACCOUNT="your_merchant_account"
RefArch_ADYEN_ENVIRONMENT="test"  # or "live"
RefArch_ADYEN_CLIENT_KEY="your_client_key"
```

## Usage Examples

### 1. Product Detail Page (Buy Now)

```jsx
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express'

// In ProductView component
<ApplePayExpress sku={product.id} />
```

### 2. Cart Page (Regular Checkout)

```jsx
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express'

// In Cart component
<ApplePayExpress />  // No SKU = regular mode
```

### 3. Express Page with PDP Mode

```jsx
// URL: /express?pdp=true
// Use postMessage to set SKU dynamically
const iframe = document.getElementById('expressCheckout');
iframe.contentWindow.postMessage({
    type: 'UPDATE_SKU',
    sku: 'green-umbrella-variant-1'
}, '*');
```

## Technical Flow

### Buy Now Flow:
1. **Component Initialization**: Express component loads with `?pdp=true` flag
2. **PostMessage**: SKU is set via postMessage from parent window
3. **Payment Methods**: Standalone hook fetches payment methods without basket
4. **Apple Pay Button**: Button displays with minimal configuration
5. **User Clicks**: Temporary basket is created with the SKU
6. **Payment Processing**: Uses temporary basket for the entire payment flow

### Regular Checkout Flow:
1. **Component Initialization**: Express component loads without `?pdp=true` flag
2. **Payment Methods**: Standard Adyen hook fetches payment methods (requires basket)
3. **Apple Pay Button**: Button displays with existing basket data
4. **User Clicks**: Uses existing shopping cart basket
5. **Payment Processing**: Standard checkout flow

## API Reference

### Standalone Payment Methods API

**Request:**
```
GET /api/adyen/paymentMethods/standalone?siteId=RefArch&locale=en-US
Authorization: Bearer {token}
```

**Response:**
```json
{
  "paymentMethods": [
    {
      "type": "applepay",
      "configuration": {
        "merchantName": "Your Store",
        "merchantIdentifier": "merchant.yourstore"
      }
    }
  ],
  "environment": {
    "ADYEN_ENVIRONMENT": "test",
    "ADYEN_CLIENT_KEY": "test_client_key"
  },
  "applicationInfo": {
    "adyenLibrary": {
      "name": "adyen-salesforce-pwa",
      "version": "3.0.0"
    }
  }
}
```

## Error Handling

The implementation includes comprehensive error handling:

- **Missing Environment Variables**: Returns 500 with detailed error message
- **Adyen API Errors**: Logs errors and returns appropriate HTTP status
- **Network Failures**: Graceful fallback with error logging
- **Invalid Site ID**: Returns 400 with validation error

## Testing

Run the tests to ensure everything works correctly:

```bash
npm test app/components/apple-pay-express/utils/payment-methods.test.js
```

## Backward Compatibility

✅ **Fully backward compatible** - existing implementations continue to work without changes.

- Regular Apple Pay Express checkout flows are unchanged
- Cart page Apple Pay functionality remains the same
- No breaking changes to existing APIs

## Performance Considerations

- **Reduced Basket Creation**: Only creates baskets when necessary
- **Parallel Loading**: Payment methods and product data load independently
- **Efficient Caching**: Browser can cache payment methods response
- **Minimal API Calls**: Reduces unnecessary basket operations

## Migration Notes

If you're migrating from the previous implementation:

1. **No changes required** for existing cart/checkout flows
2. **Add `sku` prop** to enable "Buy Now" functionality
3. **Set environment variables** for standalone API access
4. **Test both flows** to ensure everything works correctly

## Troubleshooting

### Common Issues:

1. **404 Payment Methods Error**: Check environment variables are set correctly
2. **Apple Pay Unavailable**: Verify client key and environment configuration
3. **Temporary Basket Creation Fails**: Ensure temporary basket API is working
4. **Missing Adyen Configuration**: Check site ID prefix in environment variables

### Debug Mode:

Enable detailed logging by checking browser console for:
- `Standalone payment methods error:`
- `Failed to initialize AdyenCheckout:`
- `Apple Pay configuration not found:`

## Future Enhancements

Potential improvements for future releases:

1. **Payment Methods Caching**: Cache payment methods response to reduce API calls
2. **Progressive Enhancement**: Show Apple Pay button progressively as data loads
3. **Error Recovery**: Automatic fallback to regular checkout on errors
4. **Analytics Integration**: Track "Buy Now" vs regular checkout usage

---

## Summary

This implementation successfully resolves the payment methods 404 error by:

1. ✅ **Removing basket dependency** for payment methods fetching
2. ✅ **Maintaining backward compatibility** with existing flows
3. ✅ **Enabling "Buy Now" functionality** for product detail pages
4. ✅ **Supporting iframe integration** with URL parameters
5. ✅ **Providing comprehensive error handling** and logging
6. ✅ **Including thorough testing** and documentation

The solution follows Adyen PWA kit architecture patterns and integrates seamlessly with the existing Salesforce Commerce Cloud PWA implementation. 