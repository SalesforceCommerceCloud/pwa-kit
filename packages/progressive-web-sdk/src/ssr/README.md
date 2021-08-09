# Documentation for the SSR Server

The main reference docs are generated from the code (JSDoc) and available
on docs.mobify.com. The latest published docs for the server should be
[here](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html).

## Metrics
The following custom Cloudwatch metrics are emitted by the SSR Server
when running remote (or running locally with `SEND_CW_METRICS` defined).
The dimensions for all metrics are the `Project` (taken from the
`MOBIFY_PROPERTY_ID` environment variable) and `Target` (taken from the
`DEPLOY_TARGET` environment variable):
* `RequestHook` - Count of requests that were handled by the `requestHook`
* `RequestHookError` - Count of errors thrown by the `requestHook`
* `RequestTime` - Duration (in mS) of any request (whether handled by the
`requestHook` or SSR)
* `RequestSuccess` - Count of *all* successful requests (any non-4xx, non-5xx status)
* `RequestFailed400` - Count of 4xx responses (excluding 404)
* `RequestFailed404` - Count of 404 responses (not included in RequestFailed400)
* `RequestFailed500` - Count of 5xx responses
* `RenderTime` - Duration (in mS) of page rendering
* `RenderErrors` - Count of page render errors (where the PWA rendering fails and an error page is returned)
* `HeapUsed` - Amount of heap used, in bytes, for rendering
* `ExternalRequests` - Count of external requests (fetches or XMLHttpRequests) made by the PWA during rendering
* `ExternalRequestFailed` - Count of external requests that failed
* `ExternalRequestTime` - Duration (in mS) of any external request

