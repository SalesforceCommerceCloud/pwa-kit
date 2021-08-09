# Ecommerce Connector

This package is your Ecommerce Connector. It is built using our Commerce
Integrations library and it is the data layer on top of which you can build
your frontend.

## Getting started

You cannot run the Connector on its own – you need to import it into a frontend, like
your PWA. By building your data-layer as a standalone package you will be able to
share it between PWAs and other frontend apps.

We've set up a sample connector for you so you can understand how it is used in your
PWA. The best way to learn is to run your PWA, look at the data it displays and
then look at `app/store.js` to see how your Connector is imported into your PWA.

To customize your app's data, you need to replace the `StartingPointConnector` in
`src/index.js` with one that matches your backend. That means using one of our
pre-built API Connectors or a web-scraping Connector as the starting point for your
own, real Connector.

Take a look at the [Commerce Integrations documentation][ci-docs] to learn
how to get started with your custom connector.

[ci-docs]: https://docs.mobify.com/commerce-integrations
