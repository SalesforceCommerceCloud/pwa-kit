:loudspeaker: Hey there, Salesforce Commerce Cloud community!

We’re excited to hear your thoughts on your developer experience with PWA Kit and the Composable Storefront generally! Your feedback is incredibly valuable in helping us guide our roadmap and improve our offering.

:clipboard: Take our quick survey here: [Survey](https://forms.gle/bUZNxQ3QKUcrjhV18) 

Feel free to share this survey link with your colleagues, partners, or anyone who has experience with PWA Kit. Your input will help us shape the future of our development tools.

Thank you for being a part of our community and for your continuous support! :raised_hands:

# Commerce SDK React

<p align="center">
A collection of <a href="https://tanstack.com/query/latest/docs/react/overview">react-query</a> hooks for <b>fetching</b>, <b>caching</b>, and <b>mutating data</b> from the <b><a href="https://developer.salesforce.com/docs/commerce/commerce-api/overview">Salesforce B2C Commerce API</a></b> (SCAPI).</p>

## 🎯 Features

-   Shopper authentication & token management via [SLAS](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-login)
-   Server side data fetching (in conjuction with PWA Kit)
-   Phased Launch support ([plugin_slas](https://github.com/SalesforceCommerceCloud/plugin_slas) compatible)
-   Built-in caching for easy state management
    -   automatic cache invalidations/updates via the library's built-in mutations
    -   automatic cache key generation

## ⚙️ Installation

```bash
npm install @salesforce/commerce-sdk-react @tanstack/react-query
```

## ⚡️ Quickstart (PWA Kit v2.3.0+)

To integrate this library with your PWA Kit application you can use the `CommerceApiProvider` directly assuming that you use the `withReactQuery` higher order component to wrap your `AppConfig` component. Below is a snippet of how this is accomplished.

```jsx
// app/components/_app-config/index.jsx

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'

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
// retry is always disabled on server side regardless of the value from the options
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

You can use this library in any React application by creating a new QueryClient and wrap your application with `QueryClientProvider`. For example:

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

Commerce-react-sdk supports both public and private flow of the [Authorization for Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-shopper-apis.html) guide._
You can choose to use either public or private slas to login. By default, public flow is enabled.

#### How private SLAS works
This section assumes you read and understand how [private SLAS](https://developer.salesforce.com/docs/commerce/commerce-api/guide/slas-private-client.html) flow works

To enable private slas flow, you need to pass your secret into the CommercerProvider via clientSecret prop.
**Note** You should only use private slas if you know you can secure your secret since commercer-sdk-react runs isomorphically.

```js
// app/components/_app-config/index.jsx

import {CommerceApiProvider} from '@salesforce/commerce-sdk-react'
import {withReactQuery} from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'

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
            clientSecret="<your-slas-private-secret>"
        >
            {children}
        </CommerceApiProvider>
    )
}
```
#### Disable slas private warnings 
By default, a warning as below will be displayed on client side to remind developers to always keep their secret safe and secured.
```js
'You are potentially exposing SLAS secret on browser. Make sure to keep it safe and secure!'
```
You can disable this warning by using CommerceProvider prop `silenceWarnings`

```js
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
            clientSecret="<your-slas-private-secret>"
            silenceWarnings={true}
        >
            {children}
        </CommerceApiProvider>
    )
}
```

### Shopper Session Initialization

On `CommerceApiProvider` mount, the provider initializes shopper session by initiating the SLAS **Public Client** login flow. The tokens are stored/managed/refreshed by the library.

### Authenticate request queue

While the library is fetching/refreshing the access token, the network requests will queue up until there is a valid access token.

### Login helpers
To leverage the managed shopper authentication feature, use the `useAuthHelper` hook for shopper login.

Example:

```jsx
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'

