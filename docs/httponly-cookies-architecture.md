# HttpOnly Session Cookies — Architecture

## Overview

When you turn on `enableHttpOnlySessionCookies`, SLAS access and refresh tokens are stored as HttpOnly cookies to improve security. The server-side SLAS proxy layer handles token injection transparently.

### Private vs Public Client

PWA Kit supports HttpOnly session cookies with **two** SLAS client modes:

| Mode | Proxy Path | Client Secret Required | Config |
|------|-----------|----------------------|--------|
| **Private Client** | `/mobify/slas/private` | Yes (`PWA_KIT_SLAS_CLIENT_SECRET` env var) | `useSLASPrivateClient: true` |
| **Public Client** | `/mobify/slas/public` | No | `useSLASPrivateClient: false` (default) + `enableHttpOnlySessionCookies: true` |

#### How the proxy is selected

```
enableHttpOnlySessionCookies=true?
  ├── useSLASPrivateClient=true  → /mobify/slas/private (injects client_secret)
  └── useSLASPrivateClient=false → /mobify/slas/public  (no client_secret)

enableHttpOnlySessionCookies=false?
  └── Standard proxy (/mobify/proxy/...) — no HttpOnly cookies
```

## Request Flow Diagrams

### 1. Token Acquisition (Login / Guest Token)

SLAS proxy requests (`/mobify/slas/private` or `/mobify/slas/public`) are handled directly by the
Express app (not routed through CloudFront). The flows are identical—the only difference is that
the **private** proxy injects `Authorization: Basic` credentials, while the **public** proxy doesn't.

> **Note:** For public clients, the SDK invokes `/authorize` (PKCE) before `/token` to obtain an
> authorization code. There is no change in how `/authorize` is invoked. The diagram below shows
> only the `/token` call, which is where HttpOnly cookie processing occurs.

```
Browser                       Express App (SLAS Proxy)                    SLAS
  │                                     │                                  │
  │  POST /mobify/slas/{private|public}/.../token                          │
  │  Headers: x-site-id: RefArch        │                                  │
  │ ───────────────────────────────────►│                                  │
  │                                     │  POST /oauth2/token              │
  │                                     │  Basic Auth (private only)       │
  │                                     │ ───────────────────────────────► │
  │                                     │◄───────────────────────────────  │
  │                                     │                                  │
  │                                     │  Process token response:         │
  │                                     │  1. Read x-site-id → "RefArch"   │
  │                                     │  2. Decode JWT (access_token)    │
  │                                     │  3. Set HttpOnly cookies:        │
  │                                     │     - cc-at_RefArch              │
  │                                     │     - cc-nx-g_RefArch            │
  │                                     │     - cc-at-expires_RefArch      │
  │                                     │     - cc-at-dnt_RefArch          │
  │                                     │     - uido_RefArch               │
  │                                     │  4. Strip tokens from body       │
  │                                     │                                  │
  │◄─────────────────────────────────── │                                  │
  │  Body: { expires_in, customer_id }  │                                  │
  │  Set-Cookie: cc-at_RefArch=<token>; HttpOnly; Secure                   │
  │  Set-Cookie: cc-nx-g_RefArch=<token>; HttpOnly; Secure                 │
  │  Set-Cookie: cc-at-expires_RefArch=<exp>; Secure                       │
```

### 2. SCAPI Shopper API Calls (e.g., Product Search)

#### Local Development (SCAPI Proxy in Express App)

Locally, `/mobify/proxy` requests are handled by the Express app's proxy middleware.

```
Browser                  Express Dev Server (SCAPI Proxy)               SCAPI
  │                              │                                        │
  │  GET /mobify/proxy/api/search/...                                     │
  │  Headers: x-site-id: RefArch │                                        │
  │  Cookies: cc-at_RefArch=<tkn>│                                        │
  │           dwsid=<session-id> │                                        │
  │ ────────────────────────────►│                                        │
  │                              │                                        │
  │                              │  Inject auth headers from cookies:     │
  │                              │  1. Read x-site-id → "RefArch"         │
  │                              │  2. cc-at_RefArch → Authorization      │
  │                              │  3. dwsid → sfdc_dwsid header          │
  │                              │                                        │
  │                              │  Strip session cookies:                │
  │                              │  Remove cc-at_RefArch, cc-nx-g_RefArch │
  │                              │  cc-nx_RefArch, dwsid from cookies     │
  │                              │  Strip x-site-id header                │
  │                              │                                        │
  │                              │  GET /search/...                       │
  │                              │  Authorization: Bearer <tkn>           │
  │                              │  sfdc_dwsid: <session-id>              │
  │                              │  (no session cookies forwarded)        │
  │                              │ ──────────────────────────────────────►│
  │                              │◄────────────────────────────────────── │
  │◄──────────────────────────── │                                        │
  │  Response: { hits: [...] }   │                                        │
```

#### Production (MRT - CloudFront Edge)

On MRT, `/mobify/proxy` requests are proxied at the CloudFront edge. The Lambda@Edge
origin-request handler injects Authorization and sfdc_dwsid headers from HttpOnly cookies,
then strips session cookies before forwarding to SCAPI.

