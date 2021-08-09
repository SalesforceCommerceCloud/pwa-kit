Below is a detailed list of our ready-to-use analytics events and specifications on how to use them. Note that we refer to these events by the constant, as defined in our [types](../analytics-integrations/api/module-types.html) file.

## OFFLINE

Send this event when the Progressive Web App (PWA) goes offline. This event supports the following schema:

| Property  | Type   | Required | Description                     |
|-----------|--------|----------|---------------------------------|
| `startTime` | Number | yes      | The time your site went offline |

Example:

```javascript
import {OFFLINE} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(OFFLINE, {startTime: 123})
```
&nbsp;&nbsp;
 
## PAGEVIEW

Send this event when the user navigates to a different page. This event supports the following schema:

| Property     | Type   | Required | Description                         |
|--------------|--------|----------|-------------------------------------|
| `templateName` | String | yes      | The page name                       |
| `location`     | String | no       | The value of `window.location`        |
| `path`         | String | no       | The path segment of the current url |
| `title`        | String | no       | The title of the page               |

Example:

```javascript
import {PAGEVIEW} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(PAGEVIEW, {
    templateName: 'product-details-page',
    location: asdf,
    path: 'asdf',
    title: 'asdf'
})
```
&nbsp;&nbsp;

## PERFORMANCE

Send this event to record performance metrics whenever a user navigates to the PWA for the first time, refreshes a page, or navigates to a different page. This event supports the following schema:

| Property                            | Type   | Required | Description                               | 
|-------------------------------------|--------|----------|-------------------------------------------| 
| `bundle`                              | String | yes      | The bundle type, such as "production" or "development".    |                         | 
| `page_start`                          | Number | yes      | The time when the user first navigates to the page    | 
| `timing_start`                        | Number | yes      | The time of hard navigation               | 
| `mobify_start`                        | Number | yes      | The time when the Mobify Tag is loaded    | 
| `app_start`                           | Number | yes      | The time to load the Sandy Tracking pixel | 
| `page_paint`                          | Number | yes      | The time to start loading the page        | 
| `full_page_load`                      | Number | yes      | The time to finish loading the page       | 
| `first_paint`                         | Number | yes      | Time of first paint                       | 
| `first_contentful_paint`              | Number | yes      | Time of first contentful paint            | 
| `time_to_interactive`                 | Number | yes      | Time to interactive                       | 

Example:

```javascript
import {PERFORMANCE} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(PERFORMANCE, {
    bundle: 'production',
    page_start: 123
    timing_start: 123,
    mobify_start: 123,
    app_start: 123,
    page_paint: 123,
    full_page_load: 123,
    first_paint: 123,
    first_contentful_paint: 123,
    time_to_interactive: 123
})
```
&nbsp;&nbsp;

## UIINTERACTION

Send this event to record information about a user's interactions with the user interface. The Analytics Manager class has what we call a [DOM-Tracker](../analytics-integrations-overview/#using-the-dom-tracker-and-performance-tracker), which is responsible for sending this event automatically for any Components with the attribute `data-analytics-name`. This event supports the following schema:

| Property | Type   | Required | Description                                                                                             |
|----------|--------|----------|---------------------------------------------------------------------------------------------------------|
| `subject`  | String | yes      | The subject responsible for triggering the UI interaction (For example, “user”, or “app”.)                          |
| `action`   | String | yes      | The UI action (For example, “Focus”, “Change”, “Open”, “Click”, “Blur”, “Close”, “Display”, “Receive”, or “Swipe”.) |
| `object`   | String | yes      | The DOM element name (For example, “Button”, “Input”, “Modal”, or “Element”.)                                       |
| `name`    | String | no       | The name specified for the attribute: `data-analytics-name`                                                    |
| `content`  | String | no       | The DOM element value, or the value given for the attribute: `data-analytics-content`                       |

Example:

```javascript
import {UIINTERACTION} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(UIINTERACTION, {
    subject: ‘user’,
    action: ‘focus’
    object: ‘button’,
    name: ‘menu’,
    content: ‘open’
})
```
&nbsp;&nbsp;

## PRODUCTIMPRESSION

