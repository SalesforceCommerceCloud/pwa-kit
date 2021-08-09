<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> Analytics Integrations is our <em>new</em> Analytics API within progressive-web-sdk, released on July 3rd, 2019. Analytics Integrations gives Mobify Platform engineers full visibility into the analytics events being fired in the PWA, and full control over their analytics implementation. If your project requires it, you can still use the legacy Analytics Manager and <a href="../legacy-analytics-manager">access the documentation</a> for now.
  </p>
</div>

## Introduction

<div class="c-callout">
  <p>
    <strong>Note:</strong> For an introduction on how PWA analytics differ from traditional desktop analytics, read our guide, <a href="../../guides/pwa-analytics/">Intro to PWA Analytics</a>.
  </p>
</div>

[Analytics Integrations](../analytics-integrations/api/module-interface.AnalyticsConnector.html) is an API that serves as an abstraction layer between your Progressive Web App (PWA) and any analytics service you’d like to integrate, such as:

- Google Analytics
- Google Tag Manager
- Mobify Google Analytics
- Mobify Engagement Engine

At the core of Analytics Integrations is the [Analytics Manager](../analytics-integrations/api/module-analytics-manager.AnalyticsManager.html) class and its children, the Connectors. Within Analytics Integrations, we have pre-built Connectors for Google Analytics, Google Tag Manager, Mobify’s Engagement Engine, and Mobify’s Google Analytics service, or you can create your own custom Connector for other analytics services. The Connectors are implementations of the [Analytics Connector Interface](../analytics-integrations/api/module-interface.AnalyticsConnector.html) and together they demonstrate a [composite design pattern](https://www.tutorialspoint.com/design_pattern/composite_pattern).

<figure class="u-text-align-center" style="background-color: #fafafa;">

  ![Analytics Integrations API](images/analytics-integrations.png)
  <figcaption>Mobify’s Analytics Integrations API works to connect your PWA to one or more analytics services. *For other analytics services that aren't covered by our pre-built Connectors, create your own custom Connector by implementing the Analytics Connector Interface.</figcaption>

</figure>

<div class="c-callout">
  <p>
    <strong>Note:</strong> Throughout this article, we will use the word <em>events</em> to refer to <strong>analytics events</strong>.
  </p>
</div>

To send events from your PWA to any desired analytics service, you will send the events to the Analytics Manager. The Analytics Manager will take care of sending the events to the list of Connectors you’ve registered with it. Each Connector is hooked up to an analytics service and works to send the events from the Analytics Manager through to its analytics service. By default, each Connector will receive all the events that you send through this pipeline, but to complete the implementation for each desired analytics service, you will need to implement the incoming events on the Connector (or Connectors) that your project requires.

## Overview

You can track an analytics event from your PWA by calling `AnalyticsManager.track` with the appropriate arguments. This will send the event to the Analytics Manager. From there, the Analytics Manager will then send the event to each of its Connectors by calling each Connector’s `track` function with the same arguments. Upon receiving an event, the Connectors can choose either to ignore it, or to transform the incoming data and send the event on to the connected analytics service. 

**If your Mobify project uses a React/Redux implementation**, you can couple your Redux actions with corresponding analytics events by implementing our Redux middleware, which intercepts every action that’s dispatched. It’s called the Analytics Middleware, and it’s located in `packages/pwa/app/analytics/middleware.js`. Within the Analytics Middleware, you can call `AnalyticsManager.track` for incoming actions based on the `action.type` and using data in `action.payload`.

<figure class="u-text-align-center" style="background-color: #fafafa;">

  ![Analytics Integrations With React/Redux Projects](images/analytics-integrations-redux-event.png)
  <figcaption>For projects that use a React/Redux implementation, a Redux event results in analytics data being sent to an analytics platform.</figcaption>

</figure>

Mobify PWAs come implemented with the following [analytics events](../analytics-integrations-events) as a starting point:

- `PAGEVIEW`
- `OFFLINE`
- `UIINTERACTION`
- `PERFORMANCE`
- Some `ERROR` events

This is just a starting set of analytics events. Your project will likely require you to expand on this set, instrumenting your own events for your PWA. To add new events to a Connector, you will extend its class to handle each new event. If you're using more than one Connector, you will need to extend each one of them.

Analytics Integrations provides the following pre-built Connectors:

- [Google Analytics Connector](../analytics-integrations/api/module-connectors_google-analytics.GoogleAnalyticsConnector.html)
- [Google Tag Manager Connector](../analytics-integrations/api/module-connectors_google-tag-manager.GoogleTagManagerConnector.html)
- [Mobify Google Analytics Connector](../analytics-integrations/api/module-connectors_mobify-ga.MobifyGoogleAnalyticsConnector.html)
- [Mobify Engagement Engine Connector](../analytics-integrations/api/module-connectors_engagement-engine.EngagementEngineConnector.html)

For other analytics services such as Monetate or Adobe Dynamic Tag Manager, you can create your own custom Connector by implementing the [Analytics Connector Interface](../analytics-integrations/api/module-interface.AnalyticsConnector.html).

## Analytics events

### Supported analytics events

Analytics Integrations has defined a set of [ready-to-use analytics event types  and their corresponding schema](../analytics-integrations-events) for the following event types:

- [`OFFLINE`](../analytics-integrations-events/#offline)*
- [`PAGEVIEW`](../analytics-integrations-events/#pageview)*
- [`PERFORMANCE`](../analytics-integrations-events/#performance)*
- [`UIINTERACTION`](../analytics-integrations-events/#uiinteraction)*
- [`PRODUCTIMPRESSION`](../analytics-integrations-events/#productimpression)
- [`PURCHASE`](../analytics-integrations-events/#purchase)
- [`ADDTOCART`](../analytics-integrations-events/#addtocart,-removefromcart)
- [`REMOVEFROMCART`](../analytics-integrations-events/#addtocart,-removefromcart)
- [`ADDTOWISHLIST`](../analytics-integrations-events/#addtowishlist,-removefromwishlist)
- [`REMOVEFROMWISHLIST`](../analytics-integrations-events/#addtowishlist,-removefromwishlist)
- [`APPLEPAYOPTIONDISPLAYED`](../analytics-integrations-events/#applepayoptiondisplayed)
- [`APPLEPAYBUTTONDISPLAYED`](../analytics-integrations-events/#applepaybuttondisplayed)
- [`APPLEPAYBUTTONCLICKED`](../analytics-integrations-events/#applepaybuttonclicked)
- [`LOCALE`](../analytics-integrations-events/#locale)
- [`ERROR`](../analytics-integrations-events/#error)*

<div class="c-callout">
  <p>
    <strong>Note:</strong> *The <code>OFFLINE</code>, <code>PAGEVIEW</code>, <code>PERFORMANCE</code>, <code>UIINTERACTION</code>, and some <code>ERROR</code> events are already implemented within your Mobify PWA. If your project requires additional analytics events from this list, you will need to implement them within your PWA. Refer to our detailed  <a href="../analytics-integrations-events">Analytics Events</a> page for reference documentation on our supported events.
  </p>
</div>

### Analytics events handled by our pre-built Connectors

When events are dispatched from the PWA, they need to be handled by our Connectors, which send the events to their connected analytics service. (If you want to handle additional analytics events, you just need to extend the connector for the given events.) By default, our pre-built Connectors already handle the following analytics events as a starting point:

**Google Analytics Connector**
- `PAGEVIEW`
- `PRODUCTIMPRESSION`
- `PURCHASE`
- `APPLEPAYOPTIONDISPLAYED`
- `APPLEPAYBUTTONDISPLAYED`
- `APPLEPAYBUTTONCLICKED`

**Mobify Google Analytics Connector**

The Mobify Google Analytics Connector ensures that Mobify's Insights team can support your project with monitoring, error tracking, and analytics consulting. It extends the Google Analytics Connector, adding a few more events:

- `PAGEVIEW`
- `PRODUCTIMPRESSION`
- `PURCHASE`
- `ADDTOCART`
- `REMOVEFROMCART`
- `APPLEPAYOPTIONDISPLAYED` 
- `APPLEPAYBUTTONDISPLAYED` 
- `APPLEPAYBUTTONCLICKED` 

**Google Tag Manager Connector**
- `PAGEVIEW`
- `PURCHASE`

<div class="c-callout">
  <p>
    <strong>Note:</strong> Google Tag Manager requires some additional configuration for PWAs. Learn more about how to adapt Tag Managers for PWAs in our guide, <a href="../../guides/pwa-analytics/#tag-managers">Intro to PWA Analytics</a>.
  </p>
</div>

**Engagement Engine Connector**

The Engagement Engine Connector ensures that Mobify's Insights team can support your implementation with ongoing performance metrics monitoring, error tracking and reporting. It handles the following events:

- `PERFORMANCE`
- `UIINTERACTION`
- `PAGEVIEW`
- `OFFLINE`
- `ADDTOCART`
- `REMOVEFROMCART`
- `ADDTOWISHLIST`
- `REMOVEFROMWISHLIST`
- `PURCHASE` 
- `APPLEPAYOPTIONDISPLAYED`
- `APPLEPAYBUTTONDISPLAYED`
- `APPLEPAYBUTTONCLICKED`
- `LOCALE`

## The DOM Tracker and Performance Tracker

The DOM Tracker and Performance Tracker are built into the Analytics Manager. They’re used to send `UIINTERACTION` analytics events and `PERFORMANCE` analytics events, respectively, to the Analytics Manager.

### About the DOM Tracker

The DOM Tracker detects UI interactions with the DOM, namely focus, change, and click events, and sends a corresponding `UIINTERACTION` event to the Analytics Manager. To trigger a `UIINTERACTION` event for a DOM element, instrument your DOM element with the following attributes:

- `data-analytics-name`: gives your DOM element a name. This attribute is *required*.
- `data-analytics-content`: specifies a value to send upon interaction. This attribute is **not needed for checkbox, radio, and select elements**. It’s optional for all others.

The following example shows how to set analytics attributes for the DOM element [CarouselItem component](../../components/#!/CarouselItem):

```javascript
<Carousel>
   <CarouselItem>
       <Image src={src} alt="Get 50% off on all products!" />
       <Button
           data-analytics-name="promo-call-to-action"
           data-analytics-content="50off-promo"
       >
           View all products
       </Button>
   </CarouselItem>
   <CarouselItem>
       <Image src={src} alt="Check out our new product line!" />
       <Button
           data-analytics-name="promo-call-to-action"
           data-analytics-content="new-arrivals"
       >
           View all new arrivals
       </Button>
   </CarouselItem>
</Carousel>
```



### About the Performance Tracker

The Performance Tracker is responsible for notifying the SSR server when your PWA has finished rendering the page, and it’s required for every project. You will use the Performance Tracker by calling `AnalyticsManager.trackPageLoad(promise)`, where `(promise)` is the promise for loading your page’s data. This function will call `trackPageLoad` on the Performance Tracker, which will collect performance metrics for your page and send the data as a `PERFORMANCE` event to the Analytics Manager. In your PWA, this is currently called from within the `trackPageLoad` function in `packages/pwa/page-actions`.

## Examples

Now that you understand the concepts, let’s walk through the steps to implementing Analytics Connectors through concrete examples. Follow along to set up your PWA’s analytics!

### Extending a pre-built Connector

First, let’s walk through the steps to connect to your customer’s Google Analytics service, by extending the pre-built Google Analytics Connector:

1. Create a file where you will extend your Google Analytics Connector. (As a suggestion, create your file within `packages/pwa/app/analytics`)
2. Import the `GoogleAnalyticsConnector` from the Mobify SDK.
3. Extend the `GoogleAnalyticsConnector`.

```javascript
import {GoogleAnalyticsConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/google-analytics'

export class CustomGA extends GoogleAnalyticsConnector {}
```

4. Next, you need to add the Google Analytics Connector to the Analytics Manager. To do this, open `packages/pwa/app/analytics/index.js`. Within this file, import your Connector, just as you did in step two, and add it to the `connectors` array. 

```javascript
/* global AJS_SLUG, DEBUG, WEBPACK_MOBIFY_GA_ID */
import {AnalyticsManager} from 'progressive-web-sdk/dist/analytics-integrations/analytics-manager'
import {EngagementEngineConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/engagement-engine'
import {MobifyGoogleAnalyticsConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/mobify-ga'
Import {CustomGA} from './custom-ga'

export const getAnalyticsManager = (() => {
   let instance = null
   return () => {
       if (instance === null) {
           instance = new AnalyticsManager({
               connectors: [
                   new EngagementEngineConnector({
                       projectSlug: AJS_SLUG
                   }),
                   new MobifyGoogleAnalyticsConnector({
                       trackerId: WEBPACK_MOBIFY_GA_ID,
                       ecommerceLibrary: 'ec'
                   }),
                   new CustomGA({
                       trackerId: 'a-fake-id',
                       trackerName: 'customerTracker',
                       ecommerceLibrary: 'ec'
                   })
               ],
               debug: DEBUG
           })
       }
       return instance
   }
})()
```

5. Run the project and navigate to a page.
6. Check to see if a `PAGEVIEW` event is sent for your Connector. (`PAGEVIEW` events are already implemented as part of Analytics Integrations.)

### Sending an analytics event to a Connector using React/Redux

Now, we’ll demonstrate how to send a `PRODUCTIMPRESSION` event to the Google Analytics Connector that we just created in the previous example.

1. First, you’ll need to create a Redux action for this event. You may want to store the action type in a constant that you can access from within the middleware. For example:

```javascript
export const PRODUCT_IMPRESSION = 'PRODUCT_IMPRESSION'
export const productImpression = (data) => ({
   type: PRODUCT_IMPRESSION,
   payload: {
       id: data.id,
       name: data.name,
       category: data.category,
       brand: data.brand,
       variant: data.variant,
       list: data.list,
       position: data.position
   }
})
```

2. Next, you’ll add that action to the Analytics Middleware (within `packages/pwa/app/analytics/middleware.js`) with the following behavior: if the action being processed is a Product Impression, then we want to send an event to the Analytics Manager. See `case PRODUCT_IMPRESSION` for an example implementation:

```javascript
import {getAnalyticsManager} from './index'
import {ONLINE_STATUS_CHANGED, SEND_PAGEVIEW_ANALYTICS, PRODUCT_IMPRESSION} from '../actions'
import {PAGEVIEW, OFFLINE, PURCHASE, PRODUCTIMPRESSION} from 'progressive-web-sdk/dist/analytics-integrations/types'

const analyticsMiddleware = (store) => (next) => (action) => {
   const analyticsManager = getAnalyticsManager()
   const {payload, type} = action

   switch (type) {
       case SEND_PAGEVIEW_ANALYTICS:
           analyticsManager.track(PAGEVIEW, {
               templateName: payload.templateName,
               location: payload.location,
               path: payload.path,
               title: payload.title
           })
           break
       case ONLINE_STATUS_CHANGED:
           analyticsManager.track(OFFLINE, {
               startTime: payload.startTime
           })
           break
      case PRODUCT_IMPRESSION:
          analyticsManager.track(PRODUCTIMPRESSION, payload)
          break
       default:
           break
   }
   return next(action)
}

export default analyticsMiddleware
```

3. Our work in step two will call `track` on all of our Connectors, including our extended Google Analytics Connector. We’re now part way there: because `PRODUCTIMPRESSION` is a custom event, `track` does not have any built-in behavior for it. You’ll need to adjust the `track` function to handle the new event, like so:

```javascript
import {MobifyGoogleAnalyticsConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/google-analytics'
import {PRODUCTIMPRESSION} from 'progressive-web-sdk/dist/analytics-integrations/types'

export class CustomGA extends GoogleAnalyticsConnector {
    track(type, data) {
        switch (type) {
           case PRODUCTIMPRESSION:
               this.ga(`ec:addImpression`, {
                   id: data.id,
                   name: data.name,
                   category: data.category,
                   brand: data.brand,
                   variant: data.variant,
                   list: data.list,
                   position: data.position
               })
               return data
           default:
               // this allows the built in events like pageview to work
               return super.track(type, data)
       }
   }
}
```

4. You can refactor the code example above to flatten `track` as you add more events. For example:

```javascript
import {MobifyGoogleAnalyticsConnector} from 'progressive-web-sdk/dist/analytics-integrations/connectors/google-analytics'
import {PRODUCTIMPRESSION} from 'progressive-web-sdk/dist/analytics-integrations/types'

export class CustomGA extends GoogleAnalyticsConnector {
    track(type, data) {
        switch (type) {
           case PRODUCTIMPRESSION:
               return this.trackProductImpression(data)
           default:
               // this allows the built in events like pageview to work
               return super.track(type, data)
       }
    }
    trackProductImpression(data) {
        this.ga(`ec:addImpression`, {
           id: data.id,
           name: data.name,
           category: data.category,
           brand: data.brand,
           variant: data.variant,
           list: data.list,
           position: data.position
       })
       return data
    }
}
```

5. Next, dispatch a Product Impression action when a user views a product.

6. Time for testing! Check that product impressions are being sent correctly. You can see the event being logged in the console by setting `debug: true` on your Analytics Manager in  `packages/pwa/app/analytics/index.js`.

### Sending an analytics event to a Connector without React/Redux

To send an analytics event without coupling it to a redux action, you can call the Analytics Manager’s `track` function wherever it’s appropriate to send the analytics event.

```javascript
import {PRODUCTIMPRESSION} from 'progressive-web-sdk/dist/analytics-integrations/types'

analyticsManager.track(PRODUCTIMPRESSION, payload)
```

To handle the analytics event in a Connector, continue on from step three from the previous example.

### Creating a Custom Connector

If your project requires you to create a Connector for an analytics service that’s not covered under the pre-built Connectors, you’ll want to create your own custom Connector. To do this, create a class for your Connector that implements the [Analytics Connector Interface](../analytics-integrations/api/module-interface.AnalyticsConnector.html). This interface has a `load` and `track` function that must be implemented, and you can read about each function’s expected arguments and return values in our [API Documentation](../analytics-integrations/api/module-interface.AnalyticsConnector.html). 

The following example demonstrates a possible approach for implementing a Custom Connector:

```javascript
import {
   PAGEVIEW,
   OFFLINE,
   UIINTERACTION,
   PERFORMANCE,
   ADDTOCART,
   REMOVEFROMCART,
   ADDTOWISHLIST,
   REMOVEFROMWISHLIST,
   PURCHASE,
   APPLEPAYOPTIONDISPLAYED,
   APPLEPAYBUTTONDISPLAYED,
   APPLEPAYBUTTONCLICKED,
   ERROR,
   LOCALE
} from 'progressive-web-sdk/dist/analytics-integrations/types'

/**
* A Connector for some analytics service
*/
export class SomeConnector {
   constructor(options) {
       // Set up your Connector with necessary properties.
   }

   load() {
       // load all necessary resources to create the connection to the              
       // Analytics Provider.
       return Promise.resolve()
   }

   track(type, data) {
       switch (type) {
           case PAGEVIEW:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
           case PERFORMANCE:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
           case UIINTERACTION:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
           case OFFLINE:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case ADDTOCART:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case REMOVEFROMCART:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case ADDTOWISHLIST:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case REMOVEFROMWISHLIST:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case PURCHASE:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case APPLEPAYOPTIONDISPLAYED:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case APPLEPAYBUTTONDISPLAYED:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               Break
            case APPLEPAYBUTTONCLICKED:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case ERROR:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
            case LOCALE:
               // transform the data and send it to the corresponding analytics service
               // if you want to track this analytics event.
               // and return the transformed data for logging.
               break
           default:
               return null
       }
   }
}
```

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>


