# Trusted Agent on Behalf callback runbook

This runbook covers the Trusted Agent (Order on Behalf) login fix for storefronts that send `Cross-Origin-Opener-Policy: same-origin`. It explains what changed, how to upgrade an existing project, how to reproduce both the failure and the success, and how to verify the fix.

## Background

Trusted Agent login opens a popup to Account Manager and waits for it to redirect back with an OAuth `code` and `state`. When the storefront sends `Cross-Origin-Opener-Policy: same-origin`, the browser moves the popup into a new browsing context group and severs the popup reference. After that the opener can no longer read the popup location and `popup.closed` wrongly reports `true` while the agent is still signing in. The old code read that as the user closing the popup and rejected with "Popup closed without authenticating." before login could finish.

The fix delivers the result out of band. The same origin `/callback` page reads its own URL, which it can always read, and posts the `code` and `state` back to the opener with `postMessage`, plus a `BroadcastChannel` fallback. The hook listens for that message and no longer treats a severed `popup.closed` as cancellation. A genuinely abandoned popup is still handled by the existing timeout.

## What changed

Three pieces work together. A project that uses Trusted Agent needs all three.

1. `commerce-sdk-react` hook `useTrustedAgent`
   - Listens for the OAuth result via `postMessage` with a `BroadcastChannel` fallback.
   - No longer rejects when `popup.closed` is `true`, since a severed popup reports that falsely.
   - Exports the message contract as `TRUSTED_AGENT_POPUP_MESSAGE_TYPE` and `TRUSTED_AGENT_POPUP_CHANNEL`.

2. `/callback` page in the app (`app/pages/login-redirect/index.jsx`)
   - When `code` and `state` are both present in the URL, it posts them to the opener using the exported contract.
   - When they are absent it does nothing, so the standard SLAS redirect is unaffected.

3. Server request handling
   - `request-processor.js` keeps `code` on a `/callback` request when `state` is also present, instead of stripping it.
   - `ssr.js` `handleCallback` serves that variant with `Cache-Control: no-store`, and keeps the standard redirect long lived and cacheable.

## Upgrade steps for an existing project

If you generated your project before this fix, apply the matching changes to your own copies of these files.

1. Update `@salesforce/commerce-sdk-react` to the version that includes this fix.
2. In `app/pages/login-redirect/index.jsx`, add the callback delivery that reads `code` and `state` from the URL and posts them to the opener using `TRUSTED_AGENT_POPUP_MESSAGE_TYPE` and `TRUSTED_AGENT_POPUP_CHANNEL` from `@salesforce/commerce-sdk-react`.
3. In `app/request-processor.js`, keep `code` on `/callback` when `state` is present. Continue to strip `code` and `usid` when `state` is absent so the standard redirect stays cacheable.
4. In `app/ssr.js`, add or update `handleCallback` so the `code` plus `state` variant is served with `Cache-Control: no-store`, and register it with `app.get('/callback', handleCallback)`.

Reference implementations live in `template-retail-react-app` and in the generated templates under `pwa-kit-create-app`.

## Why the callback is not cached

The `/callback` URL for a Trusted Agent login carries a one time OAuth authorization code. A shared CDN cache must never store a response keyed to a URL that contains an auth code, so this variant is `no-store`. The standard SLAS redirect has no `code` or `state` left on it after request processing, its response is identical for every shopper, so it stays long lived and cacheable.

There is no risk of serving a stale response to the wrong flow. The two variants have different query strings after request processing, so they resolve to different cache keys. The Trusted Agent variant is never cached at all.

## Why `state` marks a Trusted Agent callback

In the SLAS flows shipped with the template, only the Trusted Agent authorize request sends a `state` parameter. The standard login redirect and the social login redirect land on `/callback` with `code` and `usid` but no `state`. So the presence of `state` is a reliable signal here.

If a project adds its own `state` to another authorize flow, the only effect is that the other flow would also keep `code` and be served `no-store`. That is safe. It just means that request is not cached. There is no correctness or security downside, only a missed caching optimization.

## Reproduce the failure

The bug only appears with the pre fix code plus the COOP header.

1. Check out the branch or release from before this fix.
2. Serve a Trusted Agent enabled storefront with the response header `Cross-Origin-Opener-Policy: same-origin`.
3. Start a Trusted Agent login with a shopper login id that is different from the Account Manager account you sign in with.
4. Complete sign in and any MFA in the popup.
5. Observe that the storefront shows "Popup closed without authenticating." even though the agent signed in, and the agent session never starts.

To confirm the header is the trigger, remove the COOP header and repeat. The old code works without the header, which is why the issue was easy to miss.

## Reproduce the success

Use the fixed code with the same COOP header.

1. Open a Trusted Agent enabled storefront that serves `Cross-Origin-Opener-Policy: same-origin`.
2. Repeat steps 3 and 4 above.
3. Confirm the popup closes on its own and the storefront finishes login with the active agent session, with no error.

## Verify thoroughly

Since customers may upgrade for this feature as soon as it ships, test across environments.

- Browsers: Chrome and Firefox at least.
- SLAS client types: public PKCE client and private client.
- Header on and off: confirm success with the COOP header present, and confirm nothing regressed with it absent.
- Popup abandonment: close the popup before signing in and confirm login still rejects. Leave the popup idle and confirm it rejects after the timeout.
- Standard login: confirm the normal SLAS login redirect and social login still work and are still cacheable.

## Notes

- The public API of `useTrustedAgent` is unchanged.
- The message is posted to the opener scoped to the storefront origin, so it is not exposed to any other document. The listener checks the message origin as well.
