Note: This components catalog file uses the subset of markdown parsable by catalogAsJson.

### App

Top-level application component that provides layout structure (header, footer, navigation), authentication modals, internationalization, currency management, and shopping cart functionality. Use for wrapping the entire application

```javascript
import App from '@salesforce/retail-react-app/app/components/_app'

function MyComponent() {
  return (
    <App>
      {/* Your page content */}
    </App>
  )
}
```

### AppConfig

Configuration wrapper component for app-wide settings, theme providers, and state management. Use for initializing global application configuration

```javascript
import AppConfig from '@salesforce/retail-react-app/app/components/_app-config'

function MyComponent() {
  return (
    <AppConfig>
      {/* Your app components */}
    </AppConfig>
  )
}
```

### Error

Error boundary component that displays 404 or error pages when page/data not found or errors occur. Use for error handling in routing

```javascript
import Error from '@salesforce/retail-react-app/app/components/_error'

function MyComponent() {
  return <Error status={404} />
}
```

### ActionCard

Card component for displaying actionable items. Use for creating interactive card interfaces

```javascript
import ActionCard from '@salesforce/retail-react-app/app/components/action-card'

function MyComponent() {
  return (
    <ActionCard title="Card Title">
      {/* Card content */}
    </ActionCard>
  )
}
```

### AddressDisplay

Component for displaying formatted address information. Use for showing customer addresses in account pages, checkout, and order confirmations

```javascript
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'

function MyComponent() {
  const address = {
    firstName: 'John',
    lastName: 'Doe',
    address1: '123 Main St',
    city: 'San Francisco',
    stateCode: 'CA',
    postalCode: '94105'
  }
  return <AddressDisplay address={address} />
}
```

### BasicTile

Basic tile component for displaying grid items. Use for creating simple tile-based layouts

```javascript
import BasicTile from '@salesforce/retail-react-app/app/components/basic-tile'

function MyComponent() {
  return (
    <BasicTile>
      {/* Tile content */}
    </BasicTile>
  )
}
```

### BonusProductViewModal

Modal component for selecting bonus products during promotions. Use when implementing bonus product selection in cart/checkout

```javascript
import BonusProductViewModal from '@salesforce/retail-react-app/app/components/bonus-product-view-modal'

function MyComponent() {
  return (
    <BonusProductViewModal
      isOpen={true}
      onClose={() => {}}
      bonusProducts={products}
    />
  )
}
```

### Breadcrumb

Navigation breadcrumb component that displays category hierarchy. Use for product detail pages, category pages to show navigation path

```javascript
import Breadcrumb from '@salesforce/retail-react-app/app/components/breadcrumb'

function MyComponent() {
  const categories = [
    { id: '1', name: 'Electronics' },
    { id: '2', name: 'Computers' }
  ]
  return <Breadcrumb categories={categories} />
}
```

### ConfirmationModal

Reusable confirmation dialog with customizable actions. Use for delete confirmations, logout confirmations, or any action requiring user confirmation

```javascript
import ConfirmationModal from '@salesforce/retail-react-app/app/components/confirmation-modal'

function MyComponent() {
  return (
    <ConfirmationModal
      isOpen={true}
      onClose={() => {}}
      onPrimaryAction={() => console.log('Confirmed')}
      onAlternateAction={() => console.log('Cancelled')}
    />
  )
}
```

### DisplayPrice

Component for displaying product prices with support for sale prices, list prices, and price ranges. Use for showing product prices on product tiles, product detail pages

```javascript
import DisplayPrice from '@salesforce/retail-react-app/app/components/display-price'

function MyComponent() {
  const priceData = {
    currentPrice: 29.99,
    listPrice: 39.99,
    isOnSale: true
  }
  return <DisplayPrice priceData={priceData} currency="USD" />
}
```

### DrawerMenu

Mobile navigation drawer with category navigation, account links, and locale selector. Use for mobile header navigation

```javascript
import {DrawerMenu} from '@salesforce/retail-react-app/app/components/drawer-menu'

function MyComponent() {
  return (
    <DrawerMenu
      isOpen={true}
      onClose={() => {}}
      root={categoriesTree}
      itemsKey="categories"
    />
  )
}
```

### DynamicImage

Responsive image component optimized for Dynamic Imaging Service with support for multiple breakpoints and lazy loading. Use for product images, hero images requiring responsive behavior