Send this event anytime a user views a product. This event supports the following schema:

| Property | Type   | Required | Description                                                                       |
|----------|--------|----------|-----------------------------------------------------------------------------------|
| `id`       | String | yes      | The product id or SKU                                                             |
| `name`     | String | yes      | The product name                                                                  |
| `category` | String | no       | The product category                                                              |
| `brand`    | String | no       | The product brand                                                                 |
| `variant`  | String | no       | The product variant                                                               |
| `list`     | String | no       | The name of the list from which the user found the product (For example, “search”, or “wishlist”.) |
| `position` | Number | no       | The position of the product in a list                                             |
| `price`    | Number | no       | The price of the product                                                          |
| `quantity` | Number | no       | The quantity of the product selected                                              |
| `coupon`   | String | no       | The coupon code associated with the product                                       |
| `stock`    | Number | no       | The number of this product in stock                                               |
| `size`     | String | no       | The product size                                                                  |
| `color`    | String | no       | The product color                                                                 |

Example:

```javascript

import {PRODUCTIMPRESSION} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(PRODUCTIMPRESSION, {
    id: 'P9807',
    name: 'Mobi T-Shirt',
    category: 'Apparel/Unisex/T-Shirts',
    brand: 'Mobify',
    variant: 'Black',
    list: 'Search',
    position: 2,
    price: 23.95,
    quantity: 1,
    coupon: 'SPRING_SALE19',
    stock: 25,
    size: 'Large',
    color: 'Black'
})
```
&nbsp;&nbsp;

## PURCHASE

Send this event anytime a user purchases a product. This event supports the following schema:

| Property                        | Type   | Required                 | Description                   | 
|---------------------------------|--------|--------------------------|-------------------------------| 
| `transaction`                     | Object | yes                      | A Transaction object. (See **Transaction** below.)         | 
| `products`                        | Array  | yes: minimum length of 1 object | An array of Product objects. (See **Product** below.) | 

### Transaction

| Property    | Type   | Required | Description                                                                                                   |
|-------------|--------|----------|---------------------------------------------------------------------------------------------------------------|
| `id`          | String | yes      | The transaction id                                                                                            |
| `affiliation` | String | no       | The checkout method (For example, “Paypal”, “Apple Pay”, “Web”, or “Google Store”.)                                       |
| `revenue`     | Number | yes      | The grand total of purchase including shipping and tax                                                        |
| `tax`         | Number | no       | The tax on purchase                                                                                           |
| `shipping`    | Number | no       | The shipping charge on purchase                                                                               |
| `list`        | String | no       | The purchase attribution - what affected this purchase? (For example, “Web push”.)                                     |
| `step`        | Number | no       | A number representing the step in the checkout process                                                        |
| `option`      | Object | no       | Additional information about the given checkout step. (For example, a default payment type for the user: “Visa”.) |

### Product

| Property | Type   | Required | Description                                                                       |
|----------|--------|----------|-----------------------------------------------------------------------------------|
| `id`       | String | yes      | The product id or SKU                                                             |
| `product`  | String | yes      | The product name                                                                  |
| `category` | String | no       | The product category                                                              |
| `brand`    | String | no       | The product brand                                                                 |
| `variant`  | String | no       | The product variant                                                               |
| `list`     | String | no       | The name of the list the user encountered the product (For example, “search” or “wishlist”.) |
| `position` | Number | no       | The position of the product in a list                                             |
| `price`    | Number | no       | The price of the product                                                          |
| `quantity` | Number | no       | The quantity of the product selected                                              |
| `coupon`   | String | no       | The coupon code associated with the product                                       |
| `stock`    | Number | no       | The number of this product in stock                                               |
| `size`     | String | no       | The product size                                                                  |
| `color`    | String | no       | The product color                                                                 |

Example:

