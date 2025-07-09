:loudspeaker: Hey there, Salesforce Commerce Cloud community!

We’re excited to hear your thoughts on your developer experience with PWA Kit and the Composable Storefront generally! Your feedback is incredibly valuable in helping us guide our roadmap and improve our offering.

:clipboard: Take our quick survey here: [Survey](https://forms.gle/bUZNxQ3QKUcrjhV18)

Feel free to share this survey link with your colleagues, partners, or anyone who has experience with PWA Kit. Your input will help us shape the future of our development tools.

Thank you for being a part of our community and for your continuous support! :raised_hands:

# Chakra Storefront PWA-Kit Application Extension

The Chakra Storefront Application Extension is a fully featured composable storefront using Chakra UI for its primary component
library, along with other first and third party libraries like ReactIntl to handle localization and CommerceSDKReact to provide a
React Hook library for accessing your Commerce Instance. This is a great place to start your storefront implementation if you are
looking to get off to a quick start!!

Please refer to the list of features that this extension supports below. Also, noted below is the public API of files that you can
override if you choose to customize you application that way.

# Features

The Chakra Storefront is a fully fledged storefront that includes the below features:

- Localization support using ReactIntl.
- Components provided by Chakra UI.
- Implementations of the following pages:
    - Home
    - Product List
    - Product Detail
    - Cart
    - Checkout
    - Account
    - Login
    - Order Summary

# Peer Dependencies

PWA-Kit Application Extensions are NPM packages at their most simplest form, and as such you can define
what peer dependencies are required when using it. Because this sample application extension provides
UI via a new "Sample" page, it requires that the below dependencies are installed at a minimum.

Depending on what features your application extensions provides it's recommended you include any third-party
packages as peer dependencies so that your base application doesn't end up having multiple versions of a
given package.

"react": "^18.2.0",
"react-dom": "^18.2.0"

# Error Page

This extension provides a error page that can be used as a replacement for the default provided by the PWA Kit
React SDK. This page is NOT automatically wired up into the base application, its up to you to integrate it if you
choose to use it. To accomplish this follow the below steps:

1. In your base application, create a new file called `index.ts` located in the `app/components/_error` folder.
2. Import and re-export the error component from this Application Extension like so:

```
import Error from '@salesforce/template-chakra-storefront/components/error'
export default Error
```

The inclusion of the below code will inform the SDK to use this component as the default error page.

# Configuration

The storefront is configurable in many ways, like how your URLs are displayed, what size images are used, where your data is sourced from, etc.
Please refer to the sample configuration below in order to properly configure your application.

```
{
    "activeDataEnabled": false,                                 // Enable/Disable Active Data analytics tracking.
    "commerceAPI": {
        "proxyPath": "/mobify/proxy/api",                       // The proxy path used for you commerce api data requests
        "parameters": {
            "clientId": "<YOUR_CLIENT_ID_HERE>",                // The id of your commerce api client
            "organizationId": "<YOUR_ORGANIZATION_ID_HERE>",    // Your commerce instance org id
            "shortCode": "<YOUR_SHORT_CODE_HERE>",              // Your commerce short code
            "siteId": "<YOUR_SITE_ID_HERE>"                     // Your commerce site id
        }
    },
    "defaultSite": "<YOUR_SITE_ID_HERE>",                       // If site id used if one is not determined from the URL in multi-site
    "einsteinAPI": {                                            // Einstein analytics tracking connection info.
        "host": "https://api.cquotient.com",
        "einsteinId": "<YOUR_EINSTEIN_ID_HERE>",
        "siteId": "<YOUR_SITE_ID_HERE>",
        "isProduction": false
    },
    "enabled": true,                                            // Toggle this extension on or off, this is useful for debugging and development, defaults to true.
    "pages": {                                                  // Define the url path of and the configuration on each page. A page can be set to false if you want to disable it.
         "Account": {
            "path": "/account",
            "orderSearchParam": {"limit": 10, "offset": 0, "sort": "best-matches", "refine": []}
        },
        "Cart": {
            "path": "/cart"
        },
        "Checkout": {
            "path": "/checkout",
            "shippingCountryCode": [
                {"value": "CA", "label": "Canada"},
                {"value": "US", "label": "United States"}
            ]
        },
        "CheckoutConfirmation": {
            "path": "/checkout/confirmation/:orderNo"
        },
        "Home": {
            "path": "/",
            "productLimit": 10,
            "mainCategory": "newarrivals"
        },
        "Login": {
            "path": "/login"
        },
        "Registration": {
            "path": "/registration"
        },
        "ResetPassword": {
            "path": "/reset-password"
        },
        "LoginRedirect": {
            "path": "/callback"
        },
        "ProductDetail": {
            "path": "/product/:productId"
        },
        "ProductList": {
            "path": ["/search", "/category/:categoryId"],
            "imageViewType": "large",
            "selectableAttributeId": "color",
            "filterAccordionSate": "filters-expanded-index"
        }
    },
    "siteAliases": {},                                          // Site alias's for multi-site support.
    "sites": [                                                  // Site configs for multi-site support.
        {
            "id": "<SITE_ID>",
            "l10n": {
                "defaultCurrency": "<CURRENCY>",
                "defaultLocale": "<LOCALE>",
                "supportedCurrencies": ["<CURRENCY>"],
                "supportedLocales": [
                    {
                        "id": "<LOCALE>",
                        "preferredCurrency": "<CURRENCY>"
                    }
                ]
            }
        }
    ],
    "url": {                                                    // URL configuration
        "site": "path",                                         // Display the site id/alias in the path or querystring or none.
        "locale": "path",                                       // Display the locale id/alias in the path or querystring or none.
        "showDefaults": true,                                   // If the site/locale is the default setting you can choose to not display it in the url.
        "interpretPlusSignAsSpace": false
    }
}
```

# Installation

1. Install the `@salesforce/template-chakra-storefront` extension into your base application.
```
> npm install @salesforce/template-chakra-storefront<br/>
> Downloading npm package... <br/>
> Installing extension... <br/>
> Finished. <br/>
> Congratulations! The extension was successfully installed! Please visit https://www.npmjs.com/package/@salesforce/template-chakra-storefront for more information on how to use this extension.
```
2. Configure the extension in your base application by updating the configured "extensions" in your configuration. The config file can exist in their the `package.json`
file under the `mobify` key or in the `config/` folder depending on how your base application is setup.
```
extensions: [
    [
        "@salesforce/template-chakra-storefront",
        {
            // Please refer to the config section of this document to properly configure the extension.
        }
    ]
]
```

# Advanced Usage

In order to customize this Application Extension to your particular needs we suggest that you refer to the section titled
"configuration", but if there is something that you want to customize that isn't configurable and cannot wait for a feature
request to be fulfilled, then you can use overrides.

Below is a list of files that can't be overridden from within your PWA-Kit base project. Please refer to the documentation here on
how to properly override extensions. Additionally it's up to the Application Extension developer as to which files can and
cannot be overridden. Please refer to this documentation on how to write your first PWA-Kit Application Extension.


