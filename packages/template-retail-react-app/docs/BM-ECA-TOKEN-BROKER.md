# ECOM bridge for Business Manager ECA credentials

**Required companion platform work: this endpoint and scope are proposed contracts, not shipped SCAPI capabilities. This PWA PR implements the consumer only. Deploy the ECOM bridge before selecting `LLM_GATEWAY_AUTH_MODE=eca`.**

## Credential ownership

Business Manager's **Administration → Global Preferences → Agentforce → Setup** stores the instance's Client ID, Client Secret, and My Domain URL. ECOM manages this as an internal Agentforce connection. That connection is instance-wide and shared with the Merchant Agent; it is not a per-site preference.

The internal credential cannot be read by the cartridge Script API. Do not expose it through Shopper Configurations, Custom Preferences, a browser route, or a credential-export API. This needs a native ECOM endpoint with access to the existing Salesforce OAuth token provider. It cannot be implemented solely by adding a PWA cartridge.

## Proposed endpoint

```text
POST https://<short-code>.api.commercecloud.salesforce.com/merchant/llm-auth/v1/organizations/<organization-id>/access-tokens
Authorization: Bearer <Account Manager service token>
Accept: application/json
Cache-Control: no-store
```

The request has no body. The client cannot select a credential ID, Salesforce org, token URL, grant type, or scopes for the underlying ECA. ECOM resolves the instance's BM connection itself. No shopper token, prompt, or product data is sent on this path.

The registered Admin API must enforce all of these before minting:

- Authenticate a dedicated **Account Manager machine client** (client-credentials grant). Reject BM user tokens and SLAS shopper tokens.
- Authorize the instance-specific `SALESFORCE_COMMERCE_API:<realm>_<instance>` tenant role and a dedicated broker scope. `sfcc.llm-auth` is the **proposed new scope** used by this consumer; it must be registered with the companion API. It is not in the currently shipped scope catalog.
- Bind the requested organization to that tenant and an explicit permitted machine-client policy. Do not infer authorization merely from a valid AM JWT or an organization ID in the URL.
- Apply broker rate limits and audit only caller identity, tenant, status, and timing. Disable HTTP wire logging and token/body logging.

The PWA authenticates at the fixed Account Manager token URL with HTTP Basic client ID/secret and form fields `grant_type=client_credentials` and the two scopes above. Its AM client secret authorizes this restricted server-to-server operation; **it is not the ECA consumer secret**. Keep it in server environment/secret storage. See [SCAPI Admin authentication](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-admin-apis.html).

## ECOM implementation requirements

Use the native Agentforce configuration and Salesforce token-provider services already used by ECOM, rather than reading or returning raw credential fields. At each authorized broker request:

1. Resolve the existing instance-level Agentforce ECA connection. If absent or incomplete, return a fixed `503 bm_eca_not_configured` response.
2. Mint a **fresh** client-credentials access token using that connection's My Domain, client ID, and secret. The native provider's uncached OAuth method can be reused. A new broker request must not return an old server-cached token rejected by the Gateway; PWA already caches successful JWTs.
3. Confirm that the returned token is a JWT with a future integer `exp` and at most a 30-minute lifetime (PWA permits 30 seconds of clock skew), and that the authorized ECA has Models API access (`api` and `sfap_api`, the configured Run As user, and JWT issuance enabled). Reject legacy opaque session tokens. Follow [Models API authentication](https://developer.salesforce.com/docs/ai/agentforce/guide/models-api-authentication.html).
4. Return only the short-lived access token and its type. Include a routing tenant only when required and derived from the same authorized token/connection. Never return consumer credentials, refresh tokens, assertions, or arbitrary upstream response bodies.

```json
{
  "access_token": "<short-lived JWT>",
  "token_type": "Bearer"
}
```

Optional field: `core_tenant_id`, a `core/<instance>/<18-character-org-id>` tenant key. When the JWT header includes `tnk`, it must agree with this field. PWA preserves the JWT header's exact casing and ignores any unrelated development tenant environment setting. Other response fields are rejected.

Send `Content-Type: application/json` and `Cache-Control: no-store, private`; ensure CDN/server caches do not retain successful or failed token responses. Do not set browser CORS permissions for this endpoint. Return fixed errors with appropriate status codes: `401` invalid/expired machine token, `403` unauthorized client/scope/tenant, `422` ECA configuration cannot issue the required JWT, `429` rate limit, `502` Core exchange failure, or `503` BM connection unavailable.

## PWA behavior and release gate

The `auth/bm-eca.js` adapter performs AM authentication and the broker call server-side. It requires only the broker URL and the AM machine-client credentials. It shares concurrent refreshes, caches by JWT expiry, and bounds both network exchanges. A broker `401` refreshes the AM service token once; a Gateway `401` discards only the JWT that failed and obtains a fresh one before any streamed output. No request falls back to another identity or auth mode.

This keeps the data path **PWA server → LLM Gateway → SSE to shopper**. ECOM is used only for authentication, so the bridge does not need to proxy SSE. `/anc/access_tokens` is a user/C2C flow and `/llm_prompt/generations` is a BM asynchronous/polling API; neither implements this contract.

Before enabling BM-backed ECA, require a companion ECOM deployment, registered broker scope/client policy, live tenant-isolation tests, and a live Gateway generation from the intended BM connection. This draft's provider tests use mocked AM/broker/Gateway responses. They do not establish that the bridge exists on a sandbox or production instance.
