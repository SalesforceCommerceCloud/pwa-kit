# The Progressive Web App (PWA) Kit SDK

[![NPM](https://nodei.co/npm/pwa-kit-react-sdk.png?downloads=true&stars=true)](https://nodei.co/npm/pwa-kit-react-sdk/) [![CircleCI](https://circleci.com/gh/mobify/mobify-platform-sdks.svg?style=svg&circle-token=2fa991127044320858c98be882401b68423f0adb)](https://circleci.com/gh/mobify/mobify-platform-sdks)

A library of components and utilities that supports the rendering pipeline for the Progressive Web App (PWA) Kit from Salesforce.

## Requirements

```
  Node ^12.x or ^14.x
  npm ^6.14.4
```

## Install Dependencies

```bash
npm i
```

## Marking public API functions as experimental or deprecated

To mark a function as experimental or deprecated in code, you can use the utility functions `experimental()` or `deprecate()` from `progressive-web-sdk/src/utils/warnings` within your experimental/deprecated function. This will prompt a warning in the browser whenever your function is used. You can add an additional custom message to the warning by passing a string into the first parameter.

Example usage:

```javascript
import {experimental} from './utils/warnings'

someExperimentalFunction() => {
  // regular usage
  experimental()

  // the function implementation
}
```

This is the warning that will print in your browser:
`[PWA Kit API WARNING]: You are currently using an experimental function: [someExperimentalFunction] This function may change at any time.`

```javascript
import {deprecate} from './utils/warnings'

someFunctionToBeDeprecated() => {
  // with custom message
  deprecate("It will be removed in version 1.2.3. Please use [newFunction] instead.")

  // the function implementation
}
```

This is the warning that will print in your browser:
`[PWA Kit API WARNING]: You are currently using an deprecated function: [someFunctionToBeDeprecated]. It will be removed in version 1.2.3. Please use [newFunction] instead.`

## Documentation

The full documentation for PWA Kit is hosted on the [Commerce Cloud Developer Center](https://developer.commercecloud.com/s/article/PWA-Kit).

### Useful Links:

-   [Getting Started](https://developer.commercecloud.com/s/article/Getting-Started-with-PWA-Kit)
-   [Pushing and Deploying Bundles](https://developer.commercecloud.com/s/article/Pushing-and-Deploying-Bundles)
-   [The Retail React App](https://developer.commercecloud.com/s/article/The-Retail-React-App)
-   [Rendering and Routing](https://developer.commercecloud.com/s/article/Rendering-and-Routing)
-   [Managed Runtime Infrastructure](https://developer.commercecloud.com/s/article/Managed-Runtime-Infrastructure)
