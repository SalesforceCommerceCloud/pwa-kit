# Page Designer Migration Guide

This guide helps you migrate from the old Page Designer components to the new implementation with visual editing support.

## What Changed

The `Page`, `Region`, and `Component` components have been redesigned to support:

- **Visual Editing** - Edit pages directly in Business Manager's Page Designer
- **Component Registry** - Lazy loading via a centralized registry (no more `components` prop)
- **Design Mode** - Components receive design metadata for visual editing
- **Nested Regions** - New API for layout components with child regions

## Migration Steps

### Step 1: Update Page Usage

The `Page` component no longer requires a `components` prop. Components are now resolved via the registry.

**Before:**
```jsx
import {Page} from '@salesforce/commerce-sdk-react/components'

// Had to pass components map
const components = {
    'commerce_assets.imageTile': ImageTile,
    'commerce_assets.banner': Banner
}

<Page page={pageData} components={components} />
```

**After:**
```jsx
import {Page} from '@salesforce/commerce-sdk-react/components'

// Components are resolved from the registry automatically
<Page page={pageData} />
```

### Step 2: Set Up the Component Registry

Register your components once during app initialization:

```jsx
// app/page-designer/registry.js
import {registry} from '@salesforce/commerce-sdk-react'

export function initializeRegistry() {
    registry.registerImporter(
        'commerce_assets.imageTile',
        () => import('./assets/image-tile')
    )
    registry.registerImporter(
        'commerce_assets.banner',
        () => import('./assets/banner')
    )
}
```

Initialize in your app (e.g., `_app/index.jsx`):

```jsx
import {useEffect} from 'react'
import {initializeRegistry} from '@salesforce/retail-react-app/app/page-designer/registry'

function App() {
    useEffect(() => {
        initializeRegistry()
    }, [])
    // ...
}
```

### Step 3: Update Region Usage in Layout Components

The `Region` component API changed significantly. It now uses `regionId` instead of receiving the region object directly.

**Before:**
```jsx
import {Region} from '@salesforce/commerce-sdk-react/components'

function TwoColumn({regions}) {
    return (
        <div className="two-column">
            <div className="left">
                <Region region={regions.left} />
            </div>
            <div className="right">
                <Region region={regions.right} />
            </div>
        </div>
    )
}
```

**After:**
```jsx
import {Region} from '@salesforce/commerce-sdk-react/components'

function TwoColumn({component}) {
    return (
        <div className="two-column">
            <div className="left">
                <Region component={component} regionId="left" />
            </div>
            <div className="right">
                <Region component={component} regionId="right" />
            </div>
        </div>
    )
}
```

**Key Changes:**
- Pass `component` (the parent component) instead of `regions`
- Use `regionId` to specify which region to render
- The `Region` finds the region data from `component.regions`

### Step 4: Update Component Props

Components now receive additional props for design mode support.

**Before:**
```jsx
function ImageTile({image, alt, link}) {
    return (
        <a href={link}>
            <img src={image} alt={alt} />
        </a>
    )
}
```

**After:**
```jsx
function ImageTile({image, alt, link, designMetadata, component, regionId}) {
    // designMetadata contains: id, name, isVisible, isLocalized, isFragment
    // component contains the full component data
    // regionId is the parent region's ID
    
    return (
        <a href={link}>
            <img src={image} alt={alt} />
        </a>
    )
}
```

You don't need to use the new props, but they're available if needed.

### Step 5: Enable Visual Editing (Optional)

To enable visual editing in Business Manager, wrap your app with `PageDesignerProvider`:

```jsx
import {
    PageDesignerProvider,
    isDesignModeActive,
    isPreviewModeActive
} from '@salesforce/commerce-sdk-react/components'

function App({children}) {
    // Check if we're in Page Designer context
    const isDesignMode = isDesignModeActive()
    const isPreviewMode = isPreviewModeActive()
    
    if (isDesignMode || isPreviewMode) {
        return (
            <PageDesignerProvider
                clientId="my-storefront"
                targetOrigin="https://your-business-manager.com"
                mode={isDesignMode ? 'EDIT' : 'PREVIEW'}>
                {children}
            </PageDesignerProvider>
        )
    }
    
    return children
}
```

## API Changes Summary

### Page Component

| Before | After |
|--------|-------|
| `<Page page={data} components={map} />` | `<Page page={data} />` |
| Required `components` prop | Components from registry |
| Used `PageContext` internally | No context needed |

### Region Component

| Before | After |
|--------|-------|
| `<Region region={regionObj} />` | `<Region component={comp} regionId="main" />` |
| Received region object directly | Finds region by ID from component |
| No fallback support | `fallbackElement` and `errorElement` props |

**New Region Props:**
```typescript
// For page-level regions
<Region page={page} regionId="main" fallbackElement={<Loading />} />

// For nested regions in layout components
<Region component={component} regionId="left" errorElement={<Error />} />
```

### Component (Internal)

The `Component` is now internal and uses the registry. You don't interact with it directly.

