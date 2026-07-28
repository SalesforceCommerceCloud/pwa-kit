# Group 5 Decisions

## S13 — Error UX

**"Request a new code" link on 404 errors:** Implemented as an `<a href="/order-lookup">` inside the FormErrorMessage on the 404/invalidCode error state. Used a hard `<a>` tag rather than react-router `<Link>` because the user must restart the flow from scratch (no state to carry over). The href navigates to the root of the flow.

**Submit button re-enables after error:** The submit button was already correctly using `isDisabled={isSubmitting}` (not `isDisabled={isSubmitting || !!serverError}`), so it re-enables naturally after the `finally` block sets `isSubmitting = false`. No change needed.

**"Request a new code" link only on 404:** The link is conditional on `serverErrorType === 'invalidCode'`. It does not appear for 429 (throttle) or 5xx (generic) errors, since those don't require requesting a new code — they indicate rate limiting or transient failures.

## S15 — Throttle middleware

**In-process Map throttle, not per-endpoint:** The throttle middleware (`createVerifyThrottle()`) checks `req.path.startsWith('/api/order-lookup/')` to limit scope. It's registered via `app.use(createVerifyThrottle())` before the verify and order endpoints, which is correct — it applies to all order-access routes. This is defense-in-depth (SCAPI also throttles upstream).

**No external library:** Implemented as a closure over a `Map<ip, {count, resetAt}>`. No `express-rate-limit` or other dependency added.

**Exported for testability:** `createVerifyThrottle` is exported from ssr.js so the unit tests can call it directly without spinning up Express.

## S16 — i18n catalog

**One new key added:** `guestOrderLookup.verify.error.requestNewCode` ("Request a new code") was added to en-GB.json and all 16 peer locales. Prior to S13 the error copy was inline prose ("...request a new code.") with no interactive element — now the link text needs its own message ID.

**Audit result:** All 45 existing keys in en-GB matched the IDs used in the JSX files exactly (no orphaned keys, no missing keys). After S13 the total is 46 keys, all present in all 17 locale files.

**Peer locale values:** Peer locale files received the en-GB defaultMessage value. Runtime falls back to en-GB for untranslated keys anyway, so this is a no-op functionally but keeps the key set consistent.

## S17 — Accessibility

**`setFocus('accessCode')` from react-hook-form:** Used `setFocus` from `useForm()` to return focus to the OTP input after a server error. This is the idiomatic RHF approach and avoids needing a separate `useRef`.

**`aria-invalid` with boolean JSX:** `aria-invalid={!!errors.accessCode || !!serverError}` renders as `aria-invalid="true"` or no attribute (falsy boolean attributes are omitted in React). The test was adjusted to accept both `null` and `"false"` as the no-error state.

**`aria-describedby` with Chakra ids:** Chakra's `FormControl` automatically appends its own feedback element id to `aria-describedby`. The attribute value is a space-separated list. The test verifies that our id (`accessCode-server-error`) is present in the list, rather than asserting an exact match.

**`role="alert"` on FormErrorMessage:** Added `role="alert"` directly to `<FormErrorMessage>` elements so that screen readers announce errors immediately when they appear. Chakra's own `FormErrorMessage` does not set this by default.

**`aria-live="polite"` on last-updated timestamp:** The "Last updated at {time}" Text element in order.jsx now has `aria-live="polite"` and `aria-atomic="true"` so screen readers announce the refresh time after a status update without re-reading the entire page.

## Test infrastructure

**`commerce-sdk-isomorphic` mock:** The pre-existing `guest-order-lookup.test.js` suite failed to run because `commerce-sdk-isomorphic` is not installed in the test node_modules. Fixed by adding `jest.mock('commerce-sdk-isomorphic', ..., {virtual: true})` at the top of the test file. The mock provides a `ShopperOrders` class stub. The helper functions under test (filterGuestOrderFields, parseGuestOrderCookie, evictIfNeeded, createVerifyThrottle) don't use ShopperOrders, so this is a pure infrastructure fix.

**node_modules:** The glo-error-i18n-a11y worktree has no node_modules installed. Tests were run using the node_modules from the glo-routing worktree (symlinked for test execution). This is consistent with how other worktrees in this chain operate.
