# Updated PR Description - Token Bridge Flow

## 📊 Flow Charts

### Token Bridge Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SHOPPER AGENT TOKEN BRIDGE FLOW              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐
│  Shopper clicks  │
│  MIAW floating   │
│     button       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  onEmbeddedMessagingConversationStarted event fires              │
│  (ShopperAgent component listens)                                │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Call getAuthLinkKey() from MIAW API                             │
│  File: app/components/shopper-agent/index.jsx                    │
└────────┬──────────────────────────────────┬──────────────────────┘
         │                                  │
    ✅ Success                          ❌ Failure
         │                                  │
         ▼                                  ▼
┌──────────────────────────────────┐  ┌─────────────────────────┐
│  Gather authentication data:     │  │  Log error              │
│  • authLinkKey (from MIAW)       │  │  Reset MIAW session     │
│  • SLAS access token             │  │  Show error toast       │
│    (getTokenWhenReady)           │  └─────────────────────────┘
│  • Detect HttpOnly mode          │
│    (isHttpOnly = !token)         │
│  • siteId (from config)          │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  callTokenBridge() - Browser helper                              │
│  POST /api/agent/identity/bridge (same-origin proxy)             │
│  File: app/components/shopper-agent/token-bridge.js              │
│                                                                   │
│  Headers: {                                                       │
│    "x-site-id": "RefArch"  // For cookie name resolution         │
│  }                                                                │
│                                                                   │
│  Body (HttpOnly mode):                                            │
│    {                                                              │
│      auth_link_key: "..."                                         │
│      // No tokens - sent as HttpOnly cookies automatically       │
│    }                                                              │
│                                                                   │
│  Body (Non-HttpOnly mode):                                        │
│    {                                                              │
│      auth_link_key: "...",                                        │
│      slas_access_token: "..."  // From localStorage              │
│    }                                                              │
│                                                                   │
│  Note: Browser automatically sends HttpOnly cookies:             │
│    cc-at_{siteId}, cc-nx_{siteId}, cc-nx-g_{siteId}             │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  PWA Kit SSR - Node.js Express Handler                           │
│  handleTokenBridge() - Server-side validation                    │
│  File: app/components/shopper-agent/token-bridge.js              │
│  Registered in: app/ssr.js                                       │
│                                                                   │
│  Server-side processing:                                          │
│  1. Extract siteId from x-site-id header (getSiteId)             │
│  2. Detect HttpOnly mode (env: MRT_ENABLE_HTTPONLY_SESSION_...)  │
│  3. Read tokens:                                                  │
│     • HttpOnly mode: Read from cookies using getCookieName()     │
│       - cc-at_{siteId} → access token                            │
│       - cc-nx_{siteId} or cc-nx-g_{siteId} → refresh token       │
│     • Non-HttpOnly: Read access token from body, refresh from    │
│       cookies                                                     │
│  4. Extract myDomain from ANC_MYDOMAIN env variable              │
│  5. Validate myDomain against Salesforce allowlist (SSRF check)  │
│                                                                   │
│  Validates:                                                       │
│  ✓ auth_link_key present                                         │
│  ✓ slas_access_token available (cookie or body)                  │
│  ✓ myDomain from env & trusted domain                            │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  Forward to Core Identity Bridge                                 │
│  POST {myDomain}/agent/identity/bridge                           │
│  (myDomain from ANC_MYDOMAIN env, e.g.,                          │
│   https://orgfarm-xxx.test1.my.pc-rnd.site.com)                 │
│                                                                   │
│  Headers: {                                                       │
│    Authorization: "SLAS <access_token>",                         │
│    Content-Type: "application/json"                              │
│  }                                                                │
│                                                                   │
│  Body: {                                                          │
│    auth_link_key: "...",                                          │
│    refresh_token: "..."  (optional - from cookie)                │
│  }                                                                │
└────────┬──────────────────────────────────┬──────────────────────┘
         │                                  │
    ✅ 200 OK                           ❌ 4xx/5xx Error
         │                                  │
         ▼                                  ▼
┌──────────────────────────────┐  ┌─────────────────────────────┐
│  Core creates Named          │  │  Log error with status      │
│  Credential for Commerce     │  │  Reset MIAW session         │
│  API authentication          │  │  Show error toast:          │
│                              │  │  "Something went wrong.     │
│  Agent can now make          │  │   Try again."               │
│  authenticated API calls:    │  └─────────────────────────────┘
│  • View order history        │
│  • Update cart               │
│  • Access customer profile   │
└──────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Conversation continues      │
│  with full authentication    │
└──────────────────────────────┘
```

---

### Session Reset on Authentication Transitions

```
┌─────────────────────────────────────────────────────────────────┐
│              SESSION RESET ON AUTH TRANSITIONS                  │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  Authentication State Change Triggers:                           │
│  • User logs in (guest → registered)                             │
│  • User logs out (registered → guest)                            │
│  • User registers (guest → registered)                           │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  resetEmbeddedMessagingForCommerceSessionChange()                │
│  File: app/utils/shopper-agent-utils.js                          │
│                                                                   │
│  Called from:                                                     │
│  • app/components/header/index.jsx (onSignoutClick)              │
│  • app/components/drawer-menu/drawer-menu.jsx (onSignoutClick)   │
│  • app/pages/account/index.jsx (onSignoutClick)                  │
│  • app/components/shopper-agent/index.jsx (useEffect on          │
│    customerType change)                                          │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│  embeddedservice_bootstrap.userVerificationAPI.clearSession(true)│
│  • Ends active messaging session                                 │
│  • Closes chat window (if open)                                  │
│  • Returns to floating action button                             │
│  • Clears agent conversation memory                              │
└────────┬─────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  Fresh agent session ready   │
│  with correct shopper        │
│  identity on next click      │
└──────────────────────────────┘
```

---

## 🎯 Key Changes Summary

### 1️⃣ **Token Bridge Authentication Flow**
When a shopper clicks the MIAW floating button and starts a conversation:
- ✅ Get `authLinkKey` from MIAW API
- ✅ Detect HttpOnly mode (check if token accessible to JS)
- ✅ Call Token Bridge endpoint:
  - **HttpOnly mode**: Tokens sent as cookies automatically
  - **Non-HttpOnly mode**: Access token in body, refresh token in cookie
- ✅ Server reads `myDomain` from `ANC_MYDOMAIN` env variable
- ✅ Server validates domain against Salesforce allowlist (SSRF prevention)
- ✅ Token Bridge proxies to Core's identity bridge

**Files Changed:**
- **`app/components/shopper-agent/token-bridge.js`** ⭐ NEW
  - `callTokenBridge()` - Browser function to POST to same-origin proxy
    - Sends `x-site-id` header for cookie name resolution
    - Omits token in HttpOnly mode (sent as cookie)
  - `handleTokenBridge()` - Node.js Express handler
    - Reads tokens from cookies in HttpOnly mode using `getCookieName()`
    - Reads `myDomain` from `ANC_MYDOMAIN` env variable
    - Validates domain against Salesforce allowlist
    - Forwards to Core with `Authorization: SLAS` header
  - `registerTokenBridgeRoute()` - Mounts `/api/agent/identity/bridge` route
  - `extractMyDomainFromEnv()` - Extracts domain from env variable
  
- **`app/components/shopper-agent/token-bridge.test.js`** ⭐ NEW
  - 661 lines of comprehensive test coverage
  - Tests both HttpOnly and non-HttpOnly modes
  - Tests cookie reading, domain validation, error handling
  
- **`app/ssr.js`**
  - Registers Token Bridge route on Express app startup
  - Updated comment to reflect HttpOnly support and env-based domain
  
- **`app/components/shopper-agent/index.jsx`**
  - Added `onEmbeddedMessagingConversationStarted` event listener
  - Detects HttpOnly mode: `isHttpOnly = !slasAccessToken || slasAccessToken === ''`
  - Calls `getAuthLinkKey()` → `callTokenBridge()` on conversation start
  - Omits tokens from body in HttpOnly mode
  - Shows error toast if Token Bridge fails
  - ~~Fetches myDomain from useConfigurations hook~~ **REMOVED** - now server-side

---

### 2️⃣ **Session Reset on Login/Logout**
Reset MIAW chatbot memory whenever authentication state changes to prevent stale agent context:
- ✅ Calls `clearSession(true)` on login, logout, registration
- ✅ Closes active chat and returns to floating button
- ✅ Ensures fresh agent session with correct shopper identity

**Files Changed:**
- **`app/utils/shopper-agent-utils.js`**
  - New function: `resetEmbeddedMessagingForCommerceSessionChange()`
  - Calls MIAW `userVerificationAPI.clearSession(true)`
  
- **`app/components/header/index.jsx`**
  - Calls reset before `logout.mutateAsync()` in `onSignoutClick()`
  
- **`app/components/drawer-menu/drawer-menu.jsx`**
  - Calls reset before `logout.mutateAsync()` in `onSignoutClick()`
  
- **`app/pages/account/index.jsx`**
  - Calls reset before `logout.mutateAsync()` in `onSignoutClick()`
  
- **`app/components/shopper-agent/index.jsx`**
  - Added `useEffect` that monitors `customerType` changes
  - Automatically resets MIAW when switching between guest ↔ registered

---

### 3️⃣ **MIAW Hook Cleanup**
Removed vestigial `_refreshToken` parameter from `useMiaw` to prevent positional arg misalignment:
- ✅ Removed unused `_refreshToken` parameter from function signature
- ✅ Updated JSDoc to remove parameter documentation
- ✅ Removed from test mocks
- ✅ Improves code clarity - only includes parameters actually used

**Files Changed:**
- **`app/hooks/use-miaw.js`**
  - ~~Removed `refreshToken` from `useEffect` dependency array~~
  - ~~Renamed param to `_refreshToken` (underscore prefix indicates "unused in effect")~~
  - **UPDATED**: Removed `_refreshToken` parameter entirely from function signature
  
- **`app/hooks/use-miaw.test.js`**
  - ~~Added test: "should not re-initialize when only refresh token changes"~~
  - **UPDATED**: Removed `refreshToken` from test `mockParams`
  - **UPDATED**: Deleted obsolete test for refresh token re-initialization

---

## 🔐 Security Improvements

### SSRF Prevention
- ✅ `myDomain` no longer client-supplied (was SSRF vulnerability)
- ✅ Now read from `ANC_MYDOMAIN` server-side environment variable
- ✅ Validated against Salesforce domain allowlist:
  - `*.salesforce.com`
  - `*.my.salesforce.com`
  - `*.pc-rnd.salesforce.com`
- ✅ Returns `400 UNTRUSTED_MYDOMAIN` for invalid domains

### HttpOnly Cookie Support
- ✅ Full support for `enableHttpOnlySessionCookies` mode
- ✅ Tokens read from HttpOnly cookies server-side (XSS protection maintained)
- ✅ Uses official PWA Kit helpers: `getCookieName()`, `getSiteId()`
- ✅ Falls back to non-HttpOnly mode when disabled

### Error Handling
- ✅ Generic error messages to client (`INTERNAL_ERROR`)
- ✅ Detailed errors logged server-side only
- ✅ No internal error details exposed to browser

---

## 📝 Environment Variables

### Required
```bash
# ANC MyDomain - Core Identity Bridge endpoint
ANC_MYDOMAIN="https://orgfarm-xxx.test1.my.pc-rnd.site.com"
```

### Optional
```bash
# Enable HttpOnly session cookies (default: false)
MRT_ENABLE_HTTPONLY_SESSION_COOKIES="true"
```

---

## 🧪 Test Coverage

### Unit Tests
- ✅ **token-bridge.test.js** (661 lines)
  - Non-HttpOnly mode: access token from body, refresh from cookie
  - HttpOnly mode: both tokens from cookies
  - Domain validation (trusted vs untrusted)
  - Error handling (missing tokens, invalid domain, Core errors)
  - Cookie name resolution using helpers
  
- ✅ **index.test.js**
  - HttpOnly mode detection and token omission
  - Token Bridge call validation
  - Error handling and session reset
  
- ✅ **use-miaw.test.js**
  - MIAW initialization
  - ~~Refresh token independence~~ Parameter removed

---

## 📊 Summary by File

| File | Purpose | Lines Changed |
|------|---------|---------------|
| **`token-bridge.js`** | ⭐ NEW - Token Bridge client & server logic | +200 |
| **`token-bridge.test.js`** | ⭐ NEW - Comprehensive test suite | +661 |
| **`index.jsx`** | Token Bridge integration + HttpOnly detection + session reset | +120 / -20 |
| **`index.test.js`** | Tests for Token Bridge & HttpOnly mode | +50 / -10 |
| **`shopper-agent-utils.js`** | New reset utility function | +38 |
| **`shopper-agent-utils.test.js`** | Tests for reset utility | +58 |
| **`use-miaw.js`** | Removed vestigial parameter | -1 |
| **`use-miaw.test.js`** | Updated tests | -17 |
| **`ssr.js`** | Register Token Bridge route + updated comment | +9 / -14 |
| **`header/index.jsx`** | Call reset on logout | +2 |
| **`drawer-menu.jsx`** | Call reset on logout | +2 |
| **`account/index.jsx`** | Call reset on logout | +2 |
| **Translation files** (3 files) | Error message for Token Bridge failure | +6 |

**Total Impact:**  
✅ ~1,150 additions  
✅ ~80 deletions  
✅ 17 files changed
