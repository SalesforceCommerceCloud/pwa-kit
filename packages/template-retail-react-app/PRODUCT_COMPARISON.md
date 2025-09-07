# Product Comparison Feature

This document describes the product comparison functionality added to the Retail React App.

## Overview

The product comparison feature allows users to:
- Add up to 4 products to a comparison list
- View compared products in a side drawer
- Navigate to a detailed comparison page
- Compare product attributes side by side
- Persist comparison data across browser sessions

## Components

### Core Components

1. **ComparisonProvider** (`app/contexts/comparison-provider.jsx`)
   - Manages global comparison state
   - Handles localStorage persistence
   - Provides comparison context to the app

2. **useComparison Hook** (`app/hooks/use-comparison.js`)
   - Convenient hook for accessing comparison functionality
   - Provides methods for adding/removing products
   - Manages drawer state

3. **CompareButton** (`app/components/compare-button/index.jsx`)
   - Reusable button component for adding/removing products from comparison
   - Available in icon and button variants
   - Provides user feedback via toasts

4. **ComparisonDrawer** (`app/components/comparison-drawer/index.jsx`)
   - Side drawer showing currently compared products
   - Quick access to remove products
   - Navigate to full comparison page

5. **ComparisonBadge** (`app/components/comparison-badge/index.jsx`)
   - Floating badge showing comparison count
   - Quick access to open comparison drawer

6. **ProductComparison Page** (`app/pages/product-comparison/index.jsx`)
   - Full comparison page with detailed product table
   - Responsive design (table on desktop, cards on mobile)
   - Compare product attributes side by side

## Usage

### Enabling Comparison on Product Tiles

```jsx
<ProductTile 
    product={product} 
    enableComparison={true}
    // ... other props
/>
```

### Using the Comparison Hook

```jsx
import {useComparison} from '@salesforce/retail-react-app/app/hooks'

function MyComponent() {
    const {
        comparedProducts,
        addToComparison,
        removeFromComparison,
        isInComparison,
        openDrawer
    } = useComparison()

    // Component logic...
}
```

### Adding Compare Button

```jsx
import CompareButton from '@salesforce/retail-react-app/app/components/compare-button'

<CompareButton 
    product={product}
    variant="button" // or "icon"
    size="md"
/>
```

## Features

### State Management
- Global state managed by ComparisonProvider
- Automatic persistence to localStorage
- Maximum of 4 products can be compared
- Duplicate prevention

### User Experience
- Toast notifications for user feedback
- Floating comparison badge for quick access
- Side drawer for quick product management
- Responsive comparison page

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Screen reader friendly

## API

### ComparisonProvider Props
- `children`: React children to wrap

### useComparison Return Value
- `comparedProducts`: Array of products being compared
- `isDrawerOpen`: Boolean indicating drawer state
- `addToComparison(product)`: Add product to comparison
- `removeFromComparison(productId)`: Remove product from comparison
- `clearComparison()`: Clear all compared products
- `isInComparison(productId)`: Check if product is being compared
- `toggleDrawer()`: Toggle drawer open/closed
- `openDrawer()`: Open comparison drawer
- `closeDrawer()`: Close comparison drawer
- `canCompare`: Boolean indicating if more products can be added
- `hasProducts`: Boolean indicating if there are products to compare
- `count`: Number of products currently being compared

### CompareButton Props
- `product`: Product object (required)
- `variant`: "icon" | "button" (default: "icon")
- `size`: "sm" | "md" | "lg" (default: "md")

## Testing

Unit tests are provided for:
- useComparison hook functionality
- CompareButton component behavior
- State management and persistence

Run tests with:
```bash
npm test -- --testPathPattern=comparison
```

## Routing

The comparison page is available at `/compare` and will redirect to home if no products are selected for comparison.

## Localization

All user-facing text is internationalized using react-intl. Add translations for:
- `comparison_drawer.*`
- `compare_button.*`
- `product_comparison.*`
- `comparison_badge.*`

## Browser Support

The feature uses localStorage for persistence and falls back gracefully if not available. Supports all modern browsers that support the base PWA Kit requirements.