```javascript
import DynamicImage from '@salesforce/retail-react-app/app/components/dynamic-image'

function MyComponent() {
  return (
    <DynamicImage
      src="image.jpg[?sw={width}&q=60]"
      widths={{ base: '100vw', lg: '500px' }}
      imageProps={{ alt: 'Product image', loading: 'lazy' }}
    />
  )
}
```

### EmailConfirmation

Component for email confirmation workflows. Use for post-registration email verification flows

```javascript
import EmailConfirmation from '@salesforce/retail-react-app/app/components/email-confirmation'

function MyComponent() {
  return <EmailConfirmation email="user@example.com" />
}
```

### Field

Form field component with validation support for text, password, email, select, checkbox inputs. Use for building forms with react-hook-form

```javascript
import Field from '@salesforce/retail-react-app/app/components/field'
import { useForm } from 'react-hook-form'

function MyComponent() {
  const { control, formState: { errors } } = useForm()
  return (
    <Field
      name="email"
      label="Email"
      type="email"
      control={control}
      error={errors.email}
    />
  )
}
```

### Footer

Site footer with links, newsletter signup, social icons, and locale selector. Use as the main footer across all pages

```javascript
import Footer from '@salesforce/retail-react-app/app/components/footer'

function MyComponent() {
  return <Footer />
}
```

### Header

Site header with logo, search, navigation, account menu, wishlist, and cart icons. Use as the main header across all pages

```javascript
import Header from '@salesforce/retail-react-app/app/components/header'

function MyComponent() {
  return (
    <Header
      onMenuClick={() => {}}
      onLogoClick={() => {}}
      onMyCartClick={() => {}}
      onMyAccountClick={() => {}}
    />
  )
}
```

### Hero

Hero banner component with title, image, and action buttons. Use for homepage heroes, promotional banners, landing page headers

```javascript
import Hero from '@salesforce/retail-react-app/app/components/hero'
import { Button } from '@chakra-ui/react'

function MyComponent() {
  return (
    <Hero
      title="Welcome to Our Store"
      img={{ src: '/hero.jpg', alt: 'Hero image' }}
      actions={<Button>Shop Now</Button>}
    />
  )
}
```

### Icons

Collection of SVG icon components including AccountIcon, BasketIcon, HeartIcon, SearchIcon, etc. Use for consistent iconography throughout the application

```javascript
import { AccountIcon, BasketIcon, HeartIcon } from '@salesforce/retail-react-app/app/components/icons'

function MyComponent() {
  return (
    <>
      <AccountIcon boxSize={6} />
      <BasketIcon boxSize={6} />
      <HeartIcon boxSize={6} />
    </>
  )
}
```

### Image

Performance-optimized image component with preloading support for high-priority images. Use for product images and important visual content

```javascript
import Image from '@salesforce/retail-react-app/app/components/image'

function MyComponent() {
  return (
    <Image
      src="product.jpg"
      alt="Product"
      loading="eager"
    />
  )
}
```

### ImageGallery

Product image gallery with thumbnails and hero image display. Use for product detail pages to show product images

```javascript
import ImageGallery from '@salesforce/retail-react-app/app/components/image-gallery'

function MyComponent() {
  return (
    <ImageGallery
      imageGroups={product.imageGroups}
      selectedVariationAttributes={{ color: 'red' }}
    />
  )
}
```

### Island

Component for controlling partial hydration behavior with strategies like 'load', 'idle', 'visible'. Use for performance optimization of non-critical UI sections

```javascript
import Island from '@salesforce/retail-react-app/app/components/island'

function MyComponent() {
  return (
    <Island hydrateOn="visible">
      {/* Components that should hydrate when visible */}
    </Island>
  )
}
```

### ItemVariant

Provider and components for displaying cart item details including image, name, attributes, and price. Use in cart and checkout pages

```javascript
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'

function MyComponent() {
  return (
    <ItemVariantProvider variant={product}>
      <CartItemVariantImage />
      <CartItemVariantName />
    </ItemVariantProvider>
  )
}
```

### Link

Enhanced link component that integrates React Router with Chakra UI styling and multi-site URL building. Use instead of standard anchor tags for internal navigation

```javascript
import Link from '@salesforce/retail-react-app/app/components/link'

function MyComponent() {
  return (
    <Link to="/products" color="blue.600">
      View Products
    </Link>
  )
}
```

