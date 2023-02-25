        ____                      ____            _                      
       / __ \____ _____ ____     / __ \___  _____(_)___ _____  ___  _____
      / /_/ / __ `/ __ `/ _ \   / / / / _ \/ ___/ / __ `/ __ \/ _ \/ ___/
     / ____/ /_/ / /_/ /  __/  / /_/ /  __(__  ) / /_/ / / / /  __/ /    
    /_/    \__,_/\__, /\___/  /_____/\___/____/_/\__, /_/ /_/\___/_/     
                /____/                          /____/                   

---

## Summary

This folder contains the React components and utilities required to render `pages` created in the Business Managers **Page Desginer** backend in your PWA-Kit app. This is a living folder where you, the developer, can add your own component implementations for those that exist in the **Page Designer** backend, or custom components you may have added via an SFRA cartirdge. We have given you a head start by providing some of the components for layout and visualization (e.g. images, grids, and carousels). 

## Folders

The `Page Desginer` folder is broken down into 3 main sub-folders:

- **/core** - Contains the _Page_, _Region_, and _Component_ base assets. Think of these as the basic building blocks for rendering your page. You will not spend a lot of time in this folder, but you will definately be using the _Page_ component, as it's the primary component used to render your experience. The other components will also be useful when you are creating new _assets_. 

- **/assets** - This folder contains the non-visual components that you dragged and dropped on your **Page Designer** pages. These include things like "Image", "ImageWithText" and and any other Page Designer assets you want to visualize in your PWA-Kit app. If you need to visualize a new component that we haven't provided, you can add it here.

- **/layouts** - Contrary to the above, this folder contains only components that involve layout of other components. We have gotten you off to a good start by giving you various _grid_ and _carousel_ layout components.

## Sample Usage

Below is a sample page that you can use as a starting point in your _retail react app_ to visualize pages that have created in business manager. After starting the dev server you can access the page viewer using the following url `http://localhost:3000/page-viewer/homepage-example`. _Note: "homepage-example is a sample page designer page that is included with all Business Manager backends, if you want to view another page you created, please use that id instead._

```
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

const PageViewer = ({page}) => {
    // Assign the components to be rendered for any given page designer component type.
    const components = {
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

    return (
        <Box layerStyle={'page'}>
            <Page page={page} components={components} />
        </Box>
    )
}

PageViewer.getProps = async ({api, params}) => {
    const {pageId} = params

    // Note: There is no error and 404 handling in this example, if you chose to use this code you will have to add that on your own.
    const page = await api.shopperExperience.getPage({
        parameters: {pageId}
    })

    return {
        page
    }
}

PageViewer.displayName = 'PageViewer'

PageViewer.propTypes = {
    page: pageType.isRequired
}

export default PageViewer
```

_**Note:** To ensure that this page is routeable you need to add it to your applications routes file._

```
// app/routes.jsx

// Create new loadabled page for the `page-viewer`
+ const PageViewer = loadable(() => import('./pages/page-viewer'), {fallback})


// Add the new route object to the routes array
+    {
+        path: '/page-viewer/:pageId',
+        component: PageViewer
+    },
```