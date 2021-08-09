We track transaction analytics on **all browsers and devices** if client has web push integrated.

**Note: This is expected to change sometime in Q1 of 2017. Analytic SDK is expected to take over and handle transaction analytic reporting across client site.**

### Implementation

Make sure the following criteria are meet:
-   Transaction analytic are tracked across all browsers and mobile devices
-   Transaction analytic is not tracked if a Mobify bundle is live and tracking transaction analytics

In `custom/production/custom.js`: Replace `.element-that-contains-order-total` with the selector of order total element in the website.
```javascript
clientCustomization.handleEvent = function(event) {
    switch (event) {
        case this.Event.INITIALIZE:
            // If loaded on the order confirmation page, grab the order total and generate analytics event.
            // We want to track for all browsers, supported or not
            if (ORDER_CONFIRMATION_RE.test(window.location.pathname)) {
                this.sendTransactionFrom('.element-that-contains-order-total');
            }
```
