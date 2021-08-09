# SSR Configuration
Key parts of the setup of the SSR server are controlled by configuration options in the `mobify` object, defined at the top level of the project's `package.json` file. Here's an example (with other parts of `package.json` omitted for clarity):

```json
{
  "name": "progressive-web-scaffold",
  "mobify": {
    "pageNotFoundURL": "/page-not-found",
    "ssrEnabled": true,
    "ssrOnly": [
      "ssr.js",
      "ssr.js.map"
    ],
    "ssrShared": [
      "main.css",
      "static/ico/favicon.ico",
      "static/robots.txt",
      "**/*.js",
      "**/*.js.map"
    ],
    "ssrParameters": {
      "proxyConfigs": [
        {
          "protocol": "https",
          "host": "www.merlinspotions.com",
          "path": "base",
        }
      ]
    }
  }
}
```

The key values are as follows:

### `pageNotFoundURL` <a name="pageNotFoundURL" href="#pageNotFoundURL">#</a>
The route ("path" part of the URL) that the server-side rendered (SSR) PWA uses to render a "page not found" page. If the SSR server receives a request for a route that the server-side rendered PWA does not recognize (see the `routes` option for the
[`SSRServer` class](../ssr-server#SSRServerClass)), and which is not handled by the [`requestHook`](../ssr-server#requestHook), then it will request the server-side rendered PWA to render the route defined in the `pageNotFoundURL`.

### `ssrEnabled` <a name="ssrEnabled" href="#ssrEnabled">#</a>
This boolean flag should be set to `true` for a server-side rendered PWA project. If the project
is based on the Mobify Platform scaffold, then setting this to `true` enables building of the SSR-related parts of the project. The value also marks
any bundles pushed to Mobify Cloud as containing SSR files. If this value
is not `true`, deploying those bundles will not create SSR servers.
  
### `ssrOnly` and `ssrShared` <a name="ssrOnlyAndShared" href="#ssrOnlyAndShared">#</a>
For efficiency, when a bundle is pushed to Mobify Cloud, not all the files in that bundle are packaged up and made available to the SSR server in remote mode. For example, large image files aren't used in server-side
rendering, and including them as part ofa [remote mode](../ssr-server#localAndRemote) SSR server slows down bundle deployment and SSR rendering.

The `ssrOnly` and `ssrShared` properties are lists of bundle files, relative to the build directory (the output directory for `webpack` or other build tools) that define which bundle files are made available to the SSR server when it's running in remote mode. They are lists of [globbing patterns](https://www.npmjs.com/package/minimatch) where `*` is a wildcard matching zero or more of any character.

The `ssrOnly` list defines which files are **only** part of the SSR server, and should not be made available under the `/mobify/bundle/` path. Typically this would include the `ssr.js` file that instantiates the [`SSRServer` class](../ssr-server#SSRServerClass).

The `ssrShared` list defines which files are made available to the SSR Server and are **also** available available under the `/mobify/bundle/` path. Typically
this list will include:

* The server-side rendered JavaScript files: `main.js`, `vendor.js` and `worker.js`. The example above includes them with `.js*` extensions so that `.map` files will also be available to the SSR Server, for more meaningful stack traces in the event
  of errors.
  
* Any extra JS files such as webpack chunks (for example,`product-list*.js*`) that may be loaded by the PWA when running server-side.
  
* Any bundle files that the server-side rendered PWA might need to load from the file system. For example, see the `requestHook` implemented in the [SSR Server example](../ssr-server#SSRServerExample) which uses `response.sendFile` to load bundle files. If a file was not listed in `ssrShared`, it would not be present when the SSR Server is running in remote mode, and the file load would fail.

### `ssrParameters` <a name="ssrParameters" href="#ssrParameters">#</a>
This section contains additional parameters that configure SSR server behaviour. The proxy-related values are explained [in the section on proxying](../proxying#proxyConfig).
