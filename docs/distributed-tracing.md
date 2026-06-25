# Distributed Tracing — Architecture & Operations

## Overview

Distributed tracing (DT) produces
[W3C Trace Context](https://www.w3.org/TR/trace-context/) spans for the PWA Kit
server-side rendering (SSR) render path. It is **extract-only**: PWA Kit reads
the incoming `traceparent` (minted upstream by the enhanced CDN (eCDN) and
Managed Runtime (MRT)), creates an `ssr.render` server span parented on it, adds
internal child spans for the render phases, and forwards the `traceparent` to
outbound Shopper Commerce API (SCAPI) and Shopper Login & API Access Service
(SLAS) calls made during SSR. Spans are printed to stdout, which MRT scrapes and
forwards to the trace backend (Jaeger).

Key properties:

- **SSR-only.** Only SCAPI calls made during the initial server render are
  traced. Browser (post-hydration) calls carry no `traceparent` — by design,
  the client bundle ships no OpenTelemetry ("OTel"). Same scope as
  `server_timing`.
- **Coexists with `server_timing`.** DT never registers a global provider or a
  global propagator, so it does not disturb the existing `server_timing`
  instrumentation (which uses a global B3 propagator). See
  [Coexistence](#coexistence-with-server_timing).
- **Fail-safe.** Every DT entry point is wrapped so a tracing failure can never
  break request handling. Disabled → all functions are no-ops.

## How to enable

DT is gated on the shared OpenTelemetry master switch — there is **no separate
DT env var**.

| Env var | Effect |
|---------|--------|
| `OTEL_TRACING_ENABLED=true` | Enables DT (and `server_timing`'s OTel path). Resolved via `getOTELConfig().enabled`. |
| `OTEL_SERVICE_NAME` | Affects `server_timing` only. DT's `service.name` is a hardcoded constant (`pwa-kit-react-sdk`) and ignores this var. |

When `OTEL_TRACING_ENABLED` is unset (or anything other than `"true"`), DT is a
complete no-op: no spans, no header injection, zero behavior change.

Set the env var via MRT environment configuration. No code change or redeploy of
application code is required to toggle it.

## What is traced

### Spans

| Span | Kind | Created in | Notes |
|------|------|-----------|-------|
| `ssr.render <METHOD>` | internal | `withServerSpan` (`react-rendering.js`) | Root span for the render; parented on the incoming `traceparent`. The code passes no `SpanKind`, so OTel defaults it to `internal`. The concrete path is in `url.path`, not the span name. |
| `route-match` | internal | `withChildSpan` | Route matching. |
| `getProps` | internal | `withChildSpan` | App-state fetch (`initAppState`). |
| `scapi:<queryName>` | internal | `withChildSpan` via `with-react-query` | One per react-query `useQuery` fetched during SSR, nested under `getProps`. Name uses the query's `meta.displayName` (e.g. `scapi:useProductSearch`) or its index. |
| `render-to-string` | internal | `withChildSpan` | React render. |

**Extract-only / no fresh roots:** if a request arrives without a valid incoming
`traceparent`, `withServerSpan` just runs the render with no DT span — it never
mints a synthetic root. In production MRT sends a `traceparent` on every request,
so the unparented path is dev / direct-hit only.

### Attributes (high-level design (HLD) set)

| Group | Attribute | Source |
|-------|-----------|--------|
| Resource | `service.name` | constant `pwa-kit-react-sdk` |
| Resource | `service.namespace` | `process.env.MOBIFY_PROPERTY_ID` |
| Resource | `service.version` | `process.env.BUNDLE_ID` (deploy id; numeric, not semver — MRT exposes no semver var) |
| Resource | `service.instance.id` | `process.env.AWS_LAMBDA_FUNCTION_NAME` |
| Resource | `deployment.environment` | `process.env.DEPLOY_TARGET` |
| HTTP | `http.request.method` | `req.method` |
| HTTP | `http.route` | matched route template, e.g. `/category/:categoryId` (never the concrete URL) |
| HTTP | `http.response.status_code` | `res.statusCode`, set on response `finish` |
| HTTP | `url.path` | request path **only** — query string is stripped |
| HTTP | `server.address` | `Host` request header |
| Custom | `site_name` | `res.locals.site.id` |
| Custom | `client_id` | `res.locals.clientId` |
| Custom | `realm` | `res.locals.realm` |
| Custom | `instance_type` | `res.locals.instanceType` |

**PII guard:** DT records `url.path` only and **never** `url.full`, so
query-string tokens / PII never enter a span. `http.route` is the route template,
not the concrete path, so path parameters don't leak either.

> **MRT ingest normalizes spans — what PWA Kit emits is not what lands in
> Jaeger.** On the MRT ingest path, span names get an `mrt.` prefix,
> `service.name` is overwritten to `mrt-customer-data-plane`, and the custom
> attributes (`site_name`, `client_id`, `realm`, `instance_type`) are dropped to
> MRT's fixed attribute set. The span and attribute tables above describe the
> shape PWA Kit **emits**; do not expect to search Jaeger for `ssr.render`,
> `service.name=pwa-kit-react-sdk`, or `site_name` and find them verbatim.
> Closing this gap is an observability follow-up.

## How it's wired

### File layout

```
packages/pwa-kit-react-sdk/src/
  ssr/server/
    distributed-tracing.js              ← core OTel module (provider, propagator, span helpers)
    mrt-console-span-exporter.js        ← stdout exporter (MRT scrape contract)
    react-rendering.js                  ← wires server + child spans into the render path
  utils/
    opentelemetry-config.js             ← getOTELConfig(): the OTEL_TRACING_ENABLED master switch
  ssr/universal/components/with-react-query/
    index.js                            ← creates per-query scapi:* child spans (OTel-free; uses res.locals helper)

packages/template-retail-react-app/app/components/_app-config/
    index.jsx                           ← forwards res.locals.traceparent on the CommerceApiProvider headers prop
```

### Core module — `distributed-tracing.js`

Self-contained OpenTelemetry setup:

- **Provider:** `NodeTracerProvider` + `SimpleSpanProcessor(MrtConsoleSpanExporter)`.
  Tracer obtained via `provider.getTracer()` — **non-global**, never
  `provider.register()`.
- **Propagator:** a module-level `W3CTraceContextPropagator` **instance**. Never
  `propagation.setGlobalPropagator()`.
- **Context manager:** a global `AsyncHooksContextManager` installed once, lazily,
  on first tracer use (so spans propagate across `await` boundaries). This is the
  same context-manager type `server_timing` installs via `register()`, so
  first-writer-wins is safe.

Exports:

| Function | Purpose |
|----------|---------|
| `isDistributedTracingEnabled()` | delegates to `getOTELConfig().enabled` |
| `extractContext(headers)` | extract incoming W3C context; falls back to `context.active()` on failure |
| `withServerSpan(req, res, parentCtx, fn)` | run `fn` inside the `ssr.render` span (or plainly if unparented/disabled) |
| `withChildSpan(name, fn)` | run `fn` inside a named internal child span |
| `setActiveSpanAttribute(key, value)` | set an attribute on the active span (e.g. `http.route`, known mid-render) |
| `getCurrentTraceparent()` | the active span's `traceparent` string, or `null` |

### Render-path wiring — `react-rendering.js`

`render()` checks `isDistributedTracingEnabled()`. When on, it:

1. `extractContext(req.headers)` → parent context from the incoming `traceparent`.
2. Sets `res.locals.__withChildSpan = withChildSpan` so the **universal**
   `with-react-query` layer can create `scapi:*` spans without importing the
   server-only OTel code.
3. Wraps the render in `withServerSpan(...)`.

Inside the render, child spans wrap `route-match`, `getProps`, and
`render-to-string`; `setActiveSpanAttribute('http.route', route.path)` is called
after route matching.

This is **independent of the `?__server_timing` switch** — DT runs whenever the
flag is on, regardless of `server_timing`.

### Outbound propagation (SSR → SCAPI)

Connectivity is guaranteed by forwarding the trace id as a header; **per-hop span
nesting was deliberately dropped** as not worth the complexity (richer SSR
visibility is provided instead by the `scapi:*` child spans above).

1. Inside the active `ssr.render` span, `withServerSpan` writes the span's
   `traceparent` string to `res.locals.traceparent` (and sets a `traceparent`
   response header).
2. The template's `_app-config/index.jsx` forwards `res.locals.traceparent` on the
   `CommerceApiProvider` `headers` prop — the same mechanism as `correlation-id`,
   `sfdc_user_agent`, `x-site-id`.
3. `commerce-sdk-react` forwards the header string verbatim. **It imports no
   `@opentelemetry/api`** — OTel never ships to the browser bundle.

Because the provider is constructed inside the active span during SSR, outbound
SCAPI calls carry the request's trace id (same trace, connected).

### Exporter — `mrt-console-span-exporter.js`

Extends `ConsoleSpanExporter`. For each span it prints a JSON line to stdout via
`console.info`. MRT scrapes stdout and forwards to Jaeger — **no OpenTelemetry
Protocol (OTLP) endpoint / collector is involved**. Resource attributes (e.g. `service.name`) are merged into
the emitted span's `attributes` because MRT/Jaeger keys on `service.name` there.
A malformed span is skipped rather than allowed to throw.

## Coexistence with `server_timing`

DT and the older `server_timing` instrumentation run side by side without
collision:

| | `server_timing` (existing) | Distributed tracing |
|---|---|---|
| Propagator | `setGlobalPropagator(B3Propagator)` — **global** | `new W3CTraceContextPropagator()` — **instance**, never global |
| Provider | `provider.register()` — **global** | `provider.getTracer()` — **non-global** |
| Shared global | — | only `AsyncHooksContextManager` (same type, first-writer-wins → safe) |
| Flag | `otelConfig.enabled && shouldTrackPerformance` | `otelConfig.enabled` |

Because DT never touches the global propagator, the B3 ↔ W3C state of
`server_timing`'s global is irrelevant to DT.

## Error handling

- Every DT entry point is wrapped in try/catch — **tracing never breaks request
  handling.**
- Extraction failure → fall back to `context.active()`.
- A render error inside a span → span status set to `ERROR`, then the error is
  rethrown (request error behavior unchanged).
- Span lifecycle is guarded so a span ends exactly once on response finish.
- Disabled → every function is a no-op; `getCurrentTraceparent()` returns `null`,
  so the forwarded header resolves to nothing and no `traceparent` header is
  emitted.

## Limitations & non-goals

- **No client-side tracing.** Post-hydration SCAPI calls (single-page app (SPA)
  navigation, user
  actions, react-query refetches) carry no `traceparent`. Tracked separately.
- **No sampling.** MRT owns the sample decision; PWA Kit inherits the incoming
  trace flag as-is. A client-injected `traceparent` does not get PWA Kit to
  sample.
- **No fresh-root minting / no synthetic traceparents** — extract-only.
- **No OTLP exporter / collector** — stdout-scrape only.
- **`service.version` is the deploy `BUNDLE_ID`**, not a semver. MRT exposes no
  semver var; real version injection would be a follow-up.