### LinksList

Component for rendering lists of links with optional heading in vertical or horizontal layouts. Use in footers, navigation menus

```javascript
import LinksList from '@salesforce/retail-react-app/app/components/links-list'

function MyComponent() {
  const links = [
    { href: '/about', text: 'About Us' },
    { href: '/contact', text: 'Contact' }
  ]
  return <LinksList heading="Company" links={links} variant="vertical" />
}
```

### ListMenu

Desktop horizontal navigation menu with category dropdowns. Use for desktop header navigation

```javascript
import { ListMenu } from '@salesforce/retail-react-app/app/components/list-menu'

function MyComponent() {
  return (
    <ListMenu
      root={categoriesTree}
      itemsKey="categories"
    />
  )
}
```

### LoadingSpinner

Full-screen loading spinner overlay. Use for blocking UI during async operations

```javascript
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'

function MyComponent() {
  return <LoadingSpinner />
}
```

### LocaleSelector

Accordion-based locale/language selector with flag icons. Use in header or footer for multi-locale support

```javascript
import LocaleSelector from '@salesforce/retail-react-app/app/components/locale-selector'

function MyComponent() {
  return (
    <LocaleSelector
      selectedLocale="en-US"
      locales={['en-US', 'fr-FR', 'de-DE']}
      onSelect={(locale) => console.log(locale)}
    />
  )
}
```

### LocaleText

Component for displaying localized locale names. Use with LocaleSelector for showing language names

```javascript
import LocaleText from '@salesforce/retail-react-app/app/components/locale-text'

function MyComponent() {
  return <LocaleText shortCode="en-US" />
}
```

### Login

Login form component with email/password fields and social login options. Use in authentication modal or login page

```javascript
import Login from '@salesforce/retail-react-app/app/components/login'
import { useForm } from 'react-hook-form'

function MyComponent() {
  const form = useForm()
  return (
    <Login
      form={form}
      submitForm={(data) => console.log(data)}
      handleForgotPasswordClick={() => {}}
    />
  )
}
```

### MultishipOrderSummary

Order summary component for multi-ship orders. Use in checkout for orders shipping to multiple addresses

```javascript
import MultishipOrderSummary from '@salesforce/retail-react-app/app/components/multiship'

function MyComponent() {
  return <MultishipOrderSummary basket={basket} />
}
```

### NestedAccordion

Recursive accordion component for hierarchical navigation structures. Use for category trees, nested menus

```javascript
import NestedAccordion from '@salesforce/retail-react-app/app/components/nested-accordion'

function MyComponent() {
  return (
    <NestedAccordion
      item={categoriesTree}
      itemsKey="categories"
      urlBuilder={(item) => `/category/${item.id}`}
    />
  )
}
```

### OfflineBanner

Alert banner indicating offline browsing mode. Use at top of page when network connectivity is lost

```javascript
import OfflineBanner from '@salesforce/retail-react-app/app/components/offline-banner'

function MyComponent() {
  return <OfflineBanner />
}
```

### OfflineBoundary

Boundary component for handling offline state. Use to wrap content that should behave differently when offline

```javascript
import OfflineBoundary from '@salesforce/retail-react-app/app/components/offline-boundary'

function MyComponent() {
  return (
    <OfflineBoundary isOnline={true}>
      {/* Content */}
    </OfflineBoundary>
  )
}
```

### OrderSummary

Order summary with subtotal, shipping, tax, promotions, and total. Use in cart, checkout, and order confirmation pages

```javascript
import OrderSummary from '@salesforce/retail-react-app/app/components/order-summary'

function MyComponent() {
  return (
    <OrderSummary
      basket={basket}
      showPromoCodeForm={true}
      showCartItems={true}
    />
  )
}
```

### PageActionPlaceHolder

Placeholder component for page actions. Use during loading states

```javascript
import PageActionPlaceHolder from '@salesforce/retail-react-app/app/components/page-action-placeholder'

function MyComponent() {
  return <PageActionPlaceHolder />
}
```

### Pagination

Pagination controls with previous/next buttons and page dropdown. Use for product listing pages, search results

```javascript
import Pagination from '@salesforce/retail-react-app/app/components/pagination'

function MyComponent() {
  const urls = ['/page/1', '/page/2', '/page/3']
  return <Pagination urls={urls} currentURL="/page/1" />
}
```

