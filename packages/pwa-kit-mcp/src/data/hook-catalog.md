Note: This hooks catalog file uses the subset of markdown parsable by hooksCatalogAsJson.

### useAccessToken

Hook that returns the access token.

```javascript
// Imports: {useAccessToken} from '@salesforce/commerce-sdk-react'; {useEffect} from 'react'
// Retrieve an access token when ready
const {getTokenWhenReady} = useAccessToken()

useEffect(() => {
    let isMounted = true
    getTokenWhenReady().then((token) => {
        if (!isMounted) return
        // use token here
    })
    return () => {
        isMounted = false
    }
}, [getTokenWhenReady])
```

### useAuthHelper

Hook for auth helper.

```javascript
// Imports: {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
const logout = useAuthHelper(AuthHelpers.Logout)

const handleSignOut = async () => {
    await logout.mutateAsync()
    // optionally navigate('/login')
}
```

### useLocalStorage

Hook for local storage.

```javascript
// Imports: {useState, useEffect} from 'react'
// Persist a value in localStorage without relying on a custom hook
const [value, setValue] = useState(() => {
    if (typeof window === 'undefined') return null
    try {
        const stored = window.localStorage.getItem('my-key')
        return stored ? JSON.parse(stored) : null
    } catch {
        return null
    }
})

useEffect(() => {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem('my-key', JSON.stringify(value))
    } catch {
        // ignore write errors
    }
}, [value])
```

### useShippingMethodsForShipment

Hook for shipping methods for shipment.

```javascript
import React from 'react'
import {useShippingMethodsForShipment} from '@salesforce/commerce-sdk-react'; {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
// Ensure you have access to the current basket
const {data: basket} = useCurrentBasket()

// Fetch available shipping methods for the active shipment
useShippingMethodsForShipment(
    {
        parameters: {
            basketId: basket?.basketId,
            shipmentId: 'me'
        }
    },
    {
        enabled: Boolean(basket?.basketId)
    }
)
```

### useShopperContext

Hook for shopper context.

```javascript
import React from 'react'
import {useShopperContext, useUsid} from '@salesforce/commerce-sdk-react'; {useMultiSite} from '@salesforce/retail-react-app/app/contexts'
// Requires usid and siteId
const {site} = useMultiSite()
const {usid} = useUsid()

const {data: shopperContext, isLoading: isShopperContextLoading} = useShopperContext(
    {
        parameters: {usid, siteId: site.id}
    },
    {
        enabled: Boolean(usid && site?.id)
    }
)
```

### useCustomerBaskets

Hook for customer baskets.

```javascript
// Imports: {useCustomerBaskets, useCustomerId} from '@salesforce/commerce-sdk-react'
const customerId = useCustomerId()

const {data: baskets, isLoading: isBasketsLoading} = useCustomerBaskets(
    {parameters: {customerId}},
    {enabled: Boolean(customerId), keepPreviousData: true}
)
```

### useCustomerOrders

Hook for customer orders.

```javascript
import React from 'react'
import {useCustomerOrders, useCustomerId} from '@salesforce/commerce-sdk-react'

export default function CustomerOrdersExample() {
  const customerId = useCustomerId()
  const {data: {data: orders = [], ...paging} = {}, isLoading, isError, error} = useCustomerOrders(
    {parameters: {customerId, limit: 10, offset: 0, sort: 'creationDate desc'}},
    {enabled: Boolean(customerId)}
  )
  if (isLoading) return <div>Loading orders…</div>
  // Example:
  if (isError) return <div>Error: {String(error)}</div>
  return (
    <div>
      <h2>Orders ({paging?.total ?? orders.length})</h2>
      <pre>{JSON.stringify(orders, null, 2)}</pre>
    </div>
  )
}
```

### usePage

Hook for page.

```javascript
Skeleton
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCustomerOrders, useProducts} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {usePageUrls, useSearchParams} from '@salesforce/retail-react-app/app/hooks'
import PageActionPlaceHolder from '@salesforce/retail-react-app/app/components/page-action-placeholder'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronRightIcon, ReceiptIcon} from '@salesforce/retail-react-app/app/components/icons'
import Pagination from '@salesforce/retail-react-app/app/components/pagination'
import PropTypes from 'prop-types'
```

### useOrder

Hook for order.

