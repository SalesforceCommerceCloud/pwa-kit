# Connection Pooling Demo

By default, Node doesn't re-use connections between requests.

`http.Agent` "is responsible for managing connection persistence and reuse for HTTP clients.": https://nodejs.org/api/http.html#class-httpagent

In PWA Kit, every request that ends up in a call to `pwa-kit-react-sdk/ssr/server/react-rendering::render()` will likely make many HTTP requests to the same host (Commerce API, proxied by the storefront)

By using Agents configured re-use conenctions, we can observe a meaningful reduction in response times.

This demo shows how connection re-use can be approached.

```sh
# Install
npm ci

# Run Locally
npm start

# Prep for upload
npx webpack

# Upload
npx sdk-upload --buildDirectory dist
```

The project is currently deployed:

* https://demo-pool-connections.mobify-storefront.com/
* https://demo-no-pool-connections.mobify-storefront.com/

You can perform simple analysis using Apache Bench (`ab`) and comparing response times:

```sh
ab -n 100 -c 10 'https://demo-pool-connections.mobify-storefront.com/'
ab -n 100 -c 10 'https://demo-no-pool-connections.mobify-storefront.com/'
```