# Support onboarding: analytics session

OUTLINE:

* There are 3 analytics providers. How are they similar?  
* Then now focus on the differences. Go talk about each analytics one by one.  
  * How to verify events on the frontend  
  * What the customers see on the dashboards  
  * How to configure on the frontend and backend  
  * Then show under the hood: summary of how the integration works.. Because an investigation may require some debugging if there’s potentially a bug in our code.  
* General strategy: if all’s good on the frontend, pass the investigation to the backend team.  
* Next actions: what permissions are needed for new teams to join the support rotation?

There are 3 analytics providers that we’ll learn today:

* Data Cloud  
* Active Data  
* Einstein

They’re all enabled by default in retail-react-app. We have spinned up some instances for developers to play with. But they’ll need to configure their own and update the configuration values accordingly.

How are the analytics providers similarly integrated into the pwa kit site?

* They have a very similar interface, React hooks. Calling the hook will return methods for sending typical analytics events.  
* They all also respect the DNT (do not track) setting.

With investigations, the general troubleshooting approach is to first narrow down the source of the problem. Is it frontend, backend, or both perhaps? Since no team owns the whole thing end to end, usually multiple teams are involved. However, we can start by verifying things on the front end.

Usually, an investigation would be something like a customer noticing the data on dashboard looks incorrect to them. What happened? It could be because they’ve recently migrated to a PWA site.

Demo for each analytics provider:

* Use this site as reference: [pwa-kit.mobify-storefront.com](http://pwa-kit.mobify-storefront.com)   
* Verifying events and seeing the dashboards  
* Example of common gotchas if they exist  
* Mention how users have the final say re: tracking (regardless of our configurations)  
  * With vs without DNT (do not track)  
  * Ad blockers too

## Data Cloud

Purpose: it’s the latest and greatest. To unify your customer data on Salesforce.

How it works?

* Also a hook [`useDataCloud`](https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/template-retail-react-app/app/hooks/use-datacloud.js) and relies on third party code ([cc-datacloud-typescript](https://www.npmjs.com/package/@salesforce/cc-datacloud-typescript) library)  
* Also respects DNT

How to configure it?  
Some prerequisites on the backend are required. TODO: show briefly, and point people to the public docs for details.

And then this on the frontend:

```javascript
// config/default.js
app: {
    dataCloudAPI: {
        appSourceId: '7ae070a6-f4ec-4def-a383-d9cacc3f20a1',
        tenantId: 'g82wgnrvm-ywk9dggrrw8mtggy.pc-rnd'
    }
}
```

How can we verify it?

* Look for requests to [c360a.salesforce.com](http://c360a.salesforce.com). Their payload is base64 encoded.  
* Wait for 15 mins for data to show up on DataCloud

Common issues

* I don’t think we’ve ever had an investigation for this yet. Still new integration, so no common issues yet.

Resources

* Public documentation [https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/integrate-data-cloud.html](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/integrate-data-cloud.html)   
* TODO: ask Carson if there’s any runbook for it

## 

## Active Data

Purpose: analytics for merchandizers

How it works?  
Most of the logic lies in a third party [static javascript file](https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/template-retail-react-app/app/assets/js/active-data.js), which the [`useActiveData`](https://github.com/SalesforceCommerceCloud/pwa-kit/blob/develop/packages/template-retail-react-app/app/hooks/use-active-data.js) hook would dynamically import. Calling the hooks would give you methods to call to send typical analytics events like pageview, view search, etc.

Respects DNT, although not mentioned in the code. If do-not-track is true (`dw_dnt=1`), the app still sends events but the backend will ignore them.

How to configure it? 

* On front end (PWA Kit)  
* `ACTIVE_DATA_ENABLED` in app/constants.js file

* In Business Manager  
  * See [https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/active-data.html\#configure-business-manager](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/active-data.html#configure-business-manager) 

How can we verify? 

* `__Analytics-Start` requests in the browser’s Network tab.  
  * Look at `dw_dnt` in the payload  
* Wait 24 hours before data shows up

Common issues

* Is there a common issue? No, we haven’t gotten much investigations for Active Data  
* But recently there’s this [Slack thread](https://salesforce-internal.slack.com/archives/C01JSFFE3HQ/p1749678460701599?thread_ts=1749566800.646919&cid=C01JSFFE3HQ):  
  \> If the shoppers have do not track enabled, the orders can still be higher but the views can be less.

Resources:

* Public documentation: [https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/active-data.html](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/active-data.html)   
* Internal doc: [https://salesforce.quip.com/Ar7lADMMF0MC](https://salesforce.quip.com/Ar7lADMMF0MC)   
* Original pull request to integrate Active Data into PWA Kit: [https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1555](https://github.com/SalesforceCommerceCloud/pwa-kit/pull/1555)


## Einstein

Purpose: general analytics and also product recommendations

How it works?

* Unlike the other hooks, useEinstein does not rely on third party code. It sends requests directly to Einstein APIs.   
* Respects DNT

How to configure it?  
Some backend prerequisites. Only PIG instances have Einstein available.

Config file

```javascript
// config/default.js
app: {
    einsteinAPI: {
        host: 'https://api.cquotient.com',
        einsteinId: '1ea06c6e-c936-4324-bcf0-fada93f83bb1',
        siteId: 'aaij-MobileFirst',
        isProduction: false
    }
}
```

How can we verify it?

* Look for cquotient requests  
* Use Chrome plugin “Commerce Cloud Recommendation Validator”  
* Wait 24 hours for data to show up on Reports and Dashboards

Common issues

* Missing events  
* Misconfiguration

Resource

* Public documentation: [https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/reports-and-dashboards.html](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/reports-and-dashboards.html)  
* Runbook: [https://salesforce.quip.com/aZkgAjUfEvKI](https://salesforce.quip.com/aZkgAjUfEvKI) 

## Next Actions (for the teams joining the support rotation)

* What permissions do we need for each analytics provider? Account Manager roles?  
* TODO: list of contacts, Slack channels to ask for help