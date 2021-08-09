# The Server-Side Rendered Lifecycle
The stages of the server-side rendered (SSR) lifecycle are explained below in detail.

## Server-side
A GET request will be sent to the SSR server from a device. When the SSR server is running in remote mode, it will not receive the actual user-agent from the device. Instead, it's aware of the device *class*: one of _mobile_, _tablet_ or _desktop_.

When that GET request is received by the SSR server, it's first passed to the [`requestHook`](../ssr-server#requestHook) method, which can handle simple responses for files like `/robots.txt`. This does not involve the SSR PWA code.

If the `requestHook` doesn't handle the request, and it matches one of the SSR PWA routes, then the SSR server will:
1. Create a browser-like environment for the SSR PWA
2. Set the `window.location` for that environment to match the request's URL
3. Configure the environment so that the [`getBrowserSize` function](../../../utility-functions/reference/global.html#getBrowserSize) will return the correct value depending on the *class* of the device that made the request
4. Load and run the SSR PWA code in that environment

The SSR PWA can then fetch any data and render whatever React components are necessary for the page. Once rendering is done, the SSR PWA must call the
[`ssrRenderingComplete`](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/global.html#ssrRenderingComplete)
function (in the `universal-utils` module of the SDK), passing the contents of the Redux store. Your implementation can optionally set the status code for the HTTP response, and set headers, by passing them to `ssrRenderingComplete`. 
2. By dispatching the thunk [`ssrRenderingCompleteThunk`](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/global.html#ssrRenderingCompleteThunk)
(also in the `universal-utils` module of the SDK). HTTP response status code and headers can also be set by passing them to `ssrRenderingCompleteThunk`.

If rendering fails, then the SSR PWA may call [`ssrRenderingFailed`](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/global.html#ssrRenderingFailed) instead of `ssrRenderingComplete`, passing an error object. The SSR server will generate an error page. 

Assuming that rendering did not fail, the SSR server will create an HTML response that contains the following:

1. HTML elements copied from the `<head>` of the rendered document. This allows server-side rendered PWA code to use tools such as `react-helmet` to add elements such as `<link>` to the document, which will appear in the response. These elements will be present in the HTML response and will take effect when the browser loads that response.
   
2. A `<script>` element to set up the [`window.Progressive` object](#WindowProgressive)(which communicates information from the server to the SSR loading process) and the SDK code when it runs client-side.
   
3. If the SSR server was [configured](../ssr-server#SSRServerClass) with `optimizeCSS: true`, the minimal set of inline styles required to render the HTML. If `optimizeCSS` is not `true`, a `<link>` in the head of the document that will prioritize loading of the stylesheet.

4. An embedded JSON string of the Redux store state that will be used to configure the PWA when it starts running client-side (stored in `window.__PRELOADED_STATE__`).
   
5. The React-rendered HTML.

6. A `<script>` element that will kickstart the server-side rendered PWA loading process when the page is received by the browser.
   
The response is then sent to the browser, and server-side rendering is complete.