```javascript
import {PURCHASE} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(PURCHASE, {
   transaction: {
       id: 'T6708',
       affiliation: 'Paypal',
       revenue: 60.98,
       tax: 6.33,
       shipping: 5.70,
       list: 'Web push',
       step: 3,
       option: {
           defaultPaymentType: 'Visa'
       }
   },
   purchases: [
       {
           id: 'P9807',
           name: 'Mobi T-Shirt',
           category: 'Apparel/Unisex/T-Shirts',
           brand: 'Mobify',
           variant: 'Black',
           list: 'Search',
           position: 2,
           price: 23.95,
           quantity: 1,
           coupon: 'SPRING_SALE19',
           stock: 25,
           size: 'Large',
           color: 'Black'
       },
{
           id: 'P2447',
           name: 'Mobi Socks',
           category: 'Accessories',
           brand: 'Mobify',
           variant: 'White',
           list: 'Bestsellers',
           position: 8,
           price: 5.00,
           quantity: 5,
           coupon: 'PROMO13',
           stock: 60,
           size: 'Large',
           color: 'White'
       }

   ]
})
```
&nbsp;&nbsp;

## ADDTOCART, REMOVEFROMCART

Send this event anytime a user adds a product to their cart or removes a product from their cart, respectively. This event supports the following schema:

| Property                    | Type   | Required | Description                                                      | 
|-----------------------------|--------|----------|------------------------------------------------------------------| 
| `type`                        | String | yes      | The type of shopping list this is, in this case it can be “cart”. | 
| `count`                       | Number | yes      | The total number of cart line items.                             | 
| `subtotal`                    | Number | no       | The total price of all cart line items, before shipping and tax.   | 
| `product`                     | Object | yes      | The product which was added to the cart. (See **Product** below.)                                  |  

### Product

| Property | Type   | Required | Description                                                                       |
|----------|--------|----------|-----------------------------------------------------------------------------------|
| `id`       | String | yes      | The product id or SKU                                                             |
| `product`  | String | yes      | The product name                                                                  |
| `category` | String | no       | The product category                                                              |
| `brand`    | String | no       | The product brand                                                                 |
| `variant`  | String | no       | The product variant                                                               |
| `list`     | String | no       | The name of the list from which the user found the product (For example “search”, or “wishlist”.) |
| `position` | Number | no       | The position of the product in a list                                             |
| `price`    | Number | no       | The price of the product                                                          |
| `quantity` | Number | no       | The quantity of the product selected                                              |
| `coupon`   | String | no       | The coupon code associated with the product                                       |
| `stock`    | Number | no       | The number of this product in stock                                               |
| `size`     | String | no       | The product size                                                                  |
| `color`    | String | no       | The product color                                                                 |


Example:

```javascript
import {ADDTOCART} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(ADDTOCART, {
   type: 'cart',
   count: 3,
   subtotal: 80.98 
   product: {
       id: 'P9807',
       name: 'Mobi T-Shirt',
       category: 'Apparel/Unisex/T-Shirts',
       brand: 'Mobify',
       variant: 'Black',
       list: 'Search',
       position: 2,
       price: 23.95,
       quantity: 2,
       coupon: 'SPRING_SALE19',
       stock: 25,
       size: 'Large',
       color: 'Black'
    }
})
```

Example:

```javascript
import {REMOVEFROMCART} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(REMOVEFROMCART, {
   type: 'cart',
   count: 2,
   subtotal: 57.03 
   product: {
       id: 'P9807',
       name: 'Mobi T-Shirt',
       category: 'Apparel/Unisex/T-Shirts',
       brand: 'Mobify',
       variant: 'Black',
       list: 'Search',
       position: 2,
       price: 23.95,
       quantity: 1,
       coupon: 'SPRING_SALE19',
       stock: 25,
       size: 'Large',
       color: 'Black'
    }
})
```
&nbsp;&nbsp;

## ADDTOWISHLIST, REMOVEFROMWISHLIST

Send this event anytime a user adds a product to their wishlist or removes a product from their wishlist, respectively. This event supports the following schema:

| Property                    | Type   | Required | Description                                                          | 
|-----------------------------|--------|----------|----------------------------------------------------------------------| 
| `type`                        | String | yes      | The type of shopping list this is, in this case it can be “wishlist”. | 
| `count`                       | Number | yes      | The total number of cart line items                                 | 
| `subtotal `                   | Number | no       | The total price of all cart line items, before shipping and tax.       | 
| `product`                     | Object | yes      | The product added to the cart. (See **Product** below.)                                      | 

