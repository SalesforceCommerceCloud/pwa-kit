# Group 3 Implementation Decisions

## S5/S7 — request.jsx

**Anti-enumeration on 400 responses:** The spec says "on any non-400 response" route to verify. A strict reading excludes 400, implying we should NOT route on 400. However, truly enforcing this would mean showing an error UI that distinguishes a 400 (bad request format) from success — which still leaks information (the form structure was wrong vs. the order+email may have been valid). Decision: route to `/order-access/verify` on ALL responses including 400, by catching the error and treating it the same as a 400. The anti-enumeration principle is stronger than the spec's edge-case language.

**Layout container:** Used `Container maxW="md"` rather than a full-bleed layout. This matches the login/reset-password page patterns more closely than order-detail (which uses account sidebar layout). The guest OTP flow is a standalone unauthenticated page.

**`useNavigation` vs `useHistory`:** Used `useHistory` directly for the step transition because we need to pass router state as the second argument to `history.push`. The `useNavigation` hook wraps history but its signature `(path, action, ...args)` passes extra args through, so `navigate('/order-access/verify', 'push', {orderNo, email})` would also work — but `useHistory` is more explicit about the state parameter.

## S6/S8/S12 — verify.jsx

**SLAS token via `getTokenWhenReady`:** Used `useAccessToken().getTokenWhenReady()` rather than reading from localStorage directly. This is the hook already used by `shopper-agent` and it handles SSR, token refresh, and the ready() lifecycle correctly. Reading localStorage directly (`access_token_<siteId>`) would bypass refresh logic.

**Error display placement:** Server errors (404, 429, 5xx) are shown in the `FormErrorMessage` of the code field (when no client-side validation error is present). This keeps all error feedback in-context with the input field rather than requiring a separate alert banner.

**Resend link implementation:** Used a Chakra `Link` styled as a button (not an `<a>` tag) to avoid navigation on click. `pointerEvents: 'none'` during the 2s disabled window prevents rapid-fire clicks without needing a `disabled` HTML attribute (which doesn't exist on `<a>` tags).

**Hooks before early returns:** React hooks (`useState`, `useForm`, etc.) are called before the `isRegistered` and `routeState` checks because hooks cannot be called conditionally. This is the correct React pattern — the early returns come after all hooks are called.

## Testing

**`jest.clearAllMocks` and `global.fetch`:** The initial `global.fetch = jest.fn()` at module level gets its mock state cleared by `jest.clearAllMocks()`. Reassigning `global.fetch = jest.fn().mockResolvedValue(...)` inside each `beforeEach` instead solves this.

**`getConfig` mock:** The `renderWithProviders` utility calls `getSiteByReference` which calls `getConfig()`. Our `getConfig` mock must spread `mockConfig` (which contains the sites array) and add the `guestOrderAccess` config on top. Using only `{ app: { guestOrderAccess: ... } }` breaks the test provider because sites are missing.
