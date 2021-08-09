<div class="c-callout">
  <p>
    <strong>Note:</strong> This article is for Mobify projects using the Application Delivery Network (ADN).
  </p>
</div>

## Proxies

**Proxies allow the app server and browsers to fetch data from your backends in a simple, performant and observable way.**

Imagine your Mobify app is hosted at `www.example.com`. You want to get data on a handbag 👜 from `api.example.com`. The API requires an API key, passed via the `Authorization` header. You use [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API) from [`isomorphic-unfetch`](https://github.com/developit/unfetch) to make your code work both in the App Server and browsers:

```javascript
import fetch from "isomorphic-unfetch"

fetch("https://api.example.com/product/handbag.json", {
  headers: { Authorization: "API-TOKEN" }
})
```

There are challenges with this approach:

* In a browser, this request is [cross-origin](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS). _You must configure `api.example.com` to respond with cross-origin resource sharing (CORS) headers to allow the browser to make the request._
* In a browser, this request is not a [simple request](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Simple_requests). It requires a [preflight request](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Preflighted_requests), which introduces an additional network roundtrip, hurting performance.
* `api.example.com` may not use a CDN. It may take a long time to connect to it and it may not cache responses, harming performance.
* You may not have access to logs of `api.example.com` so you may not be able understand how its performance impacts your Mobify app.

Proxies get around these challenges by routing requests for APIs through Mobify's CDN, which acts as an [HTTP proxy server](https://en.wikipedia.org/wiki/Proxy_server).

Using proxies, we can make `api.example.com` available at `www.example.com/mobify/proxy/api/`.

## Set the proxy settings

There are a few ways to set your proxy settings. It depends on whether you're doing local development or running off cloud targets. 

For **local development**:
- Set the proxies in the `package.json` file
- If you need to, you can override them with the environment variables (`SSR_PROXY1`, `SSR_PROXY2`, and so on)

For **cloud targets** (e.g. production, staging):
- Set the proxies using [Mobify API](../mobify-api/)
- If the above step is not done, the published bundle's proxy settings (in its `package.json`) will be used instead as the fallback

### Local development

For local development, one of the ways to set your proxy settings is within `package.json`. In the scaffold, you can find it at `packages/pwa/package.json`:

```json
{
    "name": "mobify-proxy-test",
    "mobify": {
        "ssrParameters": {
            "proxyConfigs": [{ "host": "api.example.com", "path": "api" }]
        }
    }
}
```

`mobify.ssrParameters.proxyConfigs` is an array of proxies. A proxy object's `host` sets the backend the request is proxied to. Its `path` sets how we refer to it in our app.

A proxy's `host`:

* Is a domain name, not an IP address.
* Should not include a protocol.
* Must only consist of `a-z`, `A-Z`, `.`, `-`, and `_`.
* Should not exceed 128 characters.

> By default, a proxy connects to its backend over HTTPS. You can change this using the `protocol` key.

> If you configured your proxy settings incorrectly, expect to see an error message with the `ProxyConfigs` keyword.

> Proxies work both in local development and when deployed to a target. In local development, `proxyConfigs` is used to set up the [`SSRServer`](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html). This is managed by default in the scaffold. `proxyConfigs` is stored as part of a bundle.

Now, we can use our proxy by requesting data from it:

```javascript
import fetch from 'isomorphic-unfetch'

fetch("/mobify/proxy/api/product/handbag.json", {
  headers: { Authorization: "API-TOKEN" }
})
```

We use the proxy by making a relative request to `/mobify/proxy/$PROXYPATH/`.

#### Environment variables

When you're doing local development, to easily switch the proxy for different environments, you can use these environment variables to override the proxy settings: `SSR_PROXY1` for the first proxy, `SSR_PROXY2` for the second one, and so on. With those variables, you could create npm scripts to start the local server under different environments.

For example, the environment variable `SSR_PROXY1=https://api-staging.example.com/api` will be parsed into:

```json
{
    "protocol": "https",
    "host": "api-staging.example.com",
    "path": "api"
}
```


### Cloud targets (e.g. production, staging)

For cloud targets, we recommend that you set the proxy settings in the Cloud via [Mobify API](../mobify-api/). You'd want the Cloud (and not the bundle) to be the source of truth. 

For example, imagine you have two targets:

* `production`, which proxies requests to `api.example.com`.
* `staging`, which proxies requests to `api-staging.example.com`.

As the value for `proxyConfigs` is part of the bundle, you'd need to be careful assessing which bundle you deployed to each target. That way, you wouldn't accidentally point `production` at `api-staging.example.com`!

Instead, we can configure a target to override a bundle's `proxyConfigs` using the [Mobify API](../mobify-api/).

For example, in this scenario, we should use the API to set `production`'s `proxyConfig` to always reference `api.example.com` (ignoring the values set in `package.json`).

> **Once set, never change the existing proxy settings for a target that is serving production traffic.** Contact the [Mobify Support Team](https://support.mobify.com/support/tickets/new) if you would like to change proxy configuration for a production target.

#### One bundle for all cloud targets

Ideally, you'll only need to have 1 bundle for all cloud targets. You don't need to create a new bundle for each target just to modify the proxy settings. With [Mobify API](../mobify-api/), set your proxy settings in the Cloud.

## Retrieving current proxy settings

Once the the proxy settings are set, later you can find out what they are by using the utility function [`getProxyConfigs()`](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/global.html#getProxyConfigs). For example, you might want to use different SFCC's OCAPI client IDs depending on which environment you're in.

```javascript
import { getProxyConfigs } from "progressive-web-sdk/dist/utils/universal-utils"
import { SalesforceConnector } from "@mobify/commerce-integrations/dist/connectors/sfcc"

const HOST_TO_CLIENT_ID = {
    "api-staging.example.com": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    default: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}

const CLIENT_ID = (function getClientId() {
    const { host } = getProxyConfigs().find(c => c.path === "api")
    return (
        HOST_TO_CLIENT_ID[host] ||
        HOST_TO_CLIENT_ID["default"]
    )
})()

const connector = SalesforceConnector.fromConfig({
    basePath: "/mobify/proxy/api/s/site_id/dw/shop/v17_8",
    defaultHeaders: {
        "x-dw-client-id": CLIENT_ID
    }
})
```

## Proxy HTTP request and response details

Proxying a request changes the HTTP request made to the backend and HTTP response sent to the client to make it work transparently with your application code:

**HTTP Request to the backend**:

- The `/mobify/proxy/$PROXYPATH/` prefix is removed.
- An HTTP header `X-Mobify: true` is added.

**HTTP Response to the client**:

- An HTTP header `X-Request-Url: $URL` is added with the URL that was requested from your backend.
- If the response from the backend was a redirect with an HTTP Status code between 301 and 307, and the response's `Location` header was a relative or an absolute path whose `host` matches the proxy's `host`, then the `/mobify/proxy/$PROXYPATH/` prefix is added to the `Location` header.
- If the response from the backend contains `Set-Cookie` headers whose `domain` matches the `host` of the proxy, they are updated to match it. _For example, `Set-Cookie: key=val; domain=api.example.com` is updated to `Set-Cookie: key=val; domain=www.example.com`._
- If the response from the backend contains an `Access-Control-Allow-Origin` header whose value matches the proxy's `host`, it is updated. _For example, `Access-Control-Allow-Origin: https://api.example.com` is updated to `Access-Control-Allow-Origin: https://www.example.com`._

Proxying supports the standard HTTP methods: `HEAD|DELETE|POST|GET|OPTIONS|PUT|PATCH`.

Proxied requests forward all query string parameters and headers including cookies to the backend.

## Improving proxy performance with caching

**By default, proxies don't act as an HTTP cache.** _This allows them to be used transparently, without having to worry about incorrectly caching responses!_

To use a proxy as an HTTP cache, change the path prefix used in your request from `proxy` to `caching`:

```javascript
import fetch from 'isomorphic-unfetch'

fetch("/mobify/caching/api/product/handbag.json", {
  headers: { Authorization: "API-TOKEN" }
})
```

### Caching proxy HTTP request and response details

<!-- https://github.com/mobify/ssr-infrastructure/blob/080f9d61c3b38393f559f7eedd999760839683d1/assets/cloudfront.yaml#L422-L436 -->
<!-- TODO: Confirm exact behaviour. -->

Caching proxy requests differ in notable ways from standard proxy requests:

**Request to the backend**:

The `Cookie` HTTP header is removed.

**Response to the client**:

`Set-Cookie` HTTP headers are removed.

<!-- TODO: Add a link to an external resource on HTTP Caching Headers. It should cover: Expiry|Cache-Control|E-Tags|Last-Modified -->

<!-- TODO: Can we explain `vary` more clearly? -->

Cached responses vary based on the following HTTP request headers:

* `Accept`
* `Accept-Charset`
* `Accept-Encoding`
* `Accept-Language`
* `Authorization`
* `Range`

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>
