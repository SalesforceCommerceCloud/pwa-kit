# Commerce SDK React

A library of React hooks for fetching data from Salesforce B2C Commerce.

## Documentation

The full documentation for PWA Kit and Managed Runtime is hosted on the [Salesforce Developers](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/overview) portal.


## PWA-Kit Integration

> To integration this library with your PWA-Kit application you can use the `CommerceApiProvider` directly given that you use the `withReactQuery` higher order component to wrap your `AppConfig` component. Below is a snippet of how this is accomplished.

```
// app/components/_app-config/index.jsx

import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/with-react-query'

const AppConfig = ({children}) => {
    return (
        <CommerceApiProvider {...commerceApiProviderProps}>
            {children}
        </CommerceApiProvider>
    )
} 

// Set configuration options for react query.
// NOTE: This configuration will be used both on the server-side and client-side.
const options = {
    queryClientConfig: {
        defaultOptions: {
            queries: {
                retry: false
            },
            mutations: {
                retry: false
            }
        }
    }
}

export default withReactQuery(AppConfig, options)
```

## Generic Integration

> You can use this library in any React application provided you bring your own QueryClient and QueryClientProvider. Below is a sample integration:

```
import {QueryClient, QueryClientConfig, QueryClientProvider} from '@tanstack/react-query'


const App = ({children}) => {
    const queryClient = new QueryClient(queryClientConfig)

    return (
        <QueryClientProvider client={queryClient}>
            <CommerceApiProvider {...commerceApiProviderProps}>
                {children}
            </CommerceApiProvider>
        </QueryClientProvider>
    )
} 

export default App
```
### Useful Links:

-   [Get Started](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html)
-   [Skills for Success](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/skills-for-success.html)
-   [Set Up API Access](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/setting-up-api-access.html)
-   [Configuration Options](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/configuration-options.html)
-   [Proxy Requests](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/proxying-requests.html)
-   [Push and Deploy Bundles](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html)
-   [The Retail React App](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/retail-react-app.html)
-   [Rendering](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/rendering.html)
-   [Routing](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/routing.html)
-   [Phased Headless Rollouts](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/phased-headless-rollouts.html)
-   [Launch Your Storefront](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/launching-your-storefront.html)

## Support Policy
Security patches are provided for 24 months after the general availability of each major version of the SDK (1.0, 2.0, and so on).