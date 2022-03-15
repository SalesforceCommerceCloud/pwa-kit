<img alt="logo" src="react-retail-app.png" />

# The Retail React App

The Retail React App is an isomorphic JavaScript storefront and [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) built using [React](https://reactjs.org/) and [Express](https://expressjs.com/). It uses a modern headless architecture that enables developers to decouple front-end code from back-end systems. It leverages popular open-source libraries in the React ecosystem, such as [Chakra UI](https://chakra-ui.com/) components, [Emotion](https://emotion.sh/docs/introduction) (CSS-in-JS), [Webpack](https://webpack.js.org/), and many more.

Developers don’t have to worry about the underlying infrastructure, whether they’re developing their app locally, deploying it to a [Managed Runtime](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/mrt-overview.html) environment, or testing the app live.

## Requirements

```
  Node ^12.x or ^14.x
  npm ^6.14.4
```

## Getting Started

To start your web server for local development, run the following command in your project directory:

```bash
npm start
```

Now that the development server is running, you can open a browser and preview your commerce app:

-   Go to http://localhost:3000/

## Localization

See the [Localization README.md](./app/translations/README.md) for important setup instructions for localization.

## URL Customization

You can customize how storefront URLs are formatted in your application's configuration file.

```js
// config/default.js
module.exports = {
    url: {
        locale: 'path|query_param|none',
        site: 'path|query_param|none',
        showDefaults: false|true
    }
}
```
You can choose how the current locale appears (or doesn’t appear) in the URL by setting `url.locale` to one of the following values:

- `path`: Locale is included in the URL path. Example: `/en-US/women/dress`
- `query_param`: Locale is included as a query parameter. Example: `/women/dress?locale=en-US`
- `none`: Locale isn’t included in the URL. Example: `/women/dress`

`url.showDefaults`: This boolean value dictates whether the default site or locale values are shown in the url. Defaults to: false

By default, a new project is configured to not include the locale and site in the URL path.

## Multi-site configuration

By default, the Retail React App is configured to a single locale, single site project.
However, it can be extended to run multiple sites in one single code base. 

Follow these steps to set up your project to support multi-site, multi-locale 
1. Set your url config
- Customise your site and locale in the url 
- Set your url showDefault to true if you want to keep your default values in the url
2. Provide the sites for your app. Each site includes site id, and its localization configuration.
   You can also provide alias for your locale. They will be used in place of your locale id when generating paths across the app
3. [Optional] Provide alias's for your sites. These will be used in place of your site id when generating paths throughout the application.
If no alias is defined for a site, the id will be used to generate paths across application. 

   *Note*:  Even if alias is defined, the URL that has id instead of the alias would still work as a mean to determine the site and locale for the app, 
but be mindful that the generated paths will use alias. 
   This is helpful in some cases. For example: At some time, your application URLs have id, but then you switch to use alias.
If a user bookmarks a link that has id in the path before you deploy your change, the old bookmark link still works when you use it to your site.   

```js
module.exports = {
    url: {
        locale: 'path',
        site: 'path',
        showDefaults: true
    },
    siteAliases: {
        'site-1': 'uk',
        'site-2': 'us'
    },
    defaultSite: 'site-1',
    sites: [
        {
            id: 'site-1',
            l10n: {
                defaultLocale: 'en-GB',
                supportedLocales: [
                    {
                        id: 'en-GB',
                        preferredCurrency: 'GBP'
                    },
                    {
                        id: 'fr-FR',
                        alias: 'fr',
                        preferredCurrency: 'EUR'
                    }
                ]
            }
        },
        {
            id: 'site-2',
            l10n: {
                defaultLocale: 'en-US',
                supportedLocales: [
                    {
                        id: 'en-US',
                        preferredCurrency: 'USD'
                    },
                    {
                        id: 'en-CA',
                        preferredCurrency: 'USD'
                    }
                ]
            }
        }
    ]
}
```

## Documentation

The full documentation for PWA Kit is hosted on the [Salesforce Developers](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/overview) portal.

### Useful Links:

-   [Getting Started](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/getting-started.html)
-   [Setting Up API Access](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/setting-up-api-access.html)
-   [Configuration Options](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/configuration-options.html)
-   [Pushing and Deploying Bundles](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html)
-   [The Retail React App](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/retail-react-app.html)
-   [Proxying Requests](https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/proxying-requests.html)
