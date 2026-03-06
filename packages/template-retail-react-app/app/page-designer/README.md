# Page Designer Components

This folder contains **pure React components** for rendering [Page Designer](https://documentation.b2c.commercecloud.salesforce.com/DOC2/topic/com.demandware.dochelp/content/b2c_commerce/topics/page_designer/b2c_creating_pd_pages.html) pages. **No ISML templates required.**

## Features

- **Pure React** - No ISML dependencies
- **Visual Editing** - Edit pages in Business Manager's Page Designer interface
- **Lazy Loading** - Components load on demand via the registry
- **Type Safe** - Full TypeScript support
- **Performance** - Automatic code splitting and optimization

## Documentation

- **[Migration Guide](../../../commerce-sdk-react/PAGE_DESIGNER.md)** - Step-by-step migration from old to new API
- **[Concepts](../../../commerce-sdk-react/PAGE_DESIGNER_ARCHITECTURE.md)** - How Page Designer integration works

## Prerequisites

1. **SLAS Client**: Must include `sfcc.shopper-experience` scope. See [Authorization for Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-shopper-apis.html).
2. **Registry**: Initialize in your app (already done in `_app/index.jsx`)

## Folder Structure

- **`/assets`** - Visual components (Image, ImageWithText, ProductTile, etc.)
- **`/layouts`** - Layout components (grids, Carousel)

## Quick Example

```jsx
// app/pages/page-viewer/index.jsx
import React from 'react'
import {useParams} from 'react-router-dom'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import {usePage} from '@salesforce/commerce-sdk-react'
import {Page} from '@salesforce/commerce-sdk-react/components'
import {HTTPError, HTTPNotFound} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'

const PageViewer = () => {
    const {pageId} = useParams()
    const {data: page, error} = usePage({parameters: {pageId}})

    if (error) {
        const ErrorClass = error.response?.status === 404 ? HTTPNotFound : HTTPError
        throw new ErrorClass(error.response?.statusText)
    }

    return (
        <Box layerStyle={'page'}>
            <Page page={page} />
        </Box>
    )
}

export default PageViewer
```

Add route in `app/routes.jsx`:

```javascript
const PageViewer = loadable(() => import('./pages/page-viewer'), {fallback})

// In routes array:
{
    path: '/page-viewer/:pageId',
    component: PageViewer
}
```

Visit `http://localhost:3000/page-viewer/:pageId` to render Page Designer pages.