```
Browser                  MRT - CloudFront Edge                          SCAPI
  │                              │                                        │
  │  GET /mobify/proxy/api/search/...                                     │
  │  Headers: x-site-id: RefArch │                                        │
  │  Cookies: cc-at_RefArch=<tkn>│                                        │
  │           dwsid=<session-id> │                                        │
  │ ────────────────────────────►│                                        │
  │                              │                                        │
  │                              │  Inject auth headers from cookies:     │
  │                              │  1. Read x-site-id → "RefArch"         │
  │                              │  2. cc-at_RefArch → Authorization      │
  │                              │  3. dwsid → sfdc_dwsid header          │
  │                              │                                        │
  │                              │  Strip session cookies:                │
  │                              │  Remove cc-at_RefArch, cc-nx-g_RefArch │
  │                              │  cc-nx_RefArch, dwsid from cookies     │
  │                              │  Strip x-site-id header                │
  │                              │                                        │
  │                              │  GET /search/...                       │
  │                              │  Authorization: Bearer <tkn>           │
  │                              │  sfdc_dwsid: <session-id>              │
  │                              │  (no session cookies forwarded)        │
  │                              │ ──────────────────────────────────────►│
  │                              │◄────────────────────────────────────── │
  │◄──────────────────────────── │                                        │
  │  Response: { hits: [...] }   │                                        │
```

### 3. Refresh Token Flow (Access Token Expired)

When the access token expires, the client detects this via the `cc-at-expires` cookie and initiates
a refresh. Since the refresh token is in an HttpOnly cookie, the client sends an empty `refresh_token`
in the body. The proxy injects the actual refresh token via the `sfdc_refresh_token` header, which
SLAS accepts as a fallback. This flow is the same for both private and public clients.

```
Browser                       Express App (SLAS Proxy)                    SLAS
  │                                     │                                  │
  │  POST /mobify/slas/{private|public}/.../token                          │
  │  Headers: x-site-id: RefArch        │                                  │
  │  Body: grant_type=refresh_token     │                                  │
  │        &refresh_token=              │                                  │
  │  Cookies:                           │                                  │
  │    cc-nx-g_RefArch=<refresh>        │                                  │
  │ ───────────────────────────────────►│                                  │
  │                                     │  Inject refresh token:           │
  │                                     │  1. Read x-site-id → "RefArch"   │
  │                                     │  2. Read cc-nx_RefArch or        │
  │                                     │     cc-nx-g_RefArch from cookies │
  │                                     │  3. Set sfdc_refresh_token hdr   │
  │                                     │                                  │
  │                                     │  Strip session cookies:          │
  │                                     │  Remove cc-at_RefArch,           │
  │                                     │  cc-nx-g_RefArch, cc-nx_RefArch, │
  │                                     │  dwsid from cookies              │
  │                                     │                                  │
  │                                     │  POST /oauth2/token              │
  │                                     │  Basic Auth (private only)       │
  │                                     │  sfdc_refresh_token: <refresh>   │
  │                                     │  Body: grant_type=refresh_token  │
  │                                     │  (no session cookies forwarded)  │
  │                                     │ ───────────────────────────────► │
  │                                     │◄───────────────────────────────  │
  │                                     │                                  │
  │                                     │  Process token response:         │
  │                                     │  (same as token acquisition)     │
  │                                     │                                  │
  │◄─────────────────────────────────── │                                  │
  │  Body: { expires_in, customer_id }  │                                  │
  │  Set-Cookie: cc-at_RefArch=<new_token>; HttpOnly; Secure               │
  │  Set-Cookie: cc-nx-g_RefArch=<new_refresh>; HttpOnly; Secure           │
```

### 4. Logout

Handled directly by the Express app (not CloudFront). Same flow for both client types.

```
Browser                       Express App (SLAS Proxy)                    SLAS
  │                                     │                                  │
  │  POST /mobify/slas/{private|public}/.../logout                         │
  │  Headers: x-site-id: RefArch        │                                  │
  │  Cookies:                           │                                  │
  │    cc-at_RefArch=<token>            │                                  │
  │    cc-nx_RefArch=<refresh>          │                                  │
  │ ───────────────────────────────────►│                                  │
  │                                     │  Inject tokens for logout:       │
  │                                     │  1. Read x-site-id → "RefArch"   │
  │                                     │  2. cc-at_RefArch → Bearer token │
  │                                     │  3. cc-nx_RefArch → refresh token│
  │                                     │  4. Set Authorization header     │
  │                                     │  5. Append refresh_token to URL  │
  │                                     │                                  │
  │                                     │  Strip session cookies:          │
  │                                     │  Remove cc-at_RefArch,           │
  │                                     │  cc-nx_RefArch, dwsid            │
  │                                     │  from cookies                    │
  │                                     │                                  │
  │                                     │  POST /oauth2/logout             │
  │                                     │  ?refresh_token=<refresh>        │
  │                                     │  Authorization: Bearer <token>   │
  │                                     │  (no session cookies forwarded)  │
  │                                     │ ───────────────────────────────► │
  │                                     │◄───────────────────────────────  │
  │◄─────────────────────────────────── │                                  │
```

## Configuration

```
┌─────────────────────────────────────────────────────────────────┐
│  config/default.js                                              │
│  ssrParameters: { enableHttpOnlySessionCookies: true }          │
│                        │                                        │
│  pwa-kit-dev reads config, sets env var:                        │
│  MRT_ENABLE_HTTPONLY_SESSION_COOKIES=true                       │
│                        │                                        │
│  (MRT sets the same env var in production)                      │
└────────────────────────┼────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  _app-config/index.jsx                                          │
│                                                                 │
│  <CommerceApiProvider                                           │
│    headers={{ 'x-site-id': locals.site?.id }}                   │
│    enableHttpOnlySessionCookies={                               │
│      MRT_ENABLE_HTTPONLY_SESSION_COOKIES === 'true'             │
│    }                                                            │
│    privateClientProxyEndpoint={slasPrivateProxyPath}            │
│    publicClientProxyEndpoint={slasPublicProxyPath}              │
│  />                                                             │
└─────────────────────────────────────────────────────────────────┘
```
