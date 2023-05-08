# Commerce SDK React

<p align="center">
A collection of React hooks for <b>fetching</b>, <b>caching</b>, and <b>mutating data</b> from the <b><a href="https://developer.salesforce.com/docs/commerce/commerce-api/overview">Salesforce B2C Commerce API</a></b> (SCAPI).
The library contains declarative, always-up-to-date auto-managed <b>queries</b> and <b>mutations</b> that directly improve both developer and user experiences.
</p>

## 🎯 Features

- [react-query](https://tanstack.com/query/latest/docs/react/overview) and [commerce-sdk-isomorphic](https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic) integration
- Shopper authentication & token management via [SLAS](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login)
- SSR data fetching React Hooks
- Phased Launch support ([plugin_slas](https://github.com/SalesforceCommerceCloud/plugin_slas) compatible)
- [TypeScript](https://www.typescriptlang.org/) Support
- Multi-site and locale/currency support
- Request deduplication
- Built-in caching for easy state management
  - auto cache invalidations/updates by mutations
  - auto cache key generation

## ⚙️ Installation

```bash
npm install @salesforce/commerce-sdk-react @tanstack/react-query
```

## ⚡️ Quickstart (PWA Kit)

To integrate this library with your PWA Kit application you can use the `CommerceApiProvider` directly, given that you use the `withReactQuery` higher order component to wrap your `AppConfig` component. Below is a snippet of how this is accomplished.

```jsx
// app/components/_app-config/index.jsx

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from 'pwa-kit-react-sdk/ssr/universal/components/with-react-query'

const AppConfig = ({children}) => {
    return (
        <CommerceApiProvider
            clientId="12345678-1234-1234-1234-123412341234"
            organizationId="f_ecom_aaaa_001"
            proxy="localhost:3000/mobify/proxy/api"
            redirectURI="localhost:3000/callback"
            siteId="RefArch"
            shortCode="12345678"
            locale="en-US"
            currency="USD"
        >
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

## ⚡️ Quickstart (Generic React App)

You can use this library in any React application provided you bring your own QueryClient and QueryClientProvider. Below is a sample integration:

```jsx
import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'


const App = ({children}) => {
    const queryClient = new QueryClient()

    return (
        <QueryClientProvider client={queryClient}>
            <CommerceApiProvider
                clientId="12345678-1234-1234-1234-123412341234"
                organizationId="f_ecom_aaaa_001"
                proxy="localhost:3000/mobify/proxy/api"
                redirectURI="localhost:3000/callback"
                siteId="RefArch"
                shortCode="12345678"
                locale="en-US"
                currency="USD"
            >
                {children}
            </CommerceApiProvider>
        </QueryClientProvider>
    )
} 

export default App
```

## Shopper Authentication and Token Management

_💡 This section assumes you have read and completed the [Authorization for Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-shopper-apis.html) guide._

To help reduce boilerplate code for managing shopper authentication, by default, this library automatically initializes shopper session and manages the tokens for developers. Currently, the library supports the [Public Client login flow](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-public-client.html).

### Shopper Session Initialization

On `CommerceApiProvider` mount, the provider initializes shopper session by initiating the SLAS Public Client login flow. The tokens are stored/managed by the library to support Phased Launch use cases and multi-site setup.

When the access token is expired, the library will automatically try to refresh the access token by calling the `/oauth2/token` endpoint with `grant_type=refresh_token`.

### Authenticate request queue

While the library is getting/refreshing the access token, the network requests will queue up until there is a valid access token.

### Auth helpers

To leverage the managed shopper authentication feature, use the auth helper hooks for shopper login.

Example:

```jsx
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'

const Example = () => {
    const register = useAuthHelper(AuthHelpers.Register)
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const logout = useAuthHelper(AuthHelpers.LogOut)

    return <button onClick={() => {
        login.mutate({username, password})
    }}>
}
```

### Opt-out from managed shopper authentication

To opt-out of the auto-login, request queue, and token management features, pass `fetchedToken` (a SLAS JWT) to the provider.

```jsx
const MyComponent = ({children}) => {
    return (
        <CommerceApiProvider
            fetchedToken="xxxxxxxxxxxx"
        >
            {children}
        </CommerceApiProvider>
    )
} 
```

## Queries

The query hooks correspond to the http GET endpoints from the SCAPI family. The query hooks follow the signature pattern:

```
use<EntityName>(CommerceClientOptions, ReactQueryOptions)
```

For example, both the __required__ and __optional__ parameters for the underlying `commerce-sdk-isomorphic` call is passed as the first parameter:

```jsx
import {useProduct} from '@salesforce/commerce-sdk-react'

const Example = () => {
    const query = useProduct({
        parameters: {
            id: '25592770M',
            locale: 'en-US'
        }
    })

    return <>
        <p>isLoading: {query.isLoading}</p>
        <p>name: {query.data?.name}</p>
    </>
}
```

The second parameter is the react-query query options, for more detail, read [useQuery reference](https://tanstack.com/query/latest/docs/react/reference/useQuery).

```jsx
import {useBasket} from '@salesforce/commerce-sdk-react'

const onServer = typeof window === undefined

const Example = ({basketId}) => {
    const query = useBasket({
        parameters: {
            basketId: basketId
        },
    }, {
        // A common use case for `enabled` is
        // to conditionally fetch based on environment
        enabled: !onServer && basketId
    })
}
```

### Advanced: Query Key Structure

In most cases, you won't need to use this! This feature is intended for advanced use cases where you want to manually update/invalidate the cache entires. Here is the explanation of the cache key structure.

The query keys are automatically generated in the following format:

```js
['commerce-sdk-react', ...RestfulApiPathSegments, {...CommerceClientOptions}]
```

For example, `useProduct({parameters: {id: '25592770M', "allImages": true}})` hook has query key:

```js
['commerce-sdk-react', '/organizations', '/f_ecom_aaaa_001', '/products', '/25688443M', {
    "organizationId": "f_ecom_zzrf_001",
    "id": "25688443M",
    "currency": "GBP",
    "locale": "en-GB",
    "allImages": true,
    "siteId": "RefArchGlobal"
  } ]
```

The first element in the query key is always a constant value `commerce-sdk-react`, the namespace provides flexibility for invalidating the entire query cache. This is typically useful when using react-query for multiple services including SCAPI. This allows us to invalidate the entire SCAPI cache without affecting other cache entries, for example, cache for fetching data from a customer CMS provider. To invalidate all SCAPI cache entries, use `queryClient.invalidateQueries(['commerce-sdk-react'])`.

The following N elements in the array are the path segment of the actual SCAPI endpoint. This design makes it easier to have granular control over individual cache as well as the ability to do bulk invalidations based on the hierarchy of the entities.

Example, invalidate customer's basket v.s. invalidate just the shipping address in the basket

```js
// invalidate entire customer basket cache, including getBasket, getPaymentMethodsForBasket, getPriceBooksForBasket, getShippingMethodsForShipment and getTaxesFromBasket
queryClient.invalidateQueries(['commerce-sdk-react', '/organizations', '/f_ecom_aaaa_001', '/baskets', '/BASKET_ID'])

// granular invalidation for just the shipping methods
queryClient.invalidateQueries(['commerce-sdk-react', '/organizations', '/f_ecom_aaaa_001', '/baskets', '/BASKET_ID', '/shipments', 'SHIPMENT_ID', '/shipping-methods'])
```

_💡 Hint: include `@tanstack/react-query-devtools` in your React app to see the queries (and their cache keys)._

## Mutations

The query hooks correspond to the http POST, PUT, PATCH, DELETE endpoints from the SCAPI family. The mutation hooks follow the signature pattern:

```
use<ApiName>Mutations(EndpointName)
```

For example, the [ShopperBaskets API](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=Summary) has a number of endpoints, one of the endpoint is the [addItemToBasket](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addItemToBasket) endpoint (`POST /baskets/{basketId}/items`).

```jsx
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

const Example = ({basketId}) => {
    // Typescript IDE intellisense for available options as string
    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')

    return <button onClick={() => addItemToBasket.mutate({
        parameters: {
            basketId
        },
        body: {
            productId: '25592770M',
            price: 55,
            quantity: 1
        }
    })} />
}
```

You could also import the mutation options as a constant like:

```jsx
import {useShopperBasketsMutation, ShopperBasketsMutations} from '@salesforce/commerce-sdk-react'

const Example = ({basketId}) => {
    const addItemToBasket = useShopperBasketsMutation(ShopperBasketsMutations.AddItemToBasket)
    return ...
}
```

### Auto Cache Invalidations

Since mutations changes data on the server, the cache entries that are potentially affected by the mutation is automatically invalidated.

For example, a `addItemToBasket` mutation will automatically invalidate `getBasket` query.

## Ultilities

Besides the collection of query hooks and mutation hooks, here are some ultility hooks to help you interact with SCAPI.

### `useCommerceApi()`

This hook returns a set of SCAPI clients, which are already initialized client using the configurations passed to the provider. Note: this hook doesn't automatically include auth headers.

```jsx
import {useCommerceApi, useAccessToken} from '@salesforce/commerce-sdk-react'

const Example = () => {
    const api = useCommerceApi()
    const {getTokenWhenReady} = useAccessToken()

    const fetchProducts = async () => {
        const token = await getTokenWhenReady()
        const products = await api.shopperProducts.getProducts({
                parameters: {ids: ids.join(',')},
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        return products
    }

}
```

### `useAccessToken()`

```ts
useAccessToken() => {token: String, getTokenWhenReady: Promise}
```

This ultility hook give access to the managed SLAS access token.

### `useCustomerId()`

```ts
useCustomerId() => null | string
```

### `useCustomerType()`

```ts
useCustomerId() => null | 'guest' | 'registered'
```

### `useEncUserId()`

```ts
useEncUserId() => null | string
```

### `useUsid()`

```ts
useUsid() => null | string
```

## Roadmap
- Optimistic update support
- SLAS private client support

## Useful Links:

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