### PasswordlessLogin

Passwordless login component using email verification codes. Use for modern authentication flows

```javascript
import PasswordlessLogin from '@salesforce/retail-react-app/app/components/passwordless-login'
import { useForm } from 'react-hook-form'

function MyComponent() {
  const form = useForm()
  return <PasswordlessLogin form={form} />
}
```

### PickupOrDelivery

Component for selecting between pickup in store or delivery options. Use in product detail and checkout

```javascript
import PickupOrDelivery from '@salesforce/retail-react-app/app/components/pickup-or-delivery'

function MyComponent() {
  return (
    <PickupOrDelivery
      pickupInStore={false}
      setPickupInStore={(value) => {}}
    />
  )
}
```

### ProductItem

Product line item component for cart display. Use in shopping cart pages

```javascript
import ProductItem from '@salesforce/retail-react-app/app/components/product-item'

function MyComponent() {
  return <ProductItem product={cartItem} />
}
```

### ProductItemList

List wrapper for product items in cart. Use for displaying cart items

```javascript
import ProductItemList from '@salesforce/retail-react-app/app/components/product-item-list'

function MyComponent() {
  return <ProductItemList items={cartItems} />
}
```

### ProductScroller

Horizontal scrolling product carousel with navigation controls. Use for recommended products, recently viewed items

```javascript
import ProductScroller from '@salesforce/retail-react-app/app/components/product-scroller'

function MyComponent() {
  return (
    <ProductScroller
      title="Recommended Products"
      products={products}
      isLoading={false}
    />
  )
}
```

### ProductTile

Product card component with image, name, price, swatches, and wishlist functionality. Use in product listing pages, search results

```javascript
import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'

function MyComponent() {
  return (
    <ProductTile
      product={product}
      enableFavourite={true}
      onFavouriteToggle={(isFav) => {}}
    />
  )
}
```

### ProductView

Comprehensive product detail view with image gallery, variants, quantity selector, add to cart/wishlist. Use on product detail pages

```javascript
import ProductView from '@salesforce/retail-react-app/app/components/product-view'

function MyComponent() {
  return (
    <ProductView
      product={product}
      category={categories}
      addToCart={(items) => {}}
      addToWishlist={(product) => {}}
    />
  )
}
```

### ProductViewModal

Modal for quick product view. Use for quick-view functionality on product listing pages

```javascript
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal'

function MyComponent() {
  return (
    <ProductViewModal
      isOpen={true}
      onClose={() => {}}
      product={product}
    />
  )
}
```

### PromoCode

Promo code input field with apply/remove functionality. Use in cart and checkout

```javascript
import { PromoCode, usePromoCode } from '@salesforce/retail-react-app/app/components/promo-code'

function MyComponent() {
  const promoCodeProps = usePromoCode()
  return <PromoCode {...promoCodeProps} />
}
```

### PromoPopover

Popover component for displaying promotion details. Use for showing promo information tooltips

```javascript
import PromoPopover from '@salesforce/retail-react-app/app/components/promo-popover'

function MyComponent() {
  return (
    <PromoPopover>
      <div>Promotion details</div>
    </PromoPopover>
  )
}
```

### QuantityPicker

Number input with increment/decrement buttons for product quantity selection. Use in product detail, cart pages

```javascript
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'

function MyComponent() {
  return (
    <QuantityPicker
      value={1}
      min={1}
      max={10}
      onChange={(stringVal, numVal) => console.log(numVal)}
    />
  )
}
```

### RadioCard

Radio button styled as a card. Use for shipping method selection, payment method selection

```javascript
import RadioCard from '@salesforce/retail-react-app/app/components/radio-card'

function MyComponent() {
  return <RadioCard value="option1">Option 1</RadioCard>
}
```

### RecommendedProducts

Component for displaying Einstein-powered product recommendations. Use for showing personalized recommendations

```javascript
import RecommendedProducts from '@salesforce/retail-react-app/app/components/recommended-products'

function MyComponent() {
  return (
    <RecommendedProducts
      recommender="product-detail-recommendations"
    />
  )
}
```

### Register

User registration form with validation. Use in authentication modal or registration page

