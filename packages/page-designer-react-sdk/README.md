# Page Designer React SDK

This SDK provides React components and utilities for integrating with Salesforce Commerce Cloud Page Designer. It supports both design mode (for editing components) and preview mode (for viewing published content).

## Features

- **Design Mode**: Edit and configure Page Designer components with visual feedback
- **Preview Mode**: View published content from Page Designer with real-time rendering
- **Combined Modes**: Use both design and preview modes simultaneously
- **Smart Components**: Enhanced components with drag-and-drop and selection capabilities
- **Context Providers**: React contexts for managing design and preview states

## Installation

```bash
npm install @salesforce/page-designer-react-sdk
```

## Quick Start

### 1. Setup Providers

Wrap your app with the `PageDesignerProvider` to enable both design and preview modes:

```jsx
import {PageDesignerProvider} from '@salesforce/page-designer-react-sdk'

function App() {
    return (
        <PageDesignerProvider>
            {/* Your app content */}
        </PageDesignerProvider>
    )
}
```

### 2. Enable Modes via URL Parameters

- **Design Mode**: Add `?design=true` to your URL
- **Preview Mode**: Add `?preview=true` to your URL
- **Combined**: Use both parameters: `?design=true&preview=true`

### 3. Use Preview Mode Renderer

```jsx
import {PreviewModeRenderer} from '@salesforce/page-designer-react-sdk'

function MyPage() {
    return (
        <PreviewModeRenderer
            pageId="my-page-id"
            aspectTypeId="pdp"
            productId="12345"
        >
            {/* Fallback content when not in preview mode */}
            <div>Regular page content</div>
        </PreviewModeRenderer>
    )
}
```

## API Reference

### Context Hooks

#### `usePageDesignerMode()`

Returns the current state of design and preview modes.

```jsx
import {usePageDesignerMode} from '@salesforce/page-designer-react-sdk'

function MyComponent() {
    const {isDesignMode, isPreviewMode, isAnyModeActive} = usePageDesignerMode()
    
    return (
        <div>
            {isDesignMode && <span>Design mode active</span>}
            {isPreviewMode && <span>Preview mode active</span>}
        </div>
    )
}
```

#### `useDesignMode()`

Returns only the design mode context.

```jsx
import {useDesignMode} from '@salesforce/page-designer-react-sdk'

function MyComponent() {
    const designMode = useDesignMode()
    return <div>Design mode: {designMode?.isDesignMode ? 'Active' : 'Inactive'}</div>
}
```

#### `usePreviewMode()`

Returns only the preview mode context.

```jsx
import {usePreviewMode} from '@salesforce/page-designer-react-sdk'

function MyComponent() {
    const previewMode = usePreviewMode()
    return <div>Preview mode: {previewMode?.isPreviewMode ? 'Active' : 'Inactive'}</div>
}
```

### Components

#### `PreviewModeRenderer`

Renders published content from Page Designer when in preview mode.

**Props:**
- `pageId` (string, optional): Direct page ID for preview
- `aspectTypeId` (string, optional): Aspect type for dynamic page resolution
- `productId` (string, optional): Product ID for product-specific pages
- `categoryId` (string, optional): Category ID for category-specific pages
- `aspectAttributes` (string, optional): JSON string of aspect attributes
- `children` (ReactNode): Fallback content when not in preview mode

**Example:**
```jsx
<PreviewModeRenderer
    pageId="homepage"
    aspectTypeId="pdp"
    productId="12345"
    categoryId="mens"
    aspectAttributes='{"category": "mens"}'
>
    <div>Fallback content</div>
</PreviewModeRenderer>
```

#### `PageDesignerProvider`

Combined provider for both design and preview modes.

```jsx
<PageDesignerProvider>
    <YourApp />
</PageDesignerProvider>
```

### Smart Components

Use the `smartComponent` HOC to enhance your components with design mode capabilities:

```jsx
import {smartComponent} from '@salesforce/page-designer-react-sdk'

const MyComponent = (props) => {
    return <div>My Component</div>
}

export default smartComponent(MyComponent)
```

## URL Parameters

### Design Mode
- `?design=true`: Enables design mode for component editing

### Preview Mode
- `?preview=true`: Enables preview mode for viewing published content
- `?pageId=<id>`: Specifies a direct page ID for preview
- `?aspectTypeId=<type>`: Specifies an aspect type for dynamic page resolution
- `?productId=<id>`: Specifies a product ID for product-specific pages
- `?categoryId=<id>`: Specifies a category ID for category-specific pages
- `?aspectAttributes=<json>`: Specifies aspect attributes as JSON string

### Combined Usage
```
https://your-app.com/page?design=true&preview=true&pageId=homepage&aspectTypeId=pdp
```

## Integration with Shopper Experience API

The preview mode integrates with the Salesforce Commerce Cloud Shopper Experience API to fetch and render published content. The `PreviewModeRenderer` component automatically:

1. Detects when preview mode is active
2. Fetches page data from the Shopper Experience API
3. Renders the content using the Page Designer components
4. Shows loading and error states appropriately



## Error Handling

The `PreviewModeRenderer` component handles various error scenarios:

- **No page data**: Shows fallback content
- **API errors**: Displays error message
- **Invalid parameters**: Shows appropriate error state
- **Loading state**: Shows loading indicator

## Examples

### Basic Preview Mode
```jsx
import {PreviewModeRenderer} from '@salesforce/page-designer-react-sdk'

function HomePage() {
    return (
        <PreviewModeRenderer pageId="homepage">
            <div>Welcome to our store!</div>
        </PreviewModeRenderer>
    )
}
```

### Product Page Preview
```jsx
function ProductPage({productId}) {
    return (
        <PreviewModeRenderer
            aspectTypeId="pdp"
            productId={productId}
        >
            <div>Product page content</div>
        </PreviewModeRenderer>
    )
}
```

### Category Page Preview
```jsx
function CategoryPage({categoryId}) {
    return (
        <PreviewModeRenderer
            aspectTypeId="plp"
            categoryId={categoryId}
            aspectAttributes='{"category": "mens"}'
        >
            <div>Category page content</div>
        </PreviewModeRenderer>
    )
}
```

## Development

### Building the Package
```bash
npm run build
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

## License

BSD-3-Clause 