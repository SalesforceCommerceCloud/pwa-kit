<div class="c-callout">
  <p>
    <strong>Note:</strong> This article discusses the request processor, which is only applicable to applications running on Mobify's Application Delivery Network. To get the most out of this guide, you’ll want to have a good understanding of <a href="https://hpbn.co/" target="_blank">networking and caching</a>.
  </p>
  <p>
    Projects created before March 2019 do not include the request processor.<br><em>For help adding it to your project, contact <a href="https://support.mobify.com/" target="_blank">Mobify Support →</a></em>
  </p>
</div>

## Introduction

**The request processor is an edge function that runs in Mobify's CDN.** It controls how requests are routed from the CDN to your application.

The scaffold contains an example request processor at `packages/pwa/app/request-processor.js`. It exports a function `processRequest`:

```javascript
export const processRequest = ({ path, querystring /* setRequestClass */ }) => {
    return { path, querystring }
}
```

Implementing a request processor means modifying the `processRequest` function, returning an object with the `path` and `querystring` that should be passed to your app. Optionally, you may also mark requests for special handling using the `setRequestClass` function.

In this guide, we'll cover two ways you can use the request processor:

1. Filtering querystrings to improve cache performance
2. Changing app rendering for an AB test using `setRequestClass`

## Filtering querystrings to improve caching

Many apps use [querystring parameters](https://developer.mozilla.org/en-US/docs/Web/API/URL/search) to represent variables values. For example, if your app lets users search, you may choose to represent a search for "sweater" using a querystring: `search=sweater`.

It is also common to use querystrings to track user actions. For example, we might append a unique querystring to each link in a email to track interactions with it: `user=john&source=email`.

Typically, tracking querystrings are not used server side, but _are_ used client side by services like Google Analytics.

Mobify's CDN looks up objects in its cache using the full URL including the querystring. If all requested URLs use unique querystrings, every URL will be unique. No request will be served a cached response! This results in sub-optimal performance.

We can use the request processor to filter querystrings that are only used on the client side, so that the CDN is more likely to respond with a cached response.

This example uses `processRequest` to filter querystring parameters `gclid` and `utm_campaign`, which are commonly associated with Google marketing campaigns. It uses the [`QueryParameters`](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/QueryParameters.html) library function to simpify working with querystrings:

```javascript
import { QueryParameters } from "progressive-web-sdk/dist/utils/ssr-request-processing-utils"

const filterQueryStringKeys = (querystring, filteredKeys) =>
    QueryParameters.from(
        new QueryParameters(querystring).parameters.filter(
            ({ key }) => !filteredKeys.includes(key)
        )
    ).toString()

export const processRequest = ({ path, querystring }) => ({
    path,
    querystring: filterQueryStringKeys(querystring, ["gclid", "utm_campaign"])
})
```

Because the request processor returns a modified `querystring`, the modified full URL is used to look up the corresponding object in the cache, and is passed to the app in the event it is not present.

Be aware of a couple of gotchas using this approach:

**Parameters filtered using the request processor are not sent to the application.** Ensure that your app doesn't use the filtered parameters for rendering! _For example, if you filtered the `search` parameter from above, you'd have a hard time displaying the correct search results!_

**Be cautious filtering parameters from requests that you expect the app to respond to with a redirect.** The application won't see the filtered parameters and the redirect returned to the browser will not contain them.

For example, imagine the app for `www.example.com` redirects users to a specific locale like `www.example.com/en`. If we filter querystring parameters in the request processor, the application will be unaware of them, and unable to include them in a redirect. Consider this sequence:

1. The request processor handles a request for `www.example.com/?gclid=123`
2. The request processor filters the `gclid` querystring parameter
3. The request is forwarded to the application with the full URL `www.example.com`
4. The application returns a redirect to `www.example.com/en`

Note that on this last step, we've lost the original `gclid` parameter, so it won't be available client side after the user is redirected.

To work around this challenge, avoid filtering querystrings of requests you expect to redirect!

## Changing app rendering for an AB test using `setRequestClass`

Imagine that you want to run an A/B testing experiment where your app responds to different experiment groups.

Let's use two groups: `control` for the default handling and `experiment` for folks that should get the experience we're testing.

We'll create a request processor that:

- Checks whether a user is part of a group from a cookie named `ab`.
- Puts the user in a `group` if they are not in one.
- Uses `setRequestClass` to let the app know which group the user is in.

```javascript
const getCookieValueByName = (cookieName, cookieHeader) =>
    cookieHeader.replace(
        new RegExp(`(?:(?:^|.*;\s*)${cookieName}\s*\=\s*([^;]*).*$)|^.*$`, "g"),
        "$1"
    )

const assignBucket = () =>
    Math.floor(Math.random() * Math.floor(2)) ? "experiment" : "control"

export const processRequest = ({
    path,
    querystring,
    headers,
    setRequestClass
}) => {
    let group = getCookieValueByName("ab", headers["Cookie"]) || assignBucket()
    setRequestClass(`ab=${group}`)
    return { path, querystring }
}
```

Now in `pwa/app/ssr.js`, we modify `ExtendedSSRServer` to:

- Get the group from the request class using the `options` argument passed to [`requestHook`](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html)
- Set the `ab` cookie so its value persists using [`res.cookie`](https://expressjs.com/en/4x/api.html#res.cookie)
- Respond based on the group

```javascript
const getGroupFromRequestClass = requestClass =>
    requestClass.split("=").pop() || null

class ExtendedSSRServer extends SSRServer {
    requestHook(req, res, next, options) {
        const group =
            getGroupFromRequestClass(options.requestClass) || "control"

        res.cookie("ab", group)

        if (group != "experiment") {
            return res.send("Control")
        }
        return res.send("Experiment 🐶🧪")
    }
}
```

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>