| Before | After |
|--------|-------|
| Used `usePageContext()` for component map | Uses `registry.getComponent()` |
| Wrapped in `<div className="component">` | No wrapper div |
| Synchronous rendering | Suspense-based lazy loading |

## New Features

### Design Metadata

Components receive `designMetadata` with information for visual editing:

```typescript
interface ComponentDesignMetadata {
    id: string           // Component instance ID
    name?: string        // Display name
    isFragment: boolean  // Is this a fragment?
    isVisible: boolean   // Is component visible?
    isLocalized: boolean // Is component localized?
}
```

### Design Mode Detection

Use the hook to conditionally render content:

```jsx
import {usePageDesignerMode} from '@salesforce/commerce-sdk-react/components'

function MyComponent() {
    const {isDesignMode, isPreviewMode} = usePageDesignerMode()
    
    return (
        <div>
            {isDesignMode && <span>Editing mode</span>}
            {/* ... */}
        </div>
    )
}
```

Or use the utility functions:

```jsx
import {isDesignModeActive, isPreviewModeActive} from '@salesforce/commerce-sdk-react/components'

if (isDesignModeActive()) {
    // In design mode
}
```

### Component Registry

```javascript
import {registry} from '@salesforce/commerce-sdk-react'

// Register with lazy loading
registry.registerImporter('typeId', () => import('./component'))

// Register with fallback for loading state
registry.registerImporter('typeId', () => import('./component'), () => import('./skeleton'))

// Get a component
const Component = registry.getComponent('typeId')

// Preload a component
await registry.preload('typeId')
```

## PageDesignerProvider

The provider enables communication with Business Manager's Page Designer for visual editing.

```jsx
<PageDesignerProvider
    clientId="my-storefront"      // Identifier for your app
    targetOrigin="https://..."    // Business Manager origin (security)
    mode="EDIT">                  // 'EDIT' or 'PREVIEW'
    {children}
</PageDesignerProvider>
```

**When to use:**
- Wrap your app when loaded inside Page Designer's iframe
- Use `isDesignModeActive()` or `isPreviewModeActive()` to detect context
- Only needed for visual editing support

## Template Retail React App Changes

If you're using `template-retail-react-app`, here are the specific changes needed:

### 1. Create the Registry File

Create `app/page-designer/registry.js`:

```javascript
import {registry} from '@salesforce/commerce-sdk-react'

export function initializeRegistry() {
    // Commerce Assets
    registry.registerImporter('commerce_assets.imageTile', () => import('./assets/image-tile'))
    registry.registerImporter('commerce_assets.imageAndText', () => import('./assets/image-with-text'))
    registry.registerImporter('commerce_assets.productTile', () => import('./assets/product-tile'))
    
    // Commerce Layouts
    registry.registerImporter('commerce_layouts.carousel', () => import('./layouts/carousel'))
    registry.registerImporter('commerce_layouts.mobileGrid1r1c', () => import('./layouts/mobileGrid1r1c'))
    registry.registerImporter('commerce_layouts.mobileGrid2r1c', () => import('./layouts/mobileGrid2r1c'))
    registry.registerImporter('commerce_layouts.mobileGrid2r2c', () => import('./layouts/mobileGrid2r2c'))
    registry.registerImporter('commerce_layouts.mobileGrid2r3c', () => import('./layouts/mobileGrid2r3c'))
    registry.registerImporter('commerce_layouts.mobileGrid3r1c', () => import('./layouts/mobileGrid3r1c'))
    registry.registerImporter('commerce_layouts.mobileGrid3r2c', () => import('./layouts/mobileGrid3r2c'))
}
```

### 2. Initialize Registry at Module Load

In `app/components/_app/index.jsx`, add the registry initialization at the top level (outside the component):

```javascript
import {initializeRegistry} from '@salesforce/retail-react-app/app/page-designer/registry'

// Initialize registry synchronously at module load time so components are available during SSR
initializeRegistry()
```

### 3. Add PageDesignerProvider to App

In `app/components/_app/index.jsx`, wrap your app content with `PageDesignerProvider`:

```javascript
import {PageDesignerProvider} from '@salesforce/commerce-sdk-react/components'
import {useUsid} from '@salesforce/commerce-sdk-react'

const App = (props) => {
    const {usid} = useUsid()
    
    // Detect Page Designer mode from URL
    const pageDesignerMode = useMemo(() => {
        const queryParams = location?.search || ''
        if (queryParams.includes('mode=EDIT')) return 'EDIT'
        if (queryParams.includes('mode=PREVIEW')) return 'PREVIEW'
        return undefined
    }, [])

    return (
        // ... existing providers ...
        <PageDesignerProvider
            clientId="pwa-kit-client"
            targetOrigin="*"
            usid={usid}
            mode={pageDesignerMode}>
            {children}
        </PageDesignerProvider>
    )
}
```

### 4. Create PageDesignerInit Component

Create `app/components/page-designer-init/index.jsx` to handle design mode behaviors:

