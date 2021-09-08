# The Progressive Web App (PWA) Kit

The PWA Kit is a storefront technology for headless commerce using Salesforce Commerce APIs and React. It provides front-end developers with a more flexible and agile approach to build and maintain modern shopping experiences.

This repository is a [monorepo](https://en.wikipedia.org/wiki/Monorepo) that includes the code that powers the PWA Kit. The code is divided into the following packages:

- `pwa`: A set of sample code and tooling for PWA Kit projects called the Retail React App
- `pwa-kit-create-app`: A tool that generates PWA Kit projects based on the Retail React App
- `pwa-kit-react-sdk`: A set of components and utilities for PWA Kit projects

## Requirements

```
  Node ^12.x or ^14.x
  npm ^6.14.4
```

## Installing Dependencies

Behind the scenes, we're using [Lerna](https://lerna.js.org/) to manage the monorepo. Lerna lets
us install all dependencies and link all packages together with one command:

```bash
npm ci
```

Dependencies that are added to the `package.json` at the root of the
repo are shared between packages. Dependencies listed in the
`package.json` files within each individual package directory work as normal.

## Cleaning and Rebuilding

When you pull changes that include modifications to any package's dependencies, run `npm ci` from the top-level directory (`pwa-kit`). This command cleans and reinstalls all packages. Run this command frequently during development to ensure that you're using the same package versions as everyone else.

For more information, see the [Lerna docs](https://lerna.js.org/).

## Linting

```bash
  npm run lint
```

## Testing

Run tests for all packages with:

```bash
  cd [repo root]
  npm test
```

Run integration tests against live APIs for all packages with:

```bash
  cd [repo root]
  npm run test:integration
```

## License Information

The PWA Kit is licensed under a BSD 3-Clause license. See the [license](./LICENSE) for details.

## Documentation

The full documentation for PWA Kit is hosted on the [Commerce Cloud Developer Center](https://developer.commercecloud.com/s/article/PWA-Kit).

### Useful Links:

- [Getting Started](https://developer.commercecloud.com/s/article/Getting-Started-with-PWA-Kit)
- [Pushing and Deploying Bundles](https://developer.commercecloud.com/s/article/Pushing-and-Deploying-Bundles)
- [The Retail React App](https://developer.commercecloud.com/s/article/The-Retail-React-App)
- [Rendering and Routing](https://developer.commercecloud.com/s/article/Rendering-and-Routing)
- [Managed Runtime Infrastructure](https://developer.commercecloud.com/s/article/Managed-Runtime-Infrastructure)
