# Group 4 Implementation Decisions

## D1: orderNo query param required on GET /api/order-access/order

**Decision:** The Express GET handler at `ssr.js:750` requires `orderNo` in `req.query` and returns 404 if it's absent — there is no "serve first cookie entry" fallback. The client therefore:
- Passes `orderNo` from router state when navigating from Step 2 (the normal flow).
- On refresh/SSR (no router state), sends the request **without** `orderNo`, which triggers a 404. The `useEffect` then redirects to `/order-access?expired=1`.

This is intentionally conservative: a hard refresh after a session clears router state is treated as an expired session, prompting the user to re-authenticate. This is the safest behaviour and consistent with the HttpOnly cookie design.

## D2: useQuery mock strategy in tests

**Decision:** Mocked `@tanstack/react-query`'s `useQuery` at the module level in `pages.test.js` rather than wrapping components in a `QueryClientProvider` with `msw`. The codebase's existing tests use this pattern (see `payment-processing.test.js`). This avoids test infrastructure complexity while providing precise control over loading/error/success states.

## D3: Shipping address display (postalCode only)

**Decision:** The server's `filterGuestOrderFields` strips all address fields except `postalCode` from `shippingAddress` (see `ssr.js:94-105`). The client renders only `postalCode` accordingly — no street address, city, state, or phone shown, as the server does not return them.

## D4: `?expired=1` redirect target includes the query string

**Decision:** Redirects to `/order-access?expired=1` (with query string) so Step 1 (`request.jsx`) detects the expired flag and shows the alert banner. Both `history.replace('/order-access?expired=1')` and the `isExpired` check in `request.jsx` use the query string approach.

## D5: Translation keys use English defaultMessage for all 16 peer locales

**Decision:** All new `guestOrderAccess.order.*` and `guestOrderAccess.request.alert.*` keys use English `defaultMessage` values in the 16 non-en-GB locale files. Localisation is handled separately by the i18n team — the keys must exist so the app compiles and the react-intl fallback works.

## D6: Suppressed field set exported for test access (S10)

**Decision:** `GUEST_ORDER_CLIENT_SUPPRESSED_FIELDS` is exported from `order.jsx` so the S10 parametrized test can import and assert on it directly, verifying the client-side set is complete without duplicating the values in the test file.