```javascript
import React, {useEffect} from 'react'
import {Prompt} from 'react-router-dom'
import {usePageDesignerMode} from '@salesforce/commerce-sdk-react/components'
import {useGlobalAnchorBlock} from '@salesforce/retail-react-app/app/hooks/use-global-anchor-block'

export function PageDesignerInit() {
    const {isDesignMode} = usePageDesignerMode()

    // Block anchor navigation when in design mode
    useGlobalAnchorBlock(isDesignMode)

    // Load Page Designer styles only in design mode
    useEffect(() => {
        if (isDesignMode) {
            void import('@salesforce/storefront-next-runtime/design/styles.css')
        }
    }, [isDesignMode])

    // Block React Router navigation in design mode
    return (
        <Prompt when={isDesignMode} message={() => false} />
    )
}

export default PageDesignerInit
```

### 5. Create useGlobalAnchorBlock Hook

Create `app/hooks/use-global-anchor-block.js` to prevent link navigation in design mode:

```javascript
import {useEffect} from 'react'

export function useGlobalAnchorBlock(enabled = true) {
    useEffect(() => {
        if (typeof window === 'undefined' || !enabled) return

        function preventAnchorClicks(event) {
            const anchor = event.target.closest('a')
            // Allow links with data-pd-allow-link attribute
            if (anchor && !anchor.hasAttribute('data-pd-allow-link')) {
                event.preventDefault()
            }
        }

        document.addEventListener('click', preventAnchorClicks)
        return () => document.removeEventListener('click', preventAnchorClicks)
    }, [enabled])
}
```

### 6. Update Layout Components

Update all layout components to use the new Region API. Example for `mobileGrid2r2c`:

**Before:**
```jsx
export const MobileGrid2r2c = ({regions}) => (
    <SimpleGrid columns={{base: 2, sm: 4}} gridGap={4}>
        {regions.map((region) => (
            <Region key={region.id} region={region} />
        ))}
    </SimpleGrid>
)
```

**After:**
```jsx
export const MobileGrid2r2c = ({regions}) => (
    <SimpleGrid columns={{base: 2, sm: 4}} gridGap={4}>
        {regions.map((region) => {
            const component = {regions}
            return (
                <Region key={region.id} regionId={region.id} component={component} />
            )
        })}
    </SimpleGrid>
)
```

### 7. Add PageDesignerInit to App

In `app/components/_app/index.jsx`, render `PageDesignerInit` inside the provider:

```jsx
<PageDesignerProvider clientId="pwa-kit-client" targetOrigin="*" usid={usid} mode={pageDesignerMode}>
    <PageDesignerInit />
    {children}
</PageDesignerProvider>
```

## Complete Migration Example

**Before (Old API):**
```jsx
// page-viewer.jsx
import {Page} from '@salesforce/commerce-sdk-react/components'
import ImageTile from './components/image-tile'
import Banner from './components/banner'
import TwoColumn from './components/two-column'

const components = {
    'commerce_assets.imageTile': ImageTile,
    'commerce_assets.banner': Banner,
    'commerce_layouts.twoColumn': TwoColumn
}

function PageViewer({pageData}) {
    return <Page page={pageData} components={components} />
}

// two-column.jsx
import {Region} from '@salesforce/commerce-sdk-react/components'

function TwoColumn({regions}) {
    return (
        <div>
            <Region region={regions.left} />
            <Region region={regions.right} />
        </div>
    )
}
```

**After (New API):**
```jsx
// registry.js
import {registry} from '@salesforce/commerce-sdk-react'

export function initializeRegistry() {
    registry.registerImporter('commerce_assets.imageTile', () => import('./assets/image-tile'))
    registry.registerImporter('commerce_assets.banner', () => import('./assets/banner'))
    registry.registerImporter('commerce_layouts.twoColumn', () => import('./layouts/two-column'))
}

// _app/index.jsx
import {initializeRegistry} from './page-designer/registry'
initializeRegistry()  // At module level, not in useEffect

// page-viewer.jsx
import {Page} from '@salesforce/commerce-sdk-react/components'

function PageViewer({pageData}) {
    return <Page page={pageData} />
}

// two-column.jsx
import {Region} from '@salesforce/commerce-sdk-react/components'

function TwoColumn({component}) {
    return (
        <div>
            <Region component={component} regionId="left" />
            <Region component={component} regionId="right" />
        </div>
    )
}
```

## Troubleshooting

### Components Not Rendering

1. Verify `initializeRegistry()` is called on app startup
2. Check that component type IDs match exactly (case-sensitive)
3. Ensure components have a default export

### Region Not Found

1. Verify `regionId` matches the region ID in your page data
2. For nested regions, pass `component` not `page`
3. Use `errorElement` prop to handle missing regions gracefully

### Visual Editing Not Working

1. Ensure `PageDesignerProvider` wraps your content
2. Verify `targetOrigin` matches your Business Manager URL
3. Check browser console for postMessage errors
