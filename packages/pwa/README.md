<img alt="logo" src="react-retail-app.png" />

# The Retail React App

The Retail React App is an isomorphic JavaScript storefront and [Progressive Web App](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps) built using [React](https://reactjs.org/) and [Express](https://expressjs.com/). It uses a modern headless architecture that enables developers to decouple the frontend from backend systems. It leverages popular open-source libraries in the React ecosystem, such as [Chakra UI](https://chakra-ui.com/) components, [Emotion](https://emotion.sh/docs/introduction) (CSS-in-JS), [Webpack](https://webpack.js.org/), and many more.

Developers enjoy a streamlined experience without having to worry about the underlying infrastructure, whether they're developing their app locally, deploying it to a [Managed Runtime](https://developer.commercecloud.com/s/article/Managed-Runtime-Infrastructure) environment, or testing the app live.

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

The Retail React App allows you to customize certain aspects of storefront URLs in the `pwa-kit-config.json` file.

```json
// pwa-kit.config.json
{
    "url": {
        "locale": "path|query_param|none"
    }
}
```

You can choose how the current locale appears (or doesn’t appear) in the URL by setting `url.locale` in `pwa-kit-config.json` to one of the following values:

-   `path`: Locale is included in the URL path. Example: `/en-US/women/dress`
-   `query_param`: Locale is included as a query parameter. Example: `/women/dress?locale=en-US`
-   `none`: Locale isn’t included in the URL. Example: `/women/dress`

By default, a new project is configured to include the locale in the URL path.

## Documentation

The full documentation for PWA Kit is hosted on the [Commerce Cloud Developer Center](https://developer.commercecloud.com/s/article/PWA-Kit).

### Useful Links:

-   [Getting Started](https://developer.commercecloud.com/s/article/Getting-Started-with-PWA-Kit)
-   [Pushing and Deploying Bundles](https://developer.commercecloud.com/s/article/Pushing-and-Deploying-Bundles)
-   [The Retail React App](https://developer.commercecloud.com/s/article/The-Retail-React-App)
-   [Rendering and Routing](https://developer.commercecloud.com/s/article/Rendering-and-Routing)
-   [Managed Runtime Infrastructure](https://developer.commercecloud.com/s/article/Managed-Runtime-Infrastructure)
