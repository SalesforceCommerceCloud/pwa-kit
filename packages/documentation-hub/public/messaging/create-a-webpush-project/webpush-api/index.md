There are 2 specific javascript file that we will be going into detail:

*   [webpush-shared.js](#webpush-shared-js)
*   [custom.js](#custom-js)

Please refer to the [Customization API Doc](https://github.com/mobify/duncan/blob/master/docs/customization-api.md) for more Web Push API detail.

<a name="webpush-shared-js"></a>
## Webpush-Shared.js 

This javascript file is an utility file that is load across different iframe assets: **Soft-Ask, Hard-Inline-Ask, Confirmation**

The main purpose of this file are:

*   Bind user interactions to web push subscription behaviour
*   Set iframe animation style (Show from top or bottom)

To update the animation please make sure the following files are updated as well.

```javascript
    // /custom/production/js/webpush-shared.js
    iframeApi.animationType = 'top_slide';              // or 'bottom_slide'
    iframeApi.animationOptions = {PadBody: true};       // for bottom slide animation only
```

```html
    // /custom/production/softask.html
    <div class="webpush-softask-content-div c-dialog c--top"> // c--bottom
```

```html
    // /custom/production/confirmation.html
    <div class="webpush-softask-content-div c-dialog c--top"> // c--bottom
```

<a name="custom-js"></a>
## Custom.js 

This file dictates when the soft-ask should show. It is the file where we place all the logic we need in order to establish the behaviour of the web push subscription flow that the client desires.

The web push generator generates a default of the following behaviour:

-   The user is not in checkout
-   The user had at least 3 page views
-   The user will get soft-ask prompt every 3 page views
-   The user has not dismissed the soft-ask
-   If the user dismissed the soft-ask, the soft-ask should show again after 5 session (Each session is 6 hrs of inactivity)

### **Initial Soft-Ask Setup**

If this is the first time a user has enter the site, we can set which session should the user see the soft-ask the very first time by defining the `INITIAL_SESSION_COUNTDOWN` variable. This value is being set in the `clientCustomization.handleEvent` function.

### **Checkout Guarding**

Checkout is guarded by a regular expression check on the URL defined by `CHECKOUT_FLOW_RE` variable and is prevented by `this.pageDoesNotMatch(CHECKOUT_FLOW_RE)` in the `clientCustomization.shouldShowSoftAsk` function.

**Make sure that the shopping cart, checkout flow and checkout confirmation are guarded to not show soft-ask.**

### **Minimum Page View Guarding**

The user will not see the first soft-ask until the user had at least certain amount of page views defined by the `FIRST_ASK_PAGEVIEW` variable. This is checked by the `this.hadPageViews(FIRST_ASK_PAGEVIEW)` in the `clientCustomization.shouldShowSoftAsk` function.

### **Show Soft-Ask Frequency**

Soft-Ask is shown to the user on a frequency defined by the `PAGE_COUNT_MODULO` variable. This is checked by the `this.getPageCount() % PAGE_COUNT_MODULO === 0` in the `clientCustomization.shouldShowSoftAsk` function.

### **Show Soft-Ask After Deferred**

When Soft-Ask is dismissed, a cookie will be set to make sure user is not presented with soft ask after some number of sessions defined by `DEFER_SESSION_COUNT`. This is being set in the `clientCustomization.deferAsk` function. This condition is checked by `this.isNotDeferred()` in the `clientCustomization.shouldShowSoftAsk` function.