```javascript
import Register from '@salesforce/retail-react-app/app/components/register'
import { useForm } from 'react-hook-form'

function MyComponent() {
  const form = useForm()
  return (
    <Register
      form={form}
      submitForm={(data) => {}}
      clickSignIn={() => {}}
    />
  )
}
```

### ResetPassword

Password reset form with email input. Use for forgot password flow

```javascript
import ResetPassword from '@salesforce/retail-react-app/app/components/reset-password'
import { useForm } from 'react-hook-form'

function MyComponent() {
  const form = useForm()
  return (
    <ResetPassword
      form={form}
      submitForm={(data) => {}}
    />
  )
}
```

### Responsive

Utility components HideOnDesktop and HideOnMobile for responsive visibility control. Use for showing/hiding content based on screen size

```javascript
import { HideOnDesktop, HideOnMobile } from '@salesforce/retail-react-app/app/components/responsive'

function MyComponent() {
  return (
    <>
      <HideOnDesktop>Mobile content</HideOnDesktop>
      <HideOnMobile>Desktop content</HideOnMobile>
    </>
  )
}
```

### ScrollToTop

Component that scrolls viewport to top on route change. Use in app layout for better UX on navigation

```javascript
import ScrollToTop from '@salesforce/retail-react-app/app/components/scroll-to-top'

function MyComponent() {
  return <ScrollToTop />
}
```

### Search

Search input with suggestions popover showing categories, products, and brands. Use in header for site-wide search

```javascript
import Search from '@salesforce/retail-react-app/app/components/search'

function MyComponent() {
  return (
    <Search
      placeholder="Search for products..."
      aria-label="Search"
    />
  )
}
```

### Section

Generic section container component. Use for creating consistent page sections

```javascript
import Section from '@salesforce/retail-react-app/app/components/section'

function MyComponent() {
  return (
    <Section>
      {/* Section content */}
    </Section>
  )
}
```

### SelectBonusProductsButton

Button for triggering bonus product selection modal. Use in cart when bonus products are available

```javascript
import SelectBonusProductsButton from '@salesforce/retail-react-app/app/components/select-bonus-products-button'

function MyComponent() {
  return (
    <SelectBonusProductsButton
      onClick={() => {}}
    />
  )
}
```

### Seo

SEO component for managing page title, description, meta tags using react-helmet. Use on every page for SEO optimization

```javascript
import Seo from '@salesforce/retail-react-app/app/components/seo'

function MyComponent() {
  return (
    <Seo
      title="Product Name"
      description="Product description"
      keywords="product, keywords"
    />
  )
}
```

### ShopperAgent

Commerce agent integration component for AI-powered shopping assistance. Use when Commerce Agent feature is enabled

```javascript
import ShopperAgent from '@salesforce/retail-react-app/app/components/shopper-agent'

function MyComponent() {
  return (
    <ShopperAgent
      commerceAgentConfiguration={config}
      basketDoneLoading={true}
    />
  )
}
```

### SingleAddressToggleModal

Modal for toggling single/multiple address shipping. Use in checkout for shipping address selection

```javascript
import SingleAddressToggleModal from '@salesforce/retail-react-app/app/components/single-address-toggle-modal'

function MyComponent() {
  return (
    <SingleAddressToggleModal
      isOpen={true}
      onClose={() => {}}
    />
  )
}
```

### SocialIcons

Row of social media icon buttons (Facebook, Twitter, Instagram, etc.). Use in footer or share sections

```javascript
import SocialIcons from '@salesforce/retail-react-app/app/components/social-icons'

function MyComponent() {
  return <SocialIcons variant="flex" />
}
```

### SocialLogin

Social login buttons (Google, Facebook, Apple). Use in login/registration flows for social authentication

```javascript
import SocialLogin from '@salesforce/retail-react-app/app/components/social-login'

function MyComponent() {
  return (
    <SocialLogin
      idps={['Google', 'Facebook']}
    />
  )
}
```

### StandardLogin

Standard email/password login form. Use as alternative to passwordless login

```javascript
import StandardLogin from '@salesforce/retail-react-app/app/components/standard-login'
import { useForm } from 'react-hook-form'

function MyComponent() {
  const form = useForm()
  return (
    <StandardLogin
      form={form}
      handleForgotPasswordClick={() => {}}
    />
  )
}
```

### StoreDisplay

Component for displaying store information. Use in store locator, pickup options