```javascript
import React from 'react'
import {useParams} from 'react-router-dom'
import {useOrder} from '@salesforce/commerce-sdk-react'

export default function OrderExample() {
  const {orderNo} = useParams()
  const {data: order, isLoading, isError, error} = useOrder(
    {parameters: {orderNo}},
    {enabled: Boolean(orderNo)}
  )
  // Example:
  if (isLoading) return <div>Loading order...</div>
  if (isError) return <div>Error: {String(error)}</div>
  return <pre>{JSON.stringify(order, null, 2)}</pre>
}
```

### useProducts

Hook for products.

```javascript
import React from 'react'
import {useProducts} from '@salesforce/commerce-sdk-react'; {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
// Expect an array of product IDs in `inputIds`
const productIds = ['test-product-id-1', 'test-product-id-2']
const ids = productIds.join(',')

// Optional inventory scoping by selected store
const {selectedStore} = useSelectedStore()
const selectedInventoryId = selectedStore?.inventoryId || null

const {
    data: productsResponse,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError
} = useProducts(
    {
      parameters: {
        ids: productIds.join(','),
        allImages: false,
        ...(selectedInventoryId ? {inventoryIds: selectedInventoryId} : {}),
        expand: ['availability', 'variations'],
        select: '(data.(id,inventory,inventories,master))'
      }
    },
    {enabled: productIds.length > 0, keepPreviousData: true}
  )
  // Example:
  if (isLoading) return <div>Loading products…</div>
  if (isError) return <div>Error: {String(error)}</div>
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

### useProduct

Hook for product.

```javascript
import React from 'react'
import {useParams, useLocation} from 'react-router-dom'; {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'
// Inside your component
const {productId} = useParams()
const location = useLocation()
const urlParams = new URLSearchParams(location.search)

// If your site uses store selection/inventory
const {selectedStore} = useSelectedStore()
const selectedInventoryId = selectedStore?.inventoryId || null

const {
    data: productResponse,
    isLoading: isProductLoading,
    isError: isProductError,
    error: productError
} = useProduct(
    {
        parameters: {
            id: urlParams.get('pid') || productId,
            perPricebook: true,
            expand: [
                'availability',
                'promotions',
                'options',
                'images',
                'prices',
                'variations',
                'set_products',
                'bundled_products',
                'page_meta_tags'
            ],
            allImages: true,
            ...(selectedInventoryId ? {inventoryIds: selectedInventoryId} : {})
        }
    },
    {
        keepPreviousData: true
    }
)

// product data available as `productResponse`
```

### useCategory

Hook for category.

```javascript
// Imports: {useCategory} from '@salesforce/commerce-sdk-react'; {useParams} from 'react-router-dom'
// Use category id from route or props
const {categoryId} = useParams()

const {
    data: category,
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    error: categoryError
} = useCategory({
    parameters: {
        id: categoryId,
        levels: 1
    }
})
```

### usePromotions

Hook for promotions.

```javascript
import React from 'react'
import {usePromotions} from '@salesforce/commerce-sdk-react'

export default function PromotionsExample() {
  const promotionIds = ['promo-1', 'promo-2']
  const {data, isLoading, isError, error} = usePromotions(
    {parameters: {ids: promotionIds.join(',')}},
    {enabled: promotionIds.length > 0}
  )
  // Example:
  if (isLoading) return <div>Loading promotions…</div>
  if (isError) return <div>Error: {String(error)}</div>
  return <pre>{JSON.stringify(data, null, 2)}</pre>
}
```

### useProductSearch

Hook for product search.

```javascript
import React, {useState} from 'react'
import {useProductSearch} from '@salesforce/commerce-sdk-react'

export default function ProductSearchExample() {
  const [searchQuery, setSearchQuery] = useState('socks')
  const {data, isLoading, isError, error} = useProductSearch({
    parameters: {
      q: searchQuery,
      allImages: true,
      allVariationProperties: true,
      expand: ['promotions', 'variations', 'prices', 'images', 'custom_properties'],
      limit: 24,
      offset: 0,
      sort: ''
    }
  })
  // Example:
  return (
    <div>
      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      {isLoading ? 'Loading…' : isError ? String(error) : <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}
```

### useSearchSuggestions

Hook for search suggestions.

```javascript
import React, {useState} from 'react'
import {useSearchSuggestions} from '@salesforce/commerce-sdk-react'

export default function SearchSuggestionsExample() {
  const [searchQuery, setSearchQuery] = useState('sh')
  const {data: suggestions, isLoading} = useSearchSuggestions(
    {parameters: {q: searchQuery}},
    {enabled: searchQuery.length > 1}
  )
  // Example:
  return (
    <div>
      <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      {isLoading ? 'Loading…' : <pre>{JSON.stringify(suggestions, null, 2)}</pre>}
    </div>
  )
}
```

### useStores

Hook for stores.

```javascript
// Imports: {useStores} from '@salesforce/commerce-sdk-react'; {useState, useEffect} from 'react'
// Geolocation-driven store search
const [coords, setCoords] = useState(null)

useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition((pos) => {
        setCoords({lat: pos.coords.latitude, lon: pos.coords.longitude})
    })
}, [])

const {data: stores, isLoading: isStoresLoading} = useStores(
    {
        parameters: {
            latitude: coords?.lat,
            longitude: coords?.lon,
            radius: 50
        }
    },
    {enabled: Boolean(coords)}
)
```

### useSelectedStore

Get the selected store and status from StoreLocator context.

```javascript
import React from 'react'
import {useSelectedStore} from '@salesforce/retail-react-app/app/hooks/use-selected-store'

export default function SelectedStoreExample() {
  const {selectedStore, hasSelectedStore, isLoading, isError, error} = useSelectedStore()
  // Example:
  if (isLoading) return <div>Loading store…</div>
  if (isError) return <div>Error: {String(error)}</div>
  return <pre>{JSON.stringify({hasSelectedStore, selectedStore}, null, 2)}</pre>
}
```

### useCurrentBasket

Access the current basket and derived data (shipments, totals).

```javascript
import React from 'react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

export default function CurrentBasketExample() {
  const {data: basket, derivedData, isLoading, isError, error} = useCurrentBasket()
  // Example:
  if (isLoading) return <div>Loading basket…</div>
  if (isError) return <div>Error: {String(error)}</div>
  return (
    <div>
      <h3>Derived</h3>
      <pre>{JSON.stringify(derivedData, null, 2)}</pre>
      <h3>Basket</h3>
      <pre>{JSON.stringify(basket, null, 2)}</pre>
    </div>
  )
}
```

### useNavigation

Navigate using the app's navigation helper.

```javascript
import React from 'react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

export default function NavigationExample() {
  const navigate = useNavigation()
  return <button onClick={() => navigate('/')} >Go Home</button>
}
```

### useMultiSite

Access multi-site state like current site and locale.

```javascript
import React from 'react'
import {useMultiSite} from '@salesforce/retail-react-app/app/contexts'

export default function MultiSiteExample() {
  const {site, buildUrl, locale} = useMultiSite()
  // Example:
  return (
    <div>
      <h3>Site</h3>
      <pre>{JSON.stringify({id: site?.id, locale}, null, 2)}</pre>
      <div>Home URL: {buildUrl('/')}</div>
    </div>
  )
}
```

### useGeolocation

Get browser geolocation coordinates with refresh.

```javascript
import React from 'react'
import {useGeolocation} from '@salesforce/retail-react-app/app/hooks/use-geo-location'

export default function GeolocationExample() {
  const {coordinates, loading, error, refresh} = useGeolocation()
  // Example:
  if (loading) return <div>Detecting location…</div>
  if (error) return <div>Error: {String(error)}</div>
  return (
    <div>
      <pre>{JSON.stringify(coordinates, null, 2)}</pre>
      <button onClick={refresh}>Refresh</button>
    </div>
  )
}
```

### useToast

Show Chakra toasts via shared hook.

```javascript
import React from 'react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

export default function ToastExample() {
  const toast = useToast()
  return (
    <button
      onClick={() => toast({title: 'Saved', status: 'success'})}
    >Show Toast</button>
  )
}
```

### useSearchParams

Read/update URL search params with stable defaults.

```javascript
import React from 'react'
import {useSearchParams} from '@salesforce/retail-react-app/app/hooks'

export default function SearchParamsExample() {
  const [params, setParams] = useSearchParams({limit: 12, offset: 0})
  // Example:
  return (
    <div>
      <pre>{JSON.stringify(params, null, 2)}</pre>
      <button onClick={() => setParams({offset: params.offset + 12})}>Next</button>
    </div>
  )
}
```

### usePageUrls

Generate pagination URLs based on total/limit.

```javascript
import React from 'react'
import {usePageUrls} from '@salesforce/retail-react-app/app/hooks'

export default function PageUrlsExample() {
  const {pageUrls} = usePageUrls({total: 100, limit: 12})
  // Example:
  return <pre>{JSON.stringify(pageUrls, null, 2)}</pre>
}
```

### useCurrency

Access active currency information.

```javascript
import React from 'react'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'

export default function CurrencyExample() {
  const {currency, setCurrency} = useCurrency()
  // Example:
  return (
    <div>
      <pre>{JSON.stringify(currency, null, 2)}</pre>
      <button onClick={() => setCurrency('USD')}>Set USD</button>
    </div>
  )
}
```

### useWishList

Access the shopper wishlist via helper hook.

```javascript
import React from 'react'
import {useWishList} from '@salesforce/retail-react-app/app/hooks/use-wish-list'

export default function WishListExample() {
  const {data: wishlist, isLoading, isError, error} = useWishList()
  // Example:
  if (isLoading) return <div>Loading wishlist…</div>
  if (isError) return <div>Error: {String(error)}</div>
  return <pre>{JSON.stringify(wishlist, null, 2)}</pre>
}
```

### useActiveData

Track Active Data analytics events.

```javascript
import React, {useEffect} from 'react'
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'

export default function ActiveDataExample({category, product, search}) {
  const activeData = useActiveData()
  useEffect(() => {
    if (product) activeData.sendViewProduct(category, product, 'detail')
    if (search) activeData.sendViewSearch({q: search?.q}, search?.results)
    if (category) activeData.sendViewCategory({q: ''}, category, search?.results)
  }, [category, product, search])
  return null
}
```

### useEinstein

Send Einstein events and fetch recommendations.

```javascript
import React, {useEffect} from 'react'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'

export default function EinsteinExample({product, searchText, searchResults}) {
  const einstein = useEinstein()
  useEffect(() => {
    if (product) einstein.sendViewProduct(product)
    if (searchText) einstein.sendViewSearch(searchText, searchResults)
  }, [product, searchText, searchResults])
  return null
}
```

### useDataCloud

Send PWA Kit events to Salesforce Data Cloud.

```javascript
import React, {useEffect} from 'react'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'

export default function DataCloudExample({path, product, category, searchParams, searchResults}) {
  const dataCloud = useDataCloud()
  useEffect(() => {
    if (path) dataCloud.sendViewPage(path)
    if (product) dataCloud.sendViewProduct(product)
    if (category && searchParams && searchResults) {
      dataCloud.sendViewCategory(searchParams, category, searchResults)
    }
    if (searchParams && searchResults) {
      dataCloud.sendViewSearchResults(searchParams, searchResults)
    }
  }, [path, product, category, searchParams, searchResults])
  return null
}
```

### useVariant

Return currently selected product variant based on URL params.

```javascript
import React from 'react'
import {useVariant} from '@salesforce/retail-react-app/app/hooks'

export default function VariantExample({product}) {
  const variant = useVariant(product)
  // Example:
  return <pre>{JSON.stringify(variant, null, 2)}</pre>
}
```

### useVariationAttributes

Decorate variation attributes with selection, hrefs, swatches.

```javascript
import React from 'react'
import {useVariationAttributes} from '@salesforce/retail-react-app/app/hooks'

export default function VariationAttributesExample({product}) {
  const attrs = useVariationAttributes(product)
  // Example:
  return <pre>{JSON.stringify(attrs, null, 2)}</pre>
}
```

### useVariationParams

Read current variation params from URL or defaults.

```javascript
import React from 'react'
import {useVariationParams} from '@salesforce/retail-react-app/app/hooks'

export default function VariationParamsExample({product}) {
  const params = useVariationParams(product)
  // Example:
  return <pre>{JSON.stringify(params, null, 2)}</pre>
}
```

### useDerivedProduct

Compute PDP UI state (quantity, stock, messages, variant).

```javascript
import React from 'react'
import {useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'

export default function DerivedProductExample({product}) {
  const state = useDerivedProduct(product)
  // Example:
  return <pre>{JSON.stringify(state, null, 2)}</pre>
}
```

### useModalState

Manage modal open/close and data with route-change handling.

```javascript
import React from 'react'
import {useModalState} from '@salesforce/retail-react-app/app/hooks/use-modal-state'

export default function ModalStateExample() {
  const {isOpen, data, onOpen, onClose} = useModalState()
  // Example:
  return (
    <div>
      <button onClick={() => onOpen({id: 1})}>Open</button>
      <button onClick={onClose}>Close</button>
      <pre>{JSON.stringify({isOpen, data}, null, 2)}</pre>
    </div>
  )
}
```