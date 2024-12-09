:loudspeaker: Hey there, Salesforce Commerce Cloud community!

We’re excited to hear your thoughts on your developer experience with PWA Kit and the Composable Storefront generally! Your feedback is incredibly valuable in helping us guide our roadmap and improve our offering.

:clipboard: Take our quick survey here: [Survey](https://forms.gle/bUZNxQ3QKUcrjhV18) 

Feel free to share this survey link with your colleagues, partners, or anyone who has experience with PWA Kit. Your input will help us shape the future of our development tools.

Thank you for being a part of our community and for your continuous support! :raised_hands:

# The PWA Kit Extension SDK

A library of ExpressJS middleware, React Hooks, Custom Extension APIs and utilities used to enhance PWA-Kit applications created with extensibility support. NOTE: All applications built using the PWA-Kit platform 4.x and later will automatically have application extension support by default. If you are currently using version prior to 4.x, please upgrade your `@salesforce/pwa-kit-react-sdk` and `@salesforce/pwa-kit-runtime` packages.

## SDK Contents

### Build Tools

This SDK consists of both Webpack and Babel plugins/loaders that are used to integrate Application Extensions support in the PWA-Kit platform. These are pre-integrated in version 4.x and you will not have to interact with these plugins directly. 

#### Plugins 🔌

 -  `babel/plugin-application-extensions`

    The PWA-Kit dev server uses Babel to transpile source code at runtime on the developer's machine. This plugin is integrated via the default babel configuration file located in your projects root folder. This plugin ensures all Application Extensions are loaded based on the current `extension` configuration.

 - `webpack/application-extensions-config-plugin` 

    This webpack plugin injects the current projects extension configuration into the compiler under the key `custom.extensions`. This webpack plugin is used primarily so that the inline loader (`overrides-resolver-loader`) has access to the current extensions configured. 

#### Loaders 🏗️

 - `webpack/application-extensions-loader`

    Before deploying your PWA-Kit experience to the Managed Runtime, it's transpiled using Webpack. Similar to the Babel plugin described above, this loader, aptly named `application-extensions-loader`, replaces all imports of the Application Extensions array with a customized version specific to your applications currently configured extensions.

 - `webpack/override-resolver-loader`

    This _inline_ loader is responsible for buildtime overrides support in your PWA-Kit application. This loader allows Application Extension developers the means to define what files are and are not overridable. 

    By using this loader in your extension code it instructs webpack to bypass the normal modules resolution and use a custom resolution path which include all the `/overrides` folders defined in subsequent extensions and your base application.

    In the following sample scenario a PWA-Kit application configuration combined with an _overridable_ import would resolve in a module resolution like one shown below.

    ```
    // app/config/default.js
    export default {
        ...
        extensions: [
            '@salesforce/extension-chakra-storefront', 
            '@salesforce/extension-chakra-checkout', 
            '@salesforce/extension-chakra-store-locator'
        ]
        ...
    }
    ```

    ```
    // extension-chakra-checkout/src/setup-app.ts

    import Checkout from 'overridable!./pages/checkout'
    ...
    ```

    `app/overrides/@salesforce/extension-checkoutpages/checkout`
    `node_modules/@salesforce/extension-chakra-store-locator/src/overrides/@salesforce/extension-checkout/pages/checkout`
    `node_modules/@salesforce/extension-chakra-chakra-storefront/src/overrides/@salesforce/extension-checkout/pages/checkout`

    Result resolution path:

    1. Check if file exists in the base application overrides `app/overrides/pages/checkout`
    2. Next, check if file exists in the last extension applied to the base application `node_modules/@salesforce/extension-chakra-store-locator/src/overrides/pages/checkout`
    3. Finally, check if file exists in the extension configured prior `node_modules/@salesforce/extension-chakra-storefront/src/overrides/pages/checkout` and do not go any further as you have reached the source importing module which is the canonical source.



### ExpressJS Middleware 👕

Application Extensibility is integrated into the ExpressJS side of the PWA-Kit application via a middleware called `applyApplicationExtensions`. This middleware is invoked during the `_setupCommonMiddleware` stage of the server initialization. The primary function of this middleware is to ensure that all configured Application Extensions have their `extendApp` methods called, allowing them to enhance the ExpressJS application. 

This allows the Application Extension developer to do things like:

1. Adding routes.
2. Request data validation.
3. Adding request logging.
4. Implementing authentication and authorization schemes.

### React HOCs 🧩

In a similar manner, Application Extensibility is integrated into the React side of the PWA-Kit application via a higher-order component called `withApplicationExtensions`. This HoC is used in the PWA's rendering pipeline to enhance the React application. This HoC will ensure that all `extendApp` methods defined in the any configured Application Extensions `setup-app` file is called prior to rendering. 

Using the `extendApp` method in your extensions allows you to do things like:

1. Reusing component logic like data fetching or managing state.
2. Enhancing component behavior such as logging, analytics or adding error boundaries.
3. Conditional rendering in form of authentication status checks prior to content rendering.

### React Hooks 🪝

Sometimes it can be useful to know what extensions are configured and applied to the currently running PWA-Kit application. For this reason we provide a utility hook called `useApplicationExtensions`. This is useful for both base application developers as well as extension developers. A common scenario for using this hook would be to "unlock" certain behavior if a known extension is determined to be running. For example, in our `@salesforce/extension-chakra-storefront` we use this hook to determine if the `@salesforce/extension-chakra-store-locator` extension is loaded. If it is, we'll ensure that we any buttons are visible to the customer so they can navigate to the store locator successfully.

Sample Usage:

```
// components/header.hs
import {useApplicationExtensions} from '@salesforce/pwa-kit-extension-sdk/react'

const Header = () => {
    const extensions = useApplicationExtensions()
    const hasStoreLocator = extensions.find((extension) => extension.getId() === `@salesforce/extension-chakra-store-locator`)

    return (
        <div>
            <Button to="/my-account">My Account</Button>
            {hasStoreLocator && 
                <Button to="/store-locator">Store Locator</Button>
            }
        </div>
    )
}
```

## Support Policy
Security patches are provided for 24 months after the general availability of each major version of the SDK (1.0, 2.0, and so on).