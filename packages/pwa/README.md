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

## Url Customisation

The Retail React App allows you to customize certain aspects of the url. Currently, you can choose where the current 
locale is displayed, whether it is in the urls path, query parameters, or not displayed. 
Below are the details of the possible configuration values.

-   `path`: the locale will be a part of url path. e.g /en-US/women/dress
-   `query_param`: the locale will be a url query param. e.g /women/dress?locale=en-US
-   `none`: the locale won't be showing in the url at all. e.g /women/dress

By default, we set up the locale to be an url path.

```json
// pwa-kit.config.json
{
    "url": {
        "locale": "path|query_param|none"
    }
}
```

## Documentation

The full documentation for PWA Kit is hosted on the [Commerce Cloud Developer Center](https://developer.commercecloud.com/s/article/PWA-Kit).

### Useful Links:

-   [Getting Started](https://developer.commercecloud.com/s/article/Getting-Started-with-PWA-Kit)
-   [Pushing and Deploying Bundles](https://developer.commercecloud.com/s/article/Pushing-and-Deploying-Bundles)
-   [The Retail React App](https://developer.commercecloud.com/s/article/The-Retail-React-App)
-   [Rendering and Routing](https://developer.commercecloud.com/s/article/Rendering-and-Routing)
-   [Managed Runtime Infrastructure](https://developer.commercecloud.com/s/article/Managed-Runtime-Infrastructure)