```javascript
import StoreDisplay from '@salesforce/retail-react-app/app/components/store-display'

function MyComponent() {
  return <StoreDisplay store={storeData} />
}
```

### StoreLocator

Store locator modal with map and store list. Use for finding nearby stores for pickup

```javascript
import { StoreLocatorModal } from '@salesforce/retail-react-app/app/components/store-locator'

function MyComponent() {
  return (
    <StoreLocatorModal
      isOpen={true}
      onClose={() => {}}
    />
  )
}
```

### SwatchGroup

Group of color/size swatches for product variant selection. Use in product detail, product tiles for variant options

```javascript
import SwatchGroup from '@salesforce/retail-react-app/app/components/swatch-group'
import Swatch from '@salesforce/retail-react-app/app/components/swatch-group/swatch'

function MyComponent() {
  return (
    <SwatchGroup
      label="Color"
      value="red"
      handleChange={(value) => {}}
    >
      <Swatch value="red" name="Red">Red</Swatch>
      <Swatch value="blue" name="Blue">Blue</Swatch>
    </SwatchGroup>
  )
}
```

### ToggleCard

Toggleable card component. Use for expandable content sections

```javascript
import ToggleCard from '@salesforce/retail-react-app/app/components/toggle-card'

function MyComponent() {
  return (
    <ToggleCard title="Card Title">
      {/* Card content */}
    </ToggleCard>
  )
}
```

### UnavailableProductConfirmationModal

Modal for handling unavailable products in cart. Use when products become out of stock

```javascript
import UnavailableProductConfirmationModal from '@salesforce/retail-react-app/app/components/unavailable-product-confirmation-modal'

function MyComponent() {
  return (
    <UnavailableProductConfirmationModal
      isOpen={true}
      onClose={() => {}}
      unavailableProducts={products}
    />
  )
}
```

### withCommerceSdkReact

HOC for wrapping components with Commerce SDK React data fetching. Use to add data fetching capabilities to components

```javascript
import { withCommerceSdkReact } from '@salesforce/retail-react-app/app/components/with-commerce-sdk-react'
import { useProduct } from '@salesforce/commerce-sdk-react'

const MyComponent = withCommerceSdkReact(
  ({ data }) => <div>{data.name}</div>,
  {
    hook: useProduct,
    queryOptions: { parameters: { id: '12345' } }
  }
)
```

### withRegistration

HOC that wraps components to require user registration/login. Use to protect features requiring authentication

```javascript
import withRegistration from '@salesforce/retail-react-app/app/components/with-registration'
import { Button } from '@chakra-ui/react'

const ProtectedButton = withRegistration(Button)

function MyComponent() {
  return (
    <ProtectedButton onClick={() => {}}>
      Add to Wishlist
    </ProtectedButton>
  )
}
```

### withReactQuery

HOC for adding React Query support to your application with SSR data fetching. Use to wrap your App component for enabling React Query with server-side rendering, automatic dehydration/hydration of query cache

```javascript
import { withReactQuery } from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-react-query'

const MyApp = () => <div>My App</div>

export default withReactQuery(MyApp, {
  queryClientConfig: {
    defaultOptions: {
      queries: { staleTime: 5000 }
    }
  }
})
```

### withLegacyGetProps

HOC for enabling legacy getProps data fetching pattern on App and page components. Use to wrap components that need server-side data fetching via static getProps methods

```javascript
import { withLegacyGetProps } from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-legacy-get-props'

class MyPage extends React.Component {
  static async getProps({ req, res, params, location }) {
    const data = await fetchData()
    return { data }
  }
  render() {
    return <div>{this.props.data}</div>
  }
}

export default withLegacyGetProps(MyPage)
```

### PWAKitApp

Base PWA Kit App component template that provides layout structure. Use as a starting point when creating your custom _app component to wrap all pages

```javascript
import App from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/_app'

function MyComponent() {
  return (
    <App>
      {/* Your application content */}
    </App>
  )
}
```

### PWAKitAppConfig

Base AppConfig component for state management integration (Redux, MobX, etc.). Use to restore/freeze state, inject extra args to getProps, setup context providers. Override this component in your project

