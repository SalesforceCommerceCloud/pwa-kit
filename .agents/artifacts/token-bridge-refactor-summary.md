# Token Bridge Refactor Summary

## One-Line Summary
**Refactored token bridge to derive myDomain from ANC_MYDOMAIN environment variable server-side instead of passing it from client via Shopper Configurations API.**

---

## Changes Made

### 1. **index.jsx** (Client-side Shopper Agent Component)
- **Removed** `useConfigurations` hook import and usage
- **Removed** `myDomain` extraction from Shopper Configurations API
- **Removed** `myDomain` from `embeddedLifecycleRef` state
- **Updated** `handleEmbeddedMessagingConversationStarted` to remove `myDomain` validation and passing
- **Updated** `callTokenBridge` call to remove `myDomain` parameter

### 2. **token-bridge.js** (Server-side Token Bridge Handler)
- **Added** `extractMyDomainFromEnv()` function to read `ANC_MYDOMAIN` environment variable directly
- **Updated** `handleTokenBridge()` to:
  - Remove `my_domain` from request body parsing
  - Call `extractMyDomainFromEnv()` to get domain from env variable
  - Accept optional `config` parameter (for future flexibility)
- **Updated** `registerTokenBridgeRoute()` to accept and pass `config` parameter
- **Updated** `callTokenBridge()` browser helper to:
  - Remove `myDomain` parameter
  - Remove `my_domain` from request body
- **Updated** documentation comments to reflect ANC_MYDOMAIN usage

### 3. **ssr.js** (Server Setup)
- **Updated** `registerTokenBridgeRoute(app, config)` call to pass config object

### 4. **token-bridge.test.js** (Unit Tests)
- **Updated** all tests to use `process.env.ANC_MYDOMAIN` instead of passing `my_domain` in request body
- **Added** mock console spies to suppress log output in tests
- **Removed** `my_domain` from all request body assertions
- **Updated** test descriptions to reflect env variable usage

---

## Environment Variable Required

Set this environment variable before deployment:

```bash
export ANC_MYDOMAIN="https://orgfarm-8fcc267362.test1.my.pc-rnd.site.com"
```

---

## Benefits

1. **Simpler client code** - No need to fetch from Shopper Configurations API
2. **Fewer API calls** - Eliminates one API roundtrip on page load
3. **Better security** - Domain is configured server-side, not exposed to client
4. **Easier configuration** - Single environment variable vs API configuration
5. **Consistent with other env vars** - Follows PWA Kit pattern for sensitive config

---

## Testing Checklist

- [x] Tests updated to use ANC_MYDOMAIN env variable
- [x] Client no longer sends my_domain in request
- [x] Server reads from ANC_MYDOMAIN
- [x] Error handling for missing/invalid domain
- [x] HttpOnly mode tests updated
- [x] Non-HttpOnly mode tests updated
- [ ] Integration test with actual ANC_MYDOMAIN set
- [ ] Verify in deployed environment
