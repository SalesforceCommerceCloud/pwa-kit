        ____                      ____            _
       / __ \____ _____ ____     / __ \___  _____(_)___ _____  ___  _____
      / /_/ / __ `/ __ `/ _ \   / / / / _ \/ ___/ / __ `/ __ \/ _ \/ ___/
     / ____/ /_/ / /_/ /  __/  / /_/ /  __(__  ) / /_/ / / / /  __/ /
    /_/    \__,_/\__, /\___/  /_____/\___/____/_/\__, /_/ /_/\___/_/
                /____/                          /____/

---

This folder contains React components and utilities that render pages from [Page Designer](https://documentation.b2c.commercecloud.salesforce.com/DOC2/topic/com.demandware.dochelp/content/b2c_commerce/topics/page_designer/b2c_creating_pd_pages.html).

Use this folder to add React components that can render Page Designer components that have been serialized to JSON.

This folder includes components for layout and visualization of images, grids, and carousels.

**By default, Page Designer integration is not enabled in the Retail React App.** Additionally, to utilize the `shopperExperience`
API used in the example below your commerce API client (SLAS client) needs to include the `sfcc.shopper-experience` scope.
See [Authorization for Shopper APIs](https://developer.salesforce.com/docs/commerce/commerce-api/guide/authorization-for-shopper-apis.html)
for more information on configuring your SLAS client.

## Folder Structure

-   **`/core`** - Base components for rendering: `<Page>`, `<Region>`, and `<Component>`. Use `<Page>` to render Page Designer content. Use `<Region>` and `<Component>` for creating new assets.
-   **`/assets`** - Non-visual components used in Page Designer. Includes `<Image>` and `<ImageWithText>` as well as any other Page Designer assets that you want to use in your PWA-Kit app. If you need to visualize a component, add it here.
-   **`/layouts`** - Components responsible for layout. Includes various grids and a `<Carousel>` component.

## Sample Usage

Create a new file called `app/pages/page-viewer/index.jsx`, and add the following:

```jsx
// app/pages/page-viewer/index.jsx

import React from 'react'
import {Box} from '@chakra-ui/react'
import {Page, pageType} from '../../page-designer'
import {ImageTile, ImageWithText} from '../../page-designer/assets'
import {
    Carousel,
    MobileGrid1r1c,
    MobileGrid2r1c,
    MobileGrid2r2c,
    MobileGrid2r3c,
    MobileGrid3r1c,
    MobileGrid3r2c
} from '../../page-designer/layouts'

import {HTTPError, HTTPNotFound} from 'pwa-kit-react-sdk/ssr/universal/errors'

const PAGEDESIGNER_TO_COMPONENT = {
    'commerce_assets.photoTile': ImageTile,
    'commerce_assets.imageAndText': ImageWithText,
    'commerce_layouts.carousel': Carousel,
    'commerce_layouts.mobileGrid1r1c': MobileGrid1r1c,
    'commerce_layouts.mobileGrid2r1c': MobileGrid2r1c,
    'commerce_layouts.mobileGrid2r2c': MobileGrid2r2c,
    'commerce_layouts.mobileGrid2r3c': MobileGrid2r3c,
    'commerce_layouts.mobileGrid3r1c': MobileGrid3r1c,
    'commerce_layouts.mobileGrid3r2c': MobileGrid3r2c
}

const PageViewer = ({page}) => (
    <Box layerStyle={'page'}>
        <Page page={page} components={PAGEDESIGNER_TO_COMPONENT} />
    </Box>
)

PageViewer.getProps = async ({api, params}) => {
    const {pageId} = params
    const page = await api.shopperExperience.getPage({
        parameters: {pageId}
    })

    if (page.isError) {
        let ErrorClass = page.type?.endsWith('page-not-found') ? HTTPNotFound : HTTPError
        throw new ErrorClass(page.detail)
    }

    return {page}
}

PageViewer.displayName = 'PageViewer'

PageViewer.propTypes = {
    page: pageType.isRequired
}

export default PageViewer
```

Open `app/routes.jsx` and add a route for `<PageViewer>`:

```diff
// app/routes.jsx

// Create a loadable page for `page-viewer`.
+ const PageViewer = loadable(() => import('./pages/page-viewer'), {fallback})


// Add a route.
+    {
+        path: '/page-viewer/:pageId',
+        component: PageViewer
+    },
```

Using the local development server, you can now see Page Designer pages rendered in React.js at `http://localhost:3000/page-viewer/:pageid` by providing their `pageid`.