const Example = () => {
    const register = useAuthHelper(AuthHelpers.Register)
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const logout = useAuthHelper(AuthHelpers.LogOut)

    return <button onClick={() => {
        login.mutate({username: 'kevin', password: 'pa$$word'})
    }}>
}
```

### Externally Managed Shopper Authentication

You have the option of handling shopper authentication externally, by providing a SLAS access token. This is useful if you plan on using this library in an application where the authentication mechanism is different.


```jsx
const MyComponent = ({children}) => {
    return <CommerceApiProvider fetchedToken="xxxxxxxxxxxx">{children}</CommerceApiProvider>
}
```

## Hooks

The majority of hooks provided in this library are built on top of the [useQuery](https://tanstack.com/query/latest/docs/react/reference/useQuery) and the [useMutation](https://tanstack.com/query/latest/docs/react/reference/useMutation) hook from [react-query](https://tanstack.com/query/latest). React-query provides a declarative way for fetching and updating data. This library takes advantage of the features provided by react-query and combine with the [commerce-sdk-isomorphic](https://github.com/SalesforceCommerceCloud/commerce-sdk-isomorphic) API client to create a collection of hooks to simplify data fetching for SCAPI.

The hooks can be categorized into **Query hooks** and **Mutation hooks**.

### Query hooks

The query hooks correspond to the http GET endpoints from the SCAPI. The query hooks follow the signature pattern:

```
use<EntityName>(CommerceClientOptions, ReactQueryOptions)
```

Both the **required** and **optional** parameters for the underlying `commerce-sdk-isomorphic` call is passed as the first parameter:

```jsx
import {useProduct} from '@salesforce/commerce-sdk-react'

const Example = () => {
    const query = useProduct({
        parameters: {
            id: '25592770M',
            locale: 'en-US'
        }
    })

    return (
        <>
            <p>isLoading: {query.isLoading}</p>
            <p>name: {query.data?.name}</p>
        </>
    )
}
```

The second parameter is the react-query query options, for more detail, read [useQuery reference](https://tanstack.com/query/latest/docs/react/reference/useQuery).

```jsx
import {useBasket} from '@salesforce/commerce-sdk-react'

const onServer = typeof window === undefined

const Example = ({basketId}) => {
    const query = useBasket(
        {
            parameters: {
                basketId: basketId
            }
        },
        {
            // A common use case for `enabled` is
            // to conditionally fetch based on environment
            enabled: !onServer && basketId
        }
    )
}
```

### Mutation hooks

The query hooks correspond to the http POST, PUT, PATCH, DELETE endpoints from the SCAPI. The mutation hooks follow the signature pattern:

```
use<ApiName>Mutation(EndpointName)
```

For example, the [ShopperBaskets API](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=Summary) has a number of endpoints, one of them being the [addItemToBasket](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets?meta=addItemToBasket) endpoint (`POST /baskets/{basketId}/items`).

```jsx
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

const Example = ({basketId}) => {
    // Typescript IDE intellisense for available options
    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')

    return (
        <button
            onClick={() =>
                addItemToBasket.mutate({
                    parameters: {
                        basketId
                    },
                    body: {
                        productId: '25592770M',
                        price: 55,
                        quantity: 1
                    }
                })
            }
        />
    )
}
```

You could also import the mutation options as a constant like:

```jsx
import {useShopperBasketsMutation, ShopperBasketsMutations} from '@salesforce/commerce-sdk-react'

const Example = ({basketId}) => {
    // this works
    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')

    // this also works
    const addItemToBasket = useShopperBasketsMutation(ShopperBasketsMutations.AddItemToBasket)
    return ...
}
```

### Cache Invalidations and Updates

Since mutations changes data on the server, the cache entries that are potentially affected by the mutation is automatically invalidated.

For example, an `addItemToBasket` mutation automatically update `useBasket` and `useCustomerBaskets` query cache, because the mutation result contains the information for the updated basket. In other cases, when the mutation response do not have the updated data, the library will invalidate the cache and trigger a re-fetch. For the DELETE endpoints, the library removes the cache entries on successful mutations.

_💡 Debugging hint: install and include `@tanstack/react-query-devtools` in your React app to see the queries (inspect the query states and cache keys)._

## Ultilities

Besides the collection of query hooks and mutation hooks, here are some ultility hooks to help you interact with SCAPI.

### `useCommerceApi()`

This hook returns a set of SCAPI clients, which are already initialized using the configurations passed to the provider. Note: this hook doesn't automatically include auth headers.

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
useEncUserId() => {encUserId: String, getEncUserIdWhenReady: Promise}
```

### `useUsid()`

```ts
useUsid() => {usid: String, getUsidWhenReady: Promise}
```

## Roadmap

-   Optimistic update support
-   SLAS private client support

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
