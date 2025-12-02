# PWA Kit Project Navigation Guide

## 📁 Project Structure Overview

This is a **React-based PWA Kit** project (not traditional MVC). The architecture follows a component-based pattern with hooks for business logic.

```
packages/template-retail-react-app/
├── app/                    # Main application code
│   ├── components/         # Reusable UI components (Views)
│   ├── pages/             # Page-level components (Route handlers)
│   ├── hooks/             # Business logic & data fetching (Controllers/Models)
│   ├── utils/             # Helper functions
│   ├── routes.jsx         # Route definitions
│   ├── ssr.js             # Server-side handlers
│   └── config/             # Configuration files
└── config/                 # Environment configs
```

---

## 🎨 Finding UI/View Code

### **1. Page Components (Route-Level Views)**
**Location:** `app/pages/`

Each route has its own page component:
- `app/pages/login/index.jsx` - Login page
- `app/pages/home/index.jsx` - Homepage
- `app/pages/cart/index.jsx` - Shopping cart
- `app/pages/checkout/` - Checkout flow
- `app/pages/account/` - Account pages
- `app/pages/product-detail/` - Product detail page
- `app/pages/product-list/` - Product listing/search

**How to find:** Check `app/routes.jsx` to see which component maps to which URL path.

### **2. Reusable UI Components**
**Location:** `app/components/`

Organized by feature/functionality:
- `app/components/login/` - Login-related components
- `app/components/header/` - Header component
- `app/components/footer/` - Footer component
- `app/components/product-tile/` - Product display components
- `app/components/forms/` - Form components
- `app/components/shared/` - Shared UI components (107 files!)

**Naming Convention:** Components use kebab-case (e.g., `product-tile`, `login-form`)

### **3. Special Components (Underscore Prefix)**
**Location:** `app/components/_*`

These are PWA Kit special components:
- `app/components/_app-config/` - App-wide configuration (theme, providers)
- `app/components/_app/` - Root layout (header, footer, persistent UI)
- `app/components/_error/` - Error page component

---

## 🔧 Finding Business Logic (Models/Controllers)

### **1. Custom Hooks (Business Logic)**
**Location:** `app/hooks/`

Hooks contain business logic, data fetching, and state management:

**Data Fetching Hooks:**
- `use-current-basket.js` - Shopping cart data
- `use-current-customer.js` - Customer data
- `use-product-inventory.js` - Product inventory
- `use-wish-list.js` - Wishlist operations

**Feature Hooks:**
- `use-add-to-cart-modal.js` - Add to cart logic
- `use-auth-modal.js` - Authentication logic
- `use-navigation.js` - Navigation helpers
- `use-einstein.js` - Einstein recommendations
- `use-datacloud.js` - Data Cloud integration
- `use-multiship.js` - Multi-shipment logic
- `use-store-locator.js` - Store locator logic

**Utility Hooks:**
- `use-currency.js` - Currency handling
- `use-variant.js` - Product variant selection
- `use-search-params.js` - URL query params

**How to find:** Look for `use-*` files in `app/hooks/`. Each hook typically handles one feature domain.

### **2. Commerce SDK Hooks (API Integration)**
**Location:** `@salesforce/commerce-sdk-react` (external package)

These hooks handle Commerce Cloud API calls:
- `useShopperBaskets` - Basket operations
- `useShopperProducts` - Product data
- `useShopperCustomers` - Customer operations
- `useShopperSearch` - Search functionality
- `useAuthHelper` - Authentication

**Usage Example:**
```jsx
import {useShopperBaskets, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
```

### **3. Utility Functions**
**Location:** `app/utils/`

Helper functions for common operations:
- `app/utils/product-utils.js` - Product-related helpers
- `app/utils/address-utils.js` - Address validation/formatting
- `app/utils/url.js` - URL manipulation
- `app/utils/image.js` - Image handling
- `app/utils/routes-utils.js` - Route helpers

---

## 🛣️ Finding Route Handlers

### **Route Definitions**
**Location:** `app/routes.jsx`

This file maps URL paths to page components:

```jsx
export const routes = [
    {path: '/', component: Home},
    {path: '/login', component: Login},
    {path: '/cart', component: Cart},
    {path: '/product/:productId', component: ProductDetail},
    // ... more routes
]
```

**How to find a route:**
1. Open `app/routes.jsx`
2. Find the path you're looking for
3. See which component handles it
4. Navigate to `app/pages/[component-name]/`

---

## 🔌 Finding Handler Functions

### **1. Server-Side Handlers (Express Routes)**
**Location:** `app/ssr.js`

This file contains Express.js route handlers for server-side operations:

**Key Sections:**
- **Options Configuration** (lines 31-112): Server config, port, protocol
- **Route Handlers** (lines 345-432): Express routes for:
  - `/callback` - SLAS callback
  - `/:shortCode/:tenantId/oauth2/jwks` - JWKS endpoint
  - `/passwordless-login-callback` - Passwordless login
  - `/reset-password-callback` - Password reset
  - `/robots.txt`, `/favicon.ico` - Static files
  - `*` - Catch-all for SSR rendering

**Example Handler:**
```javascript
app.post(resetPasswordCallback, (req, res) => {
    const slasCallbackToken = req.headers['x-slas-callback-token']
    validateSlasCallbackToken(slasCallbackToken).then(() => {
        sendMagicLinkEmail(...)
    })
})
```

### **2. Request Processor**
**Location:** `app/request-processor.js`

Handles request processing logic for SSR.

### **3. API Handlers (Client-Side)**
**Location:** Custom hooks in `app/hooks/` or Commerce SDK hooks

API calls are typically made through:
- **React Query hooks** from `@salesforce/commerce-sdk-react`
- **Custom hooks** in `app/hooks/` that wrap API calls
- **Custom mutations** using `useCustomMutation` or `useCustomQuery`

**Example:**
```jsx
// In a component or hook
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'

const {mutate: updateBasket} = useShopperBasketsMutation()
```

---

## 🔍 Quick Navigation Tips

### **Finding Code by Feature:**

1. **Login/Authentication:**
   - UI: `app/pages/login/index.jsx`
   - Components: `app/components/login/`, `app/components/forms/`
   - Logic: `app/hooks/use-auth-modal.js`
   - Handlers: `app/ssr.js` (passwordless/reset callbacks)

2. **Shopping Cart:**
   - UI: `app/pages/cart/index.jsx`
   - Components: `app/components/product-item/`, `app/components/order-summary/`
   - Logic: `app/hooks/use-current-basket.js`, `app/hooks/use-add-to-cart-modal.js`
   - Utils: `app/utils/add-to-cart-utils.js`

3. **Product Display:**
   - UI: `app/pages/product-detail/index.jsx`, `app/pages/product-list/index.jsx`
   - Components: `app/components/product-view/`, `app/components/product-tile/`
   - Logic: `app/hooks/use-variant.js`, `app/hooks/use-product-inventory.js`
   - Utils: `app/utils/product-utils.js`

4. **Checkout:**
   - UI: `app/pages/checkout/` (multiple files)
   - Components: `app/components/multiship/`, `app/components/address-display/`
   - Logic: `app/hooks/use-multiship.js`, `app/hooks/use-shipment-operations.js`
   - Utils: `app/utils/shipment-utils.js`, `app/utils/address-utils.js`

### **Finding Code by File Type:**

- **Components (UI):** `app/components/` or `app/pages/`
- **Business Logic:** `app/hooks/`
- **API Calls:** `app/hooks/` or `@salesforce/commerce-sdk-react`
- **Helpers:** `app/utils/`
- **Routes:** `app/routes.jsx`
- **Server Handlers:** `app/ssr.js`
- **Config:** `app/config/` or `config/`

### **Using Search:**

1. **Semantic Search:** Use Cursor's codebase search for concepts:
   - "How does login work?"
   - "Where is basket data fetched?"
   - "How are products displayed?"

2. **Grep Search:** Use exact string matching:
   - Search for function names: `grep "functionName"`
   - Search for imports: `grep "from '@salesforce/commerce-sdk-react'"`
   - Search for routes: `grep "path: '/login'"`

---

## 📚 Key Architecture Patterns

### **Component Structure:**
```
Page Component (app/pages/)
  ├── Uses UI Components (app/components/)
  ├── Uses Custom Hooks (app/hooks/)
  ├── Uses Commerce SDK Hooks (@salesforce/commerce-sdk-react)
  └── Uses Utils (app/utils/)
```

### **Data Flow:**
```
User Action → Component → Hook → Commerce SDK → API → Response → State Update → UI Re-render
```

### **File Naming Conventions:**
- Components: `kebab-case.jsx` (e.g., `product-tile.jsx`)
- Hooks: `use-kebab-case.js` (e.g., `use-current-basket.js`)
- Utils: `kebab-case.js` (e.g., `product-utils.js`)
- Special components: `_underscore-prefix/` (e.g., `_app-config/`)

---

## 🎯 Common Tasks & Where to Find Code

| Task | Location |
|------|----------|
| Add a new page | `app/pages/` + add route in `app/routes.jsx` |
| Create reusable UI component | `app/components/` |
| Add business logic | `app/hooks/` |
| Make API call | Use Commerce SDK hooks or create custom hook |
| Add server endpoint | `app/ssr.js` (Express routes) |
| Add utility function | `app/utils/` |
| Configure app | `app/config/` or `config/default.js` |
| Modify theme | `app/theme/` |
| Add translations | `app/static/translations/` or `translations/` |

---

## 💡 Pro Tips

1. **Start with routes.jsx** - This shows you all available pages and their components
2. **Follow the import chain** - Components import hooks, hooks import utils
3. **Check Commerce SDK docs** - For API-related hooks: `@salesforce/commerce-sdk-react`
4. **Look for test files** - `.test.js` files show usage examples
5. **Use the hooks index** - `app/hooks/index.js` may export commonly used hooks

---

## 📖 Additional Resources

- **PWA Kit Docs:** https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/overview
- **Commerce SDK React:** Check `packages/commerce-sdk-react/README.md`
- **Project README:** `packages/template-retail-react-app/README.md`

