# Configurable AI-assisted search (preview)

This optional Retail React App feature searches the current storefront with SCAPI, returns products first, then streams an AI overview. Shoppers can ask questions grounded in the returned catalog or continue in a configured Commerce Agent. The default is **off**. It has no built-in customer, organization, deployment, image CDN, or sibling widget checkout.

The implementation is shared across sites. Each customer's store configuration selects the experience; no customer-specific component fork is needed. Consumers of an existing generated PWA application must adopt these template changes before the flags are available.

## Public storefront configuration

Set global defaults under `app.searchSummary` in `config/default.js` (or your deployment config). `ENABLE_SEARCH_SUMMARY=true` is a convenience for enabling the global default. These are **booleans**, unlike the existing Commerce Agent settings, which use string booleans.

```js
searchSummary: {
    enabled: true,
    headerSearch: true,
    followUps: true,
    agentHandoff: false,
    title: 'Your AI shopping guide',
    searchPlaceholder: 'Search or ask AI…',
    homeHero: {
        enabled: false,
        eyebrow: 'AI-ASSISTED DISCOVERY',
        title: 'Find your next favorite.',
        description: 'Search products, compare options, and ask a follow-up.',
        imageUrl: '/static/img/your-hero.jpg',
        suggestedSearches: [{label: 'Explore a category', query: 'your catalog keyword'}]
    }
}
```

Override any field on entries in `app.sites` (normally `config/sites.js`). Nested `homeHero` fields inherit individually; arrays such as suggested searches replace the global array. Keep the site's existing locale/currency configuration.

```js
// Add to the existing site entries:
{ id: 'your-site-a', /* existing l10n, etc. */ searchSummary: {enabled: true, agentHandoff: true} },
{ id: 'your-site-b', /* existing l10n, etc. */ searchSummary: {enabled: false} }
```

| Setting | Default | Behavior |
| --- | --- | --- |
| `enabled` | `false` | Master switch for the site, checked by UI and server endpoints |
| `headerSearch` | `true` | Use the centered AI search box; `false` retains the standard search box |
| `followUps` | `true` | Show follow-up conversation/input; also gates the follow-up endpoint |
| `agentHandoff` | `false` | Allow context handoff; requires an enabled Commerce Client agent for that site |
| `homeHero.enabled` | `false` | Replace the standard homepage hero with the configurable discovery hero |

Disabling the master switch restores normal SCAPI search and the original header/homepage. When all sites are disabled, no assistant endpoints are registered and Gateway credentials are not required. With mixed enabled/disabled sites, disabled-site requests are rejected before search/model work. Category browsing always retains the standard SCAPI hooks.

Hero images must be a same-origin absolute path or an HTTPS URL without embedded credentials. Only configured enabled-site hero origins are added to image CSP. Copy, hero artwork, and suggested searches are public configuration; **never put Gateway keys, OAuth secrets, or SLAS client secrets here**. Gateway modules are imported by SSR only and are excluded from browser configuration.

## Server-only Gateway authentication

The mode is selected by `LLM_GATEWAY_AUTH_MODE=api_key|eca`. `api_key` remains the default and active development path. Authentication adapters live separately in `app/server/llm-gateway/auth/api-key.js` and `auth/eca.js`; routes and prompts use a common Gateway client.

### Current API-key path

Supply these through server environment variables or your secret manager:

```sh
LLM_GATEWAY_AUTH_MODE=api_key
LLM_GATEWAY_URL=https://your-authorized-gateway.salesforce.com
LLM_GATEWAY_API_KEY=<server-secret>
LLM_GATEWAY_SFDC_CORE_TENANT_ID=<authorized-tenant>
```

The URL must be your approved internal Gateway base URL. Requests use `Authorization: API_KEY …` and call `{LLM_GATEWAY_URL}/{LLM_GATEWAY_API_VERSION}/chat/generations[/stream]`. Optional variables are `LLM_GATEWAY_API_VERSION` (default `v1.0`), `LLM_GATEWAY_MODEL`, `LLM_GATEWAY_CLIENT_FEATURE`, and `LLM_GATEWAY_APP_CONTEXT` (default `EinsteinGPT`). Existing development model/feature defaults are preserved. An invalid API key is not retried. The internal Gateway can require corporate VPN/network access.

### Future ECA path

First configure an External Client App with client credentials, an authorized Run As user, `sfap_api` access, and JWT access tokens. Follow the [Salesforce Models API authentication guide](https://developer.salesforce.com/docs/ai/agentforce/guide/models-api-authentication.html). Confirm the org, model, feature permissions, and Gateway environment before rollout.

Provision these server settings without changing components, controllers, or prompts:

```sh
LLM_GATEWAY_ECA_TOKEN_URL=https://your-org.my.salesforce.com/services/oauth2/token
LLM_GATEWAY_ECA_CLIENT_ID=<client-id>
LLM_GATEWAY_ECA_CLIENT_SECRET=<server-secret>
LLM_GATEWAY_ECA_ORIGIN=https://api.salesforce.com
LLM_GATEWAY_ECA_MODEL=sfdc_ai__DefaultGPT4Omni
# Set this to your approved feature, if different from the connected-app default:
LLM_GATEWAY_ECA_CLIENT_FEATURE=ai-platform-models-connected-app
# Optional, only if required by your integration:
# LLM_GATEWAY_ECA_TENANT_ID=<authorized-tenant>
```

Once ECA is enabled and provisioned, switch **only** `LLM_GATEWAY_AUTH_MODE=eca` and restart/redeploy. Roll back by selecting `api_key` with its existing settings. The ECA profile deliberately does not inherit the internal API-key URL, tenant, model, or feature settings. ECA uses the public SFAP `/ai/gpt/v1/chat/generations[/stream]` routes and `generation_settings: {parameters: {}}` payload. Its allowed origins are `api`, `test.api`, `dev.api`, and `perf.api` on `salesforce.com`; token exchange uses the configured Salesforce My Domain HTTPS endpoint. Redirects are rejected.

The ECA adapter exchanges credentials server-side, caches until shortly before JWT expiry, and shares concurrent refreshes. A Gateway HTTP 401 invalidates only the failed token and retries once before streaming output. It never restarts a partial answer. This adapter is covered with mocked OAuth/Gateway responses; **live ECA enablement has not been tested in this draft**. ECA output-token parameter support must be confirmed with the Gateway contract; no unverified parameter is sent. Both modes retain stream deadlines and a 16,000-character client-side consumption cap (this does not substitute for an upstream billing/token limit).

## Commerce Agent and embedded PDP configuration

Configure your existing public `app.commerceAgent` settings or a per-site `commerceAgent` override. Enable handoff only after the site's deployment is working:

```js
commerceAgent: {
    enabled: 'true',
    provider: 'commerce-client',
    scrt2Url: 'https://your-org.salesforce-scrt.com',
    salesforceOrgId: '<your-org-id>',
    cc_esDeveloperName: '<your-embedded-service-deployment>',
    commerceClientScriptSourceUrl: 'https://your-approved-cdn/commerce-client.umd.js',
    cc_enablePageContext: 'true'
}
```

The existing `app.embeddedAgent` configuration controls PDP questions independently:

```js
embeddedAgent: {
    enabled: true,
    scrt2Url: 'https://your-org.salesforce-scrt.com',
    orgId: '<your-org-id>',
    esDeveloperName: '<your-embedded-service-deployment>',
    persistSession: true,
    enableLogging: false
}
```

Use compatible published Commerce Client and embedded-widget bundles. The agent bundle must support `enablePageContext`, `initialPageContext`, `setPageContext`, and queued `sendMessage`. Continue to use the widget's existing script-host allowlist/CSP controls; self-hosted assets need an explicitly approved CSP configuration. No local sibling repository or widget build is required. The existing embedded-agent component and bundled widget provide PDP questions; this feature does not add a second PDP widget.

On full-agent handoff the current search and filters use the typed SRP context API. The server-sourced overview/follow-up history accompanies the queued message, while the visible shopper bubble contains the query. Only supported SRP/PDP fields are used in page context. The widget queues the query until connected; reopening an unchanged handoff does not send it twice. Overview and Commerce Agent retain their own service sessions, connected by this explicit context transfer.

## Local development

Use the storefront's existing SCAPI organization, site, locales, currency, and shopper login configuration. Start normally with `ENABLE_SEARCH_SUMMARY=true` and the Gateway server variables, or use the convenience launcher:

```sh
LLM_GATEWAY_ENV_FILE=/absolute/path/to/server-only.env \
npm run start:search-summary
```

The launcher reads only allowlisted Gateway variables from that optional file; explicit process variables take precedence. It also reads the app's existing local `.env`. An optional `PWA_STORE_ENV_FILE` supplies only `PWA_KIT_SLAS_CLIENT_SECRET`; an optional `PWA_STORE_CONFIG_FILE` points to a trusted, **public**, local CommonJS profile of the form `{app: {...}, proxyConfigs: [...]}`. The latter is used only outside production and is never required for another storefront. Local profiles/credentials are not included in this change.

`app.commerceAPI.useSLASPrivateClient: true` enables both client and server private-client proxy behavior. Provide `PWA_KIT_SLAS_CLIENT_SECRET` only on the server. Public-client stores retain their existing login behavior.

The launcher defaults to port 3001 and enables system CA trust on supported Node versions. Set `LISTEN_ADDRESS`/`EXTERNAL_DOMAIN_NAME` to override the port, and use a Node version supported by the repo. Never disable TLS verification for a corporate proxy.

## API and conversation behavior

- `POST /api/search-with-summary`: `{parameters: {q, siteId, locale, currency, ...SCAPI search parameters}, sessionId?}` plus the current shopper bearer token. Fixed-origin SCAPI validates the shopper before any model request. SSE emits `products`, `content_delta`, and `completed`, or a generic `error`. Results remain available if only the model fails.
- `POST /api/search-assistant/follow-up`: `{contextId, message}` plus the same shopper token. Loads at most 100 filtered matches, hydrates descriptions/specifications in bounded batches, then routes to a grounded streamed answer or a `search {query}` action. Only validated catalog product IDs can become picks. Missing material/care facts remain unknown.
- `POST /api/search-assistant/handoff`: `{contextId}` plus the same shopper token. Returns canonical SRP context and bounded current-search history; rejects other shoppers and in-progress answers.

One opaque shopper session persists across searches. History is scoped by query, filters, site, locale, currency, and sort; pagination preserves the scope. Changing a search selects only that search's conversation for UI, model, suggestions, and handoff. Follow-up chips derive from real result facets, product names, and prices. The initial overview is shown once, separately from follow-up turns. Prompt text lives in `app/server/search-assistant/prompts.js`.

Tokens, keys, prompts, and model text must never appear in diagnostics. Server errors expose fixed messages/statuses, not upstream response bodies. SessionStorage holds only an opaque conversation ID; raw shopper tokens are hashed for ownership checks and are not retained in the store.

## Preview rollout limits

Conversation and result storage is **process-local**: 60 entries, up to eight turns per session, ten-minute/token-bound expiry, and three concurrent paid operations per process. A restart, different instance, or shopper-token refresh can invalidate a context. This is appropriate for the current exercise; **before enabling on a scaled MRT deployment, replace the store with shared TTL storage, add distributed quotas/budgets and abuse controls, and verify that the deployment streams without buffering**. The flags alone do not make the preview production-ready.

These preview endpoints currently require bearer-token shopper mode; HttpOnly-cookie storefronts need a cookie-aware authentication adapter before enabling them.

Test each customer's SCAPI and Commerce Agent deployment, live ECA permissions/output limits when enabled, translations, accessibility, and inline-widget cold-start behavior before rollout. A first inline-agent message can be delayed by session initialization. No new runtime dependencies are required.

## Verification

Focused suites cover feature-off compatibility, per-site configuration, product-first streaming, auth/grounding failures, search-scoped history, result-based suggestions, agent context/duplicate-send handling, shared script loading, and ECA exchange/cache/401 behavior. Run from the app directory:

```sh
node ../pwa-kit-dev/node_modules/jest/bin/jest.js \
  app/server app/utils/search-summary-config.test.js \
  app/utils/search-agent-handoff.test.js app/utils/sse.test.js \
  app/hooks/use-search-with-summary.test.js \
  app/pages/product-list/partials/search-summary.test.jsx \
  --runInBand --coverage=false
```
