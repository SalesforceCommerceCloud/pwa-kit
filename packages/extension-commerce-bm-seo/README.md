# Extension Commerce BM SEO

A [PWA Kit](https://github.com/SalesforceCommerceCloud/pwa-kit) extension that adds SEO functionality to your application through the [Shopper SEO URL Mapping API](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-seo?meta=getUrlMapping). This extension provides features like:

- Integrate routes managed in Business Manager with the PWA Kit
- Integration with SCAPI Shopper SEO URL Mapping API
- Support for multiple resource types (products, categories)

## Installation

```sh
 npm install @salesforce/extension-commerce-bm-seo
```
Also: 
 - install the peer dependencies listed in the package.json
 - see the Peer Dependancies section below for any other steps (e.g. make sure your app uses CommerceApiProvider component)

## Peer Dependencies

PWA-Kit Application Extensions are NPM packages at their most simplest form, and as such you can define
what peer dependencies are required when using it. Because this application extension provides
Chakra UI via a page and components, it requires that the some peer dependencies are installed.

Depending on what features your application extensions provides it's recommended you include any third-party
packages as peer dependencies so that your base application doesn't end up having multiple versions of a 
given package. See package.json for the full list of peer dependencies.

## Configuration

The SEO extension is configured via the `mobify.app.extensions` property in your config files or `package.json`:
```json
{
    "mobify": {
        "app": {
            "extensions": [
                [
                "@salesforce/extension-commerce-bm-seo",
                {
                  "enabled": true,
                  "routingMode": "router_first",
                  "commerceAPI": {
                    "proxyPath": "/mobify/proxy/api",
                    "parameters": {
                      "shortCode": "8o7m175y",
                      "clientId": "c9c45bfd-0ed3-4aa2-9971-40f88962b836",
                      "organizationId": "f_ecom_zzrf_001",
                      "siteId": "RefArchGlobal"
                    }
                  },
                  "commerceAPIAuth": {
                    "propertyNameInLocals": "commerceAPIAuth"
                  },
                  "resourceTypeToComponentMap": {
                    "category": "ProductList",
                    "product": "ProductDetail",
                  }
                }
                ]
            ]
        }
    }
}
```

### Configuration Options

- `routingMode`: Determines how the extension handles URL mapping
- `commerceAPI`: Optional settings for connecting to the Commerce API. If a Commerce API Provider has been provided by another extension, 
  its instance will be used.
   - `proxyPath`: The proxy path for API requests
   - `parameters`: Commerce API connection parameters
     - `clientId`: Your Commerce API client ID
     - `organizationId`: Your organization ID
     - `shortCode`: Your short code
     - `siteId`: Your site ID
 - `commerceAPIAuth`: Authentication configuration
   - `propertyNameInLocals`: Property name for storing auth in locals
 - `resourceTypeToComponentMap`: Maps resource types to component names
   - `category`: Component name for category pages
   - `product`: Component name for product pages
   - `content_asset`: Component name for content assets

### Routing Mode Configuration

The `routingMode` configuration determines how the extension handles URL mapping and routing. There are two possible values:

- `"api_first"`: Always calls the `getUrlMapping` API to resolve URLs, regardless of whether the route is predefined in the application's route configuration. This mode ensures that routes defined in Business Manager take precedence over any route defined in code, but it results in additional API calls.

- `"router_first"`: First checks if the URL matches a predefined route in the application's route configuration. If a match is found, it skips the `getUrlMapping` API call. This mode can improve performance by reducing API calls for known routes, but requires careful route configuration to ensure all valid URLs are properly handled.

Choose the routing mode based on your application's needs:
- Use `"api_first"` when you need to ensure all URLs are resolved using the routes configured in Business Manager
- Use `"router_first"` when you want to optimize performance by reducing API calls for known routes

## How It Works

The SEO extension works by:
1. Intercepting incoming requests
2. Querying the Shopper SEO API for URL mappings
3. Dynamically routing to the appropriate component based on the resource type
4. Passing the relevant props to the component

The extension uses the Commerce API's Shopper SEO URL Mapping endpoint to handle SEO-friendly URLs and ensure proper routing within your PWA Kit application.

## Usage of `isNavigationBlocked`

### isNavigationBlocked

- The SEO extension provides an `isNavigationBlocked` state via the application extension store.
- Sibling extensions (such as `@salesforce/extension-chakra-storefront`) should read this value to determine whether navigation is being blocked (e.g., while waiting for SEO URL mapping to resolve).
- When `isNavigationBlocked` is `true`, the sibling extension can use the state to display a loading state until the SEO extension has finished processing the URL mapping.

**Example usage in a sibling extension:**
```typescript
const {isNavigationBlocked} = useApplicationExtensionsStore((state) =>
  state.state['@salesforce/extension-commerce-bm-seo'] || {isNavigationBlocked: false}
)
if (isNavigationBlocked) {
  // Show loading spinner or block navigation
}