```javascript
import AppConfig from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/_app-config'

class MyAppConfig extends AppConfig {
  static restore(locals, frozen) {
    // Restore Redux store from frozen state
  }
  static freeze(locals) {
    // Freeze Redux store to embed in HTML
    return { reduxState: locals.store.getState() }
  }
  static extraGetPropsArgs(locals) {
    return { store: locals.store }
  }
  render() {
    return (
      <Provider store={this.props.locals.store}>
        {this.props.children}
      </Provider>
    )
  }
}
```

### PWAKitError

Base error component for displaying error pages with status, message, stack trace. Use as template for creating custom error pages for 404, 500, and other errors. Override this component in your project

```javascript
import Error from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/_error'

function MyComponent() {
  return (
    <Error
      status={404}
      message="Page not found"
      stack="Error stack trace"
      correlationId="abc-123"
    />
  )
}
```

### PWAKitDocument

Base document component defining HTML structure (html, head, body tags). Use as template for customizing document-level HTML including meta tags, charset, viewport. Override this component in your project for fine-grained control

```javascript
import Document from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/_document'

// This is typically used internally by PWA Kit
// Override by creating app/components/_document/index.jsx in your project
function MyDocument(props) {
  return <Document {...props} />
}
```

### Throw404

Special component used in route config as fallback to trigger 404 error handling. Use as the last route with path='*' to catch all unmatched routes and display 404 error page

```javascript
import Throw404 from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/throw-404'

// In routes.jsx
export default [
  { path: '/products', component: ProductList },
  { path: '/product/:id', component: ProductDetail },
  { path: '*', component: Throw404 }
]
```

### RedirectWithStatus

Redirect component with customizable HTTP status code. Use for permanent redirects (301), temporary redirects (302), or other redirect scenarios requiring specific status codes

```javascript
import RedirectWithStatus from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/redirect-with-status'

function MyComponent() {
  return (
    <RedirectWithStatus
      status={301}
      to="/new-location"
    />
  )
}
```

### FetchStrategy

Base class for implementing custom data fetching strategies. Internal component used by withReactQuery and withLegacyGetProps. Use for creating custom HOCs with data fetching initialization

```javascript
import { FetchStrategy } from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/fetch-strategy'

class MyFetchStrategy extends FetchStrategy {
  static async initAppState(args) {
    // Custom initialization logic
    return { appState: {}, error: undefined }
  }
}
```

### AppErrorBoundary

Error boundary component for catching and displaying React errors at app level. Automatically used by PWA Kit, provides error context for child components, clears errors on navigation

```javascript
import AppErrorBoundary from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/app-error-boundary'

// Typically used internally, but can be used standalone
function MyComponent() {
  return (
    <AppErrorBoundary error={null}>
      {/* Your app content */}
    </AppErrorBoundary>
  )
}
```

### withCorrelationId

HOC that injects correlation ID into component props for request tracing and debugging. Use to track requests across PWA Kit and backend systems

```javascript
import { withCorrelationId } from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/with-correlation-id'

const MyComponent = ({ correlationId, ...props }) => {
  return <div>Request ID: {correlationId}</div>
}

export default withCorrelationId(MyComponent)
```

### Refresh

Internal component for refetching data on client-side with loading spinner. Use by navigating to /__pwa-kit/refresh?referrer=<url> to invalidate React Query cache and reload page data

```javascript
import { useNavigation } from '@salesforce/retail-react-app/app/hooks/use-navigation'

function MyComponent() {
  const navigate = useNavigation()
  
  const handleRefresh = () => {
    const currentUrl = window.location.pathname
    navigate(`/__pwa-kit/refresh?referrer=${encodeURIComponent(currentUrl)}`, 'replace')
  }
  
  return <button onClick={handleRefresh}>Refresh Data</button>
}
```

### Switch

Internal PWA Kit routing component that wraps React Router Switch with error boundaries and UID context. Automatically used by PWA Kit, not typically used directly in projects

```javascript
// Internal component - used automatically by PWA Kit
// import Switch from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/switch'
// Not typically imported directly in user code
```

### routeComponent

Internal HOC that adds getProps, shouldGetProps, and getTemplateName support to route components. Automatically applied to all route components by PWA Kit, handles data fetching lifecycle

```javascript
// Internal HOC - automatically applied to route components
// import { routeComponent } from '@salesforce/pwa-kit-react-sdk/ssr/universal/components/route-component'
// Not typically used directly - PWA Kit applies it automatically to routes
```

