Web push notification make use of service workers. In order to use service workers on any given site, the site must be on a secure domain.

## Why Mobify hosted?

The requirement of having entire client site on a secure domain is very high for the client if they don't have one already. Majority of the time, the only part of client's site is secure is their checkout.

**The main benefit of Mobify hosted web push is that client's site does not need to be fully on a secure domain.**

However, the web push notification subscription is tied to the secure domain that Mobify owns. So if in future, client decides to move their subscribers to their own domain, it will not be possible. Client will need to prompt all their subscribers to re-subscribe to the client's secure domain.

A Mobify hosted web push user flow looks like this:
1.   Show Soft-Ask
2.   Redirect user to Mobify hosted web push domain to show Soft-Dismiss + Hard-Ask
3.   Redirect user back to client site to show confirmation banner and/or welcome notification  (if available)

## Why Client hosted?

**The main benefit of client hosted is that there is no redirects needed.**

A client hosted web push user flow looks like this:
1.   Show Soft-Ask
2.   Show Soft-Dismiss + Hard-Ask
3.   Show confirmation banner and/or welcome notification (if available)

### Requirements for client hosted web push

-   The entire Client site must be on a secure domain

### Mandatory Information

In addition, the following decisions have to be made:

| Decision      | Description                                                                                                                          |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Hosting       | Whether the project is a Mobify-hosted or customer-hosted deployment |
| Opt-in dialog | When to display the opt-in dialog to website visitors                                                                                |

## Required for Mobify-hosted deployments

In this scenario, the following information is required from the customer:

| Decision | Description                                                                                                                                           |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain   | The secure domain to use for the subscription page. Please refer to the Mobify-hosted for a list of available domains. |

## Required for customer-hosted deployments

When a customer hosts messaging on their own domain, the **entire** site must be accessible via HTTPS. Additionally, a service worker file must be deployed:

| File                         | Description                                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/webpush/webpush-loader.js` | A javascript file that installs a service worker which is the core of the client-side push notifications architecture. |

Once a customer's `site-id` has been created, the service worker file may be generated with the following:

`curl https://webpush.mobify.net/webpush-loader.js?site_id=<site-id-goes-here> > webpush-loader.js`

And deployed to:

`https://www.[customers-site].com/webpush/webpush-loader.js`

It's important that the customer's webserver allows the `webpush-loader.js` file to be retrieved with arbitrary URL parameters. When the file is loaded, the URL will typically contain parameters including `site_id`, `version`, etc. These are passed in the URL so that they're accessible to the service worker code.
