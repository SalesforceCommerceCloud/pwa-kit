# Test Updates Complete ✅

## Summary

All tests have been updated to support the new client-side `my_domain` guard check implementation.

## Changes Made

### 1. Fixed Missing Import (index.jsx)
**File**: `app/components/shopper-agent/index.jsx`
**Line**: 9-16

Added `useConfigurations` to the imports from `@salesforce/commerce-sdk-react`:

```javascript
import {
    useAccessToken,
    useConfig,
    useConfigurations,  // ← ADDED
    useCustomerType,
    useUsid
} from '@salesforce/commerce-sdk-react'
```

### 2. Added Test Cases (index.test.js)
**File**: `app/components/shopper-agent/index.test.js`

Added 3 new test cases after the existing test "should NOT call Token Bridge when organizationId or siteId is missing":

#### Test Case 1: No my_domain configuration
```javascript
test('should NOT call Token Bridge when my_domain is not configured', async () => {
    mockedUseConfigurations.mockReturnValue({
        data: {
            configurations: []
        }
    })
    // ... test expects callTokenBridge NOT to be called
})
```

#### Test Case 2: Empty my_domain value
```javascript
test('should NOT call Token Bridge when my_domain value is empty', async () => {
    mockedUseConfigurations.mockReturnValue({
        data: {
            configurations: [
                {
                    configurationType: 'globalConfiguration',
                    id: 'my_domain',
                    value: ''
                }
            ]
        }
    })
    // ... test expects callTokenBridge NOT to be called
})
```

#### Test Case 3: Undefined configurations data
```javascript
test('should NOT call Token Bridge when useConfigurations returns undefined', async () => {
    mockedUseConfigurations.mockReturnValue({
        data: undefined
    })
    // ... test expects callTokenBridge NOT to be called
})
```

## Test Coverage

### Client-Side Guard Tests (index.test.js)
- ✅ my_domain missing from configurations
- ✅ my_domain value is empty string
- ✅ configurations data is undefined
- ✅ Happy path: my_domain is properly configured

### Server-Side Tests (token-bridge.test.js)
- ✅ ANC_MYDOMAIN environment variable missing
- ✅ ANC_MYDOMAIN is whitespace-only
- ✅ ANC_MYDOMAIN contains invalid domain (SSRF attempts)
- ✅ ANC_MYDOMAIN contains valid Salesforce domain
- ✅ HttpOnly mode: tokens from cookies
- ✅ Non-HttpOnly mode: access token from body, refresh token from cookie

## Implementation Details

### Client-Side Logic
**Location**: `app/components/shopper-agent/index.jsx:211-214, 406`

```javascript
// Fetch my_domain from Shopper Configurations API
const {data: configurationsData} = useConfigurations({})
const myDomain = configurationsData?.configurations?.find(
    (config) => config.configurationType === 'globalConfiguration' && config.id === 'my_domain'
)?.value

// Guard check in handleEmbeddedMessagingConversationStarted
if (!myDomain) return  // Short-circuit if not configured
```

### Server-Side Logic
**Location**: `app/components/shopper-agent/token-bridge.js:87-96, 158-166`

```javascript
// Extract from ANC_MYDOMAIN environment variable
export function extractMyDomainFromEnv() {
    const myDomain = process.env.ANC_MYDOMAIN
    if (!myDomain) {
        console.error('[token-bridge] ANC_MYDOMAIN environment variable not set')
        return null
    }
    return myDomain.trim()
}

// In handleTokenBridge
const myDomain = extractMyDomainFromEnv()
if (!myDomain) {
    return res.status(500).json({error: 'MYDOMAIN_NOT_CONFIGURED'})
}
```

## Architecture

### Dual-Check Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE GUARD                        │
│  (app/components/shopper-agent/index.jsx)                   │
├─────────────────────────────────────────────────────────────┤
│  1. Fetch my_domain from Shopper Configurations API         │
│  2. Check if my_domain exists and is non-empty              │
│  3. If NOT set → short-circuit (skip Token Bridge)          │
│  4. If set → proceed with Token Bridge call                 │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   SERVER-SIDE GUARD                         │
│  (app/components/shopper-agent/token-bridge.js)             │
├─────────────────────────────────────────────────────────────┤
│  1. Read ANC_MYDOMAIN from environment variable             │
│  2. Validate against Salesforce domain allowlist            │
│  3. If invalid → return 500 error                           │
│  4. If valid → forward request to Core Token Bridge         │
└─────────────────────────────────────────────────────────────┘
```

### Security Benefits

1. **Client-side guard**: Prevents unnecessary API calls when misconfigured
2. **Server-side validation**: SSRF protection via domain allowlist
3. **Environment variable**: Domain from trusted source, not client input
4. **Silent failure**: Better UX when not configured (vs error toast)

## Test Execution Checklist

- [x] Added `useConfigurations` import to index.jsx
- [x] Added test for missing my_domain configuration
- [x] Added test for empty my_domain value
- [x] Added test for undefined configurations data
- [x] Verified existing token-bridge.test.js uses ANC_MYDOMAIN
- [x] Verified all test mocks are properly configured

## Files Modified

1. ✅ `app/components/shopper-agent/index.jsx` - Added useConfigurations import
2. ✅ `app/components/shopper-agent/index.test.js` - Added 3 guard check tests

## Files Already Correct (No Changes Needed)

1. ✅ `app/components/shopper-agent/token-bridge.js` - Already uses ANC_MYDOMAIN
2. ✅ `app/components/shopper-agent/token-bridge.test.js` - Already tests ANC_MYDOMAIN

---

**Status**: All tests fixed and ready for CI pipeline ✅
**Date**: 2026-06-16
