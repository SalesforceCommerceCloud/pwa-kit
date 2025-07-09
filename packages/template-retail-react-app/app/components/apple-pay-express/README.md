# Apple Pay Express "Buy Now" Integration

This component supports two modes of operation:

## 1. Standard Checkout Flow (Existing)
Uses the user's main basket for Apple Pay Express checkout.

```jsx
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express'

// Standard checkout flow - no sku prop
<ApplePayExpress />
```

## 2. Buy Now Flow (New)
Creates a temporary basket for the specific product and processes the checkout without affecting the main basket.

```jsx
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express'

// Buy Now flow - pass the product SKU
<ApplePayExpress sku={productId} />
```

## Integration Options

### 1. Product Detail Pages (Direct Integration)

The component has been integrated into the ProductView component and will automatically appear on product detail pages for single products (not bundles or sets).

#### How it works:

1. **Component Invocation**: When a `sku` prop is provided, the component operates in "Buy Now" mode
2. **Temporary Basket Creation**: On Apple Pay button click, a temporary basket is created with the specified product
3. **Checkout Processing**: All subsequent operations (shipping, payment) use the temporary basket
4. **No Impact on Main Basket**: The user's main shopping cart remains unchanged

### 2. Express Component (iframe Integration)

The Express component (`app/components/express/index.jsx`) can be used in iframe contexts for "Buy Now" functionality.

#### iframe Usage for "Buy Now"
```html
<!-- Embed the express component in an iframe with SKU parameter -->
<iframe src="/express?sku=green-umbrella-variant-1" width="300" height="60"></iframe>

<!-- Alternative parameter name -->
<iframe src="/express?productId=green-umbrella-variant-1" width="300" height="60"></iframe>
```

#### URL Parameters for Express Component
- `sku`: The product SKU for "Buy Now" flow
- `productId`: Alternative parameter name for the product SKU
- If no SKU parameters are provided, falls back to standard checkout flow

#### Express Component Integration
```jsx
// The Express component automatically detects the SKU from URL parameters
// and passes it to the ApplePayExpress component

// Example URL: /express?sku=green-umbrella-variant-1
// Results in: <ApplePayExpress sku="green-umbrella-variant-1" />

// Example URL: /express (no parameters)
// Results in: <ApplePayExpress /> (standard checkout flow)
```

### Backend Requirements

The implementation uses the official Salesforce Commerce API for creating temporary baskets:

```
POST /mobify/proxy/api/checkout/shopper-baskets/v2/organizations/{organizationId}/baskets?siteId={siteId}&temporary=true
```

**API Reference:** [Salesforce Commerce API - createBasket](https://developer.salesforce.com/docs/commerce/commerce-api/references/shopper-baskets-v2?meta=createBasket)

**Request Body:**
```json
{
    "productItems": [
        {
            "productId": "PRODUCT_SKU", 
            "quantity": 1
        }
    ]
}
```

**Key Features:**
- Uses the `temporary=true` query parameter to create temporary baskets
- Leverages the official Salesforce Commerce Cloud API
- Automatically retrieves `organizationId` from the PWA Kit configuration
- Automatically handles tax calculation, pricing, and basket initialization
- Returns a full basket object compatible with existing checkout flows

### Key Features

- **Automatic SKU Detection**: The ProductView component automatically passes the current product's SKU
- **Conditional Rendering**: Only shows for single products (not bundles, sets, or product updates)
- **State Management**: Maintains separate state for temporary basket vs. main basket
- **Error Handling**: Gracefully handles temporary basket creation failures
- **Shipping Integration**: Supports shipping address and method selection with temporary basket

### Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sku` | string | No | Product SKU for "Buy Now" mode. If provided, creates temporary basket |

### Usage Examples

#### Product Detail Page Integration (Automatic)
The component is automatically integrated into ProductView and will appear on product detail pages.

#### Manual Integration
```jsx
// In a product detail page component
import {ApplePayExpress} from '@salesforce/retail-react-app/app/components/apple-pay-express'

const ProductDetailPage = () => {
    const {productId} = useParams()
    const {data: product} = useProduct({parameters: {id: productId}})
    
    return (
        <div>
            {/* Other product details */}
            <ApplePayExpress sku={product?.id} />
        </div>
    )
}
```

#### iframe Integration Examples
```html
<!-- For "Buy Now" flow -->
<iframe 
    src="/express?sku=green-umbrella-variant-1" 
    width="300" 
    height="60"
    title="Apple Pay Express Checkout">
</iframe>

<!-- For standard checkout flow -->
<iframe 
    src="/express" 
    width="300" 
    height="60"
    title="Apple Pay Express Checkout">
</iframe>
```

#### Dynamic iframe Integration
```javascript
// Example: Embed express checkout based on current product
const productId = getCurrentProductId()
const iframeUrl = productId ? `/express?sku=${productId}` : '/express'

document.getElementById('apple-pay-container').innerHTML = `
    <iframe 
        src="${iframeUrl}" 
        width="300" 
        height="60"
        title="Apple Pay Express Checkout">
    </iframe>
`
```

### Error Handling

The component includes comprehensive error handling:

- **Temporary Basket Creation Failure**: Shows unavailable message
- **Missing Order Total**: Prevents display of invalid pricing
- **API Errors**: Gracefully handles network and server errors
- **User Cancellation**: Properly handles user canceling the Apple Pay flow

### Security Considerations

- Uses the same authentication and authorization as the main checkout flow
- Temporary baskets are created with the same security context as regular baskets
- No sensitive data is stored in component state beyond the temporary basket response

### Testing

The component maintains backward compatibility with existing tests while adding new functionality. All existing Apple Pay Express tests continue to pass. 