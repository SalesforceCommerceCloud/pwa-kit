# ✅ my_domain Fix Complete!

## Changes Applied to `/Users/snigdhachaturvedi/pwa-kit/packages/template-retail-react-app/app/components/shopper-agent/`

### 1. **index.jsx** - Main Component

#### ✅ Added Import (Line 13)
```javascript
import {
    useAccessToken,
    useConfig,
    useConfigurations,  // ✅ NEW
    useCustomerType,
    useUsid
} from '@salesforce/commerce-sdk-react'
```

#### ✅ Fetch my_domain from API (Lines 211-212)
```javascript
// Fetch my_domain from Shopper Configurations API
const {data: configurationsData} = useConfigurations({})
const myDomain = configurationsData?.my_domain
```

#### ✅ Added to embeddedLifecycleRef (Line 257)
```javascript
embeddedLifecycleRef.current = {
    siteId,
    localeId: locale.id,
    preferredCurrency: locale.preferredCurrency,
    commerceOrgId,
    usid,
    refreshToken,
    sfLanguage,
    domainUrl,
    organizationId,
    configSiteId,
    myDomain  // ✅ NEW
}
```

#### ✅ Extract myDomain from ref (Line 405)
```javascript
const {
    organizationId: orgId,
    configSiteId: sid,
    myDomain: myDomainValue  // ✅ NEW
} = embeddedLifecycleRef.current
if (!orgId || !sid) return
if (!myDomainValue) return  // ✅ NEW: Guard clause
```

#### ✅ Pass to callTokenBridge (Line 435)
```javascript
const result = await callTokenBridge({
    authLinkKey,
    slasAccessToken,
    slasRefreshToken,
    myDomain: myDomainValue  // ✅ NEW
})
```

#### ✅ Added to useEffect dependencies (Line 501)
```javascript
}, [
    siteId,
    locale.id,
    locale.preferredCurrency,
    commerceOrgId,
    usid,
    theme.zIndices.sticky,
    refreshToken,
    domainUrl,
    organizationId,
    configSiteId,
    myDomain  // ✅ NEW
])
```

---

### 2. **token-bridge.js** - Token Bridge Module

#### ✅ Updated Flow Documentation (Lines 17-30)
```javascript
 * Flow:
 *   1. Browser reads:
 *      - SLAS access token via useAccessToken hook
 *      - SLAS refresh token via useRefreshToken hook
 *      - my_domain via useConfigurations hook (Shopper Configurations API)  // ✅ NEW
 *      All three tokens plus my_domain are sent in the request body to the
 *      same-origin proxy (POST /api/agent/identity/bridge), along with auth_link_key.
```

#### ✅ Updated resolveAncMyDomain to accept parameter (Lines 36-48)
```javascript
export function resolveAncMyDomain(myDomain) {
    if (!myDomain || typeof myDomain !== 'string') return null
    const trimmed = myDomain.trim().replace(/\/+$/, '')
    if (!trimmed) return null
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
}
```

#### ✅ Extract my_domain from request body (Line 58)
```javascript
const {
    auth_link_key: authLinkKey,
    slas_access_token: slasAccessToken,
    slas_refresh_token: refreshToken,
    my_domain: myDomainFromConfig  // ✅ NEW
} = req.body || {}
```

#### ✅ Pass to resolveAncMyDomain (Line 67)
```javascript
const myDomain = resolveAncMyDomain(myDomainFromConfig)  // ✅ Pass parameter
```

#### ✅ Updated error message (Lines 69-71)
```javascript
console.error(
    '[token-bridge] ANC MyDomain is not configured. ' +
        'Provide my_domain via the Shopper Configurations API.'  // ✅ Updated
)
```

#### ✅ Updated callTokenBridge signature (Lines 113-144)
```javascript
export const callTokenBridge = async ({
    authLinkKey,
    slasAccessToken,
    slasRefreshToken,
    myDomain  // ✅ NEW parameter
}) => {
    const res = await fetch(TOKEN_BRIDGE_PROXY_PATH, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            auth_link_key: authLinkKey,
            slas_access_token: slasAccessToken,
            ...(slasRefreshToken ? {slas_refresh_token: slasRefreshToken} : {}),
            ...(myDomain ? {my_domain: myDomain} : {})  // ✅ NEW
        })
    })
```

---

## How It Works Now

### Data Flow:
1. **Component mounts** → `useConfigurations({})` fetches from Shopper Configurations API
2. **API returns** → Extract `my_domain` from response: `configurationsData?.my_domain`
3. **Store in ref** → `embeddedLifecycleRef.current.myDomain = myDomain`
4. **Conversation starts** → Extract from ref: `const {myDomain: myDomainValue} = embeddedLifecycleRef.current`
5. **Guard clause** → Skip Token Bridge if `!myDomainValue`
6. **Call Token Bridge** → Pass `myDomain: myDomainValue` to `callTokenBridge()`
7. **Browser → Server** → POST body includes `my_domain` field
8. **Server resolves** → `resolveAncMyDomain(myDomainFromConfig)` validates and formats
9. **Server → Core** → Forwards to Core's `/agent/identity/bridge` with resolved domain

---

## Testing

### 1. Check Configurations API Call
```
GET /mobify/proxy/api/shopper-configurations/v1/organizations/{orgId}/configurations
```
**Expected Response:**
```json
{
  "my_domain": "https://your-org.salesforce.com",
  ...
}
```

### 2. Check Token Bridge Request
```
POST /api/agent/identity/bridge
```
**Expected Payload:**
```json
{
  "auth_link_key": "...",
  "slas_access_token": "...",
  "slas_refresh_token": "...",
  "my_domain": "https://your-org.salesforce.com"
}
```

### 3. Server Logs
If `my_domain` is missing, you should see:
```
[token-bridge] ANC MyDomain is not configured. Provide my_domain via the Shopper Configurations API.
```

---

## Summary

✅ **my_domain is now fetched from Shopper Configurations API**  
✅ **No longer needs to be in props or environment variables**  
✅ **Automatically passed through entire Token Bridge flow**  
✅ **Server validates and forwards to Core**  

The fix is complete and ready to test! 🎉
