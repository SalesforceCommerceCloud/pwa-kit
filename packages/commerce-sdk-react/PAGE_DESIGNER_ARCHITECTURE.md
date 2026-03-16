# Page Designer Concepts

This document explains the key concepts behind the Page Designer integration for PWA Kit.

## How It Works

```
Business Manager Page Designer
        ↓ (creates JSON)
    Page Data (API)
        ↓ (fetched by)
    PWA Kit App
        ↓ (renders via)
    Page → Region → Component
        ↓ (resolves from)
    Component Registry
```

### Runtime vs Design Mode

The system operates in two modes:

1. **Runtime Mode** (normal browsing)
   - Components render directly from page data
   - No visual editing overhead
   - Optimized for performance

2. **Design Mode** (in Page Designer iframe)
   - Components are decorated for visual editing
   - Click-to-select, drag-and-drop enabled
   - Communicates with Business Manager via postMessage

## Component Hierarchy

### Page

The top-level container that:
- Receives page data from the ShopperExperience API
- Sets up SEO metadata (title, description, keywords)
- Renders top-level regions

### Region

A container for components that:
- Can exist at page level or nested inside layout components
- Finds its components by `regionId`
- Supports fallback and error elements

**Two modes of use:**
```jsx
// Page-level region
<Region page={page} regionId="main" />

// Nested region (inside a layout component)
<Region component={component} regionId="left" />
```

### Component

Resolves and renders individual Page Designer components:
- Looks up the React component from the registry by `typeId`
- Passes component data as props
- Handles lazy loading via Suspense

## Component Registry

The registry is a central place to map Page Designer type IDs to React components.

### Why a Registry?

- **Lazy Loading** - Components load only when needed
- **Code Splitting** - Each component is a separate chunk
- **Decoupling** - Page data doesn't need to know about React components

### How It Works

```
Page Data: { typeId: "commerce_assets.banner", data: {...} }
                    ↓
Registry: "commerce_assets.banner" → () => import('./banner')
                    ↓
React Component: <Banner {...data} />
```

## Visual Editing

When your app runs inside Page Designer's iframe, it enables visual editing.

### PageDesignerProvider

Wraps your app to enable design mode features:

```jsx
<PageDesignerProvider
    clientId="my-storefront"
    targetOrigin="https://business-manager.com"
    mode="EDIT">
    {children}
</PageDesignerProvider>
```

### What It Enables

- **Component Selection** - Click components to select them
- **Visual Indicators** - Borders and overlays show component boundaries
- **Live Updates** - Changes in Page Designer reflect immediately
- **Communication** - postMessage bridge to Business Manager

### Mode Detection

Detect if you're in design mode:

```jsx
import {usePageDesignerMode} from '@salesforce/commerce-sdk-react/components'

function MyComponent() {
    const {isDesignMode, isPreviewMode} = usePageDesignerMode()
    // ...
}
```

Or use utility functions:

```jsx
import {isDesignModeActive, isPreviewModeActive} from '@salesforce/commerce-sdk-react/components'
```

## Data Flow

### Page Data Structure

```typescript
Page
├── id: string
├── pageTitle, pageDescription, pageKeywords
└── regions: Region[]
    └── Region
        ├── id: string
        └── components: Component[]
            └── Component
                ├── id: string
                ├── typeId: string (maps to registry)
                ├── data: {...}  (your component props)
                └── regions?: Region[] (for layouts)
```

### Props Your Components Receive

```jsx
function MyComponent({
    // Your custom attributes from Page Designer
    title,
    image,
    link,
    
    // Automatic props
    designMetadata,  // { id, name, isVisible, isLocalized, isFragment }
    component,       // Full component object
    regionId,        // Parent region's ID
    regions          // Child regions (for layout components)
}) {
    // ...
}
```

## Layout Components

Layout components contain regions that hold other components.

### Example Structure

```
TwoColumnLayout (component)
├── regions.left (region)
│   └── Banner (component)
└── regions.right (region)
    └── ImageTile (component)
```

### Implementing a Layout

```jsx
function TwoColumnLayout({component}) {
    return (
        <div className="two-column">
            <Region component={component} regionId="left" />
            <Region component={component} regionId="right" />
        </div>
    )
}
```

## Performance

### Zero Overhead in Runtime

When not in design mode:
- No design decorators applied
- No postMessage listeners
- Components render directly

### Lazy Loading

Components load on demand:
- Initial bundle stays small
- Each component is a separate chunk
- Suspense handles loading states

### Fallbacks

Provide loading states for better UX:

```jsx
registry.registerImporter(
    'commerce_assets.banner',
    () => import('./banner'),
    () => import('./banner-skeleton')  // Optional fallback
)
```

## Related

- [Migration Guide](./PAGE_DESIGNER.md) - Step-by-step migration instructions
- [Page Designer API](https://developer.salesforce.com/docs/commerce/commerce-api/guide/page-designer.html)
