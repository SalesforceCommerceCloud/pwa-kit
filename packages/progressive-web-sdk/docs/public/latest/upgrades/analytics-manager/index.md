The Analytics Manager is available for version 0.15.0 and later of Mobify's `progressive-web-sdk`. Here's how to add the Analtyics Manager to your project files.

## Installing the Analytics Manager

In `web/app/store/index.js`, add the following code
```jsx
import analytics from 'redux-analytics'
import analyticsManager from 'progressive-web-sdk/dist/analytics/analytics-manager'

...

analyticsManager.init({
    projectSlug: AJS_SLUG,
    mobifyGAID: WEBPACK_MOBIFY_GA_ID,
    ecommerceLibrary: 'ec'          // (Required) - The GA ecommerce plugin to use ('ec' or 'ecommerce')
    debug: DEBUG
})

...

const configureStore = (initialState) => {
    const middlewares = [
        thunk,
        analytics(({type, payload}, state) => analyticsManager.distribute(type, payload, state))
    ]
    ...
```

**Make sure to install the `redux-analytics` package by running** `npm install
redux-analytics --save`

## Instrumenting Analytics Events

The older SDK version may not have the exact dispatch-action implementation,
therefore, we will explain when these events should instrumented and the
parameter it should include in the meta payload

Here is a list of libraries that you will need to instrument these events

```jsx
import {createActionWithAnalytics} from 'progressive-web-sdk/dist/utils/action-creation'
import {
    EVENT_ACTION,
    Page,
    Transaction,
    Product,
    ShoppingList
} from 'progressive-web-sdk/dist/analytics/data-objects/'
```

Please read the [Analytics Schema](../../analytics/analytics-schema/) for
details on the data objects

### Pageview

Fires when the template changes

```jsx
createActionWithAnalytics(
    'ACTION NAME',
    ['templateName'],
    EVENT_ACTION.pageview,
    (templateName) => (new Page({[Page.TEMPLATENAME]: templateName}))
)
```

### Purchase

Fires when we display checkout confirmation page to the user

```jsx
createActionWithAnalytics(
    'ACTION NAME',
    ['transaction', 'products'],
    EVENT_ACTION.purchase,
    (transaction, products) => (new Transaction(transaction, products))
)
```

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>