### Product

| Property | Type   | Required | Description                                                                       |
|----------|--------|----------|-----------------------------------------------------------------------------------|
| `id`       | String | yes      | The product id or SKU                                                             |
| `product`  | String | yes      | The product name                                                                  |
| `category` | String | no       | The product category                                                              |
| `brand`    | String | no       | The product brand                                                                 |
| `variant`  | String | no       | The product variant                                                               |
| `list`     | String | no       | The name of the list from which the user found the product. (For example, “search”, or “wishlist”.) |
| `position` | Number | no       | The position of the product in a list                                             |
| `price`    | Number | no       | The price of the product                                                          |
| `quantity` | Number | no       | The quantity of the product selected                                              |
| `coupon`   | String | no       | The coupon code associated with the product                                       |
| `stock`    | Number | no       | The number of this product in stock                                               |
| `size`     | String | no       | The product size                                                                  |
| `color`    | String | no       | The product color                                                                 |

Example:

```javascript
import {ADDTOWISHLIST} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(ADDTOWISHLIST, {
   type: 'cart',
   count: 3,
   subtotal: 80.98 
   product: {
       id: 'P9807',
       name: 'Mobi T-Shirt',
       category: 'Apparel/Unisex/T-Shirts',
       brand: 'Mobify',
       variant: 'Black',
       list: 'Search',
       position: 2,
       price: 23.95,
       quantity: 2,
       coupon: 'SPRING_SALE19',
       stock: 25,
       size: 'Large',
       color: 'Black'
    }
})
```

Example:

```javascript
import {REMOVEFROMWISHLIST} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(REMOVEFROMWISHLIST, {
   type: 'cart',
   count: 2,
   subtotal: 57.03 
   product: {
       id: 'P9807',
       name: 'Mobi T-Shirt',
       category: 'Apparel/Unisex/T-Shirts',
       brand: 'Mobify',
       variant: 'Black',
       list: 'Search',
       position: 2,
       price: 23.95,
       quantity: 1,
       coupon: 'SPRING_SALE19',
       stock: 25,
       size: 'Large',
       color: 'Black'
    }
})
```
&nbsp;&nbsp;

## APPLEPAYOPTIONDISPLAYED

Send this event when the option to choose Apple Pay is displayed to the user during checkout. This event does not require any data to be provided.

Example:

```javascript
import {APPLEPAYOPTIONDISPLAYED} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(APPLEPAYOPTIONDISPLAYED)
```
&nbsp;&nbsp;

## APPLEPAYBUTTONDISPLAYED

Send this event when the Apple Pay button is displayed to the user during checkout. This event does not require any data to be provided.

Example:

```javascript
import {APPLEPAYBUTTONDISPLAYED} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(APPLEPAYBUTTONDISPLAYED)
```
&nbsp;&nbsp;

## APPLEPAYBUTTONCLICKED

Send this event when the user clicks on the Apple Pay button. This event does not require any data to be provided.

Example:

```javascript
import {APPLEPAYBUTTONCLICKED} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(APPLEPAYBUTTONCLICKED)
```
&nbsp;&nbsp;

## LOCALE

Send this event to set site locale for your Connector. This event supports the following schema:

| Property | Type   | Required | Description                                                                  |
|----------|--------|----------|------------------------------------------------------------------------------|
| `locale`   | String | yes      | The locale ISO code. This should be in the format `languageCode-countryCode`. |

Example:

```javascript
import {LOCALE} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(LOCALE, {
    locale: 'en-US'
})
```
&nbsp;&nbsp;

## ERROR

Send this event to record any app or user errors within the PWA. This event supports the following schema:

| Property | Type   | Required | Description                                                                                             |
|----------|--------|----------|---------------------------------------------------------------------------------------------------------|
| `name`     | String | yes      | The name of the Component where the error originated.                                                    |
| `content`  | String | no       | Error content. This can be the bad value that caused the error, an error message, or an error stack trace. |

Example:

```javascript
import {ERROR} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(ERROR, {
    name: 'email-form',
    content: 'missing an @ in the email'
})
```

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>