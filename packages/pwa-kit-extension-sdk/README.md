:loudspeaker: Hey there, Salesforce Commerce Cloud community!

We’re excited to hear your thoughts on your developer experience with PWA Kit and the Composable Storefront generally! Your feedback is incredibly valuable in helping us guide our roadmap and improve our offering.

:clipboard: Take our quick survey here: [Survey](https://forms.gle/bUZNxQ3QKUcrjhV18) 

Feel free to share this survey link with your colleagues, partners, or anyone who has experience with PWA Kit. Your input will help us shape the future of our development tools.

Thank you for being a part of our community and for your continuous support! :raised_hands:

# The PWA Kit Extension SDK

A library composed of ExpressJS middleware, React Hooks, Custom Extension APIs and utilities used to enhance **PWA-Kit** applications with extensibility support. 

*NOTE: All applications built using the PWA-Kit platform 4.x and later will automatically have application extension support by default. If you are currently using version prior to 4.x, please upgrade your `@salesforce/pwa-kit-react-sdk` and `@salesforce/pwa-kit-runtime` packages.*

## Introduction to Application Extensibility

Application Extensibility in its simplest terms is a plugin architecture allowing you to enhance your PWA-Kit application via "extensions" packages. Extensions can be used to add features like _checkout_, _account management_, and _store locator_ by installing and configuring the individual packages. This saves you time that would normally be spent implementing these features on your own. You can also choose to implement your own extensions that will allow re-use from one project to the next preventing the need copy and paste code in multiple projects.

Extensions are automatically wired up into the PWA-Kit application at build time. They allow you to enhance both the ExpressJS bff-layer by means of middleware and also enhance the React application using higher-order components and modifications to the router. 

Below we'll give you a high-level overview of what an extension looks like and how each file is used.

### The anatomy of an Application Extension

The `@salesforce/pwa-kit-create-app` package has been updated to allow you, the developer, to not only create **PWA-Kit Applications**, but also create **PWA-Kit Application Extensions**. Assuming that you have generated an application extension the projects folder structure will look like the structure listed below. We'll go into details for each file and folder in the sections following.

```
/extension-starter
    /config
        default.json
    /src
        /components
        /hooks
        /pages
        /types
        /overrides
        setup-app.ts
        setup-server.ts
    /static
    extensions-meta.json
    package.json
```

#### Extension Configuration

By default your extension will come with a generated configuration file containing sample properties located at `project_root/config/default.json`. This file is used to provide your extension class with the default configuration values it needs to function correctly if it is not provided a configuration at the time it's installed to a base project.

This configuration file is also used by our `@salesforce/pwa-kit-create-app` project generator when generating a PWA-Kit Application project given you select the extension in question to be added to it.

#### TypeScript Types

The extension boiler plate is generated in TypeScript, and for that reason there is also a type definition stub file generated for you. This is located at `project_root/src/types/config.ts`. This type is already wired up in your React and ExpressJS ApplicationExtension classes referenced in `project_root/src/setup-app.ts` and `project_root/src/setup-server.ts`.

#### Hooks, Components, Pages

For the most part these are simply stubbed placeholder folders that we believe you'll need when creating your extensions. These are simply convenient places to put all your React hooks, components and pages if your extension happens to add any. It is safe to remove these if you extension does not add any new UI. 

There is however one exception to the above statement. Provided in the `project_root/src/hooks/use-extension-config.ts` file is a React hook called `useExtensionConfig`. The primary use for this hook is to be access the extensions configuration in a React context (e.g. other hooks and components). In the following example you'll see how you can use this hook to alter the looks and behavior of components used in your extension. 

In this example we simply use a configuration named `pageName` in the `new-page` component to change what is rendered. You can imaging that you can do a lot more useful and complex things with this hook.

```
// project_root/src/pages/new-page.ts
import React, {Fragment} from 'react'
import {useExtensionConfig} from '../hooks/use-extension-config'

const Sample = () => {
    const config = useExtensionConfig()
    return (
        <Fragment>
            <h1>Welcome to the {config.pageName} Page 👋</h1>
        </Fragment>
    )
}
```

#### Static Assets

As with your base project, you can have specific assets for your extension. This is useful if you are creating an extension that adds new components that have things like logos or icons, etc. You can also use it to hold JS libraries that you want to add to your application. You can add any required assets in this folder and they will be bundled as you build and deploy your base project. Please refer to the sample page located at `project_root/src/pages/sample.ts` to see how you use these assets.

__NOTE: You don't have to worry about asset name collisions as all the assets are namespaced using your extensions package name.__

#### Overrides

This folder will house any overrides that your extension provides. To target a file that is to be overridden you must place the file in the same folder path as the canonical definition. To illustrate this let's looks at the following example:

Your base project uses two extensions as defined in its `extensions` configuration below:

```
// package.json
{
    ...
    extensions: ['extension-a', 'extension-b']
    ...
}
```

In `extensions-a` we add a new page to the application located at `extension-a-project_root/src/pages/home.ts` and a new logo component located at `extension-a-project_root/src/components/logo.ts`. Because the developer of `extension-a` used the `overridable!` syntax when importing the logo into the home page component (please refer the sub section named `webpack/override-resolver-loader` in the "Loaders" section below for details on how overridable works), it can be overridden by `extension-b` or any other extension following it, as well as the `/overrides` folder in the base application.

The developer of `extension-b` does not like the logo that is being used on the homepage and because it's not configurable via the standard extension configuration object, they want to use overrides to replace it with their own implementation. The developer of `extension-b` creates a new component called `logo.ts` with it new implementation and successfully overrides the existing implementation by adding it to the `extension-b-project_root/src/overrides/extension-b/components` folder.

Please note in the above example, you can target individual extensions to override their files as specified by using `extension-b` in the `overrides/extension-b/components` path.

Now when the base application is built the import for the `logo.ts` in `extension-a` will resolve with the file located in the `extension-b`'s overrides folder.

This mechanism is useful when you want to allow for fine grained customization of your application extension. Its the responsibility of the extension developer to ensure their document what files are overridable and what the expected input and output of those files are. For example, if the overridable file is a React component you should document the props that get passed to that component and the expected exports of the file.

#### Setup App and Setup Server

These two files represent the core of your extension implementation and how your extension is able to enhance and integrate into your PWA-Kit Application. In your generated extension you'll find that we have stubbed each file out for you with implementations for each Application Extensibility integration point. You can choose to change the implementation of these methods to suit the needs of your extensions, or you can leave them as is if your extension does not require them. 

Please refer to the documentation for each ApplicationExtension public method in your generated extension located in the `project_root/src/setup-app.ts` and `project_root/src/setup-server.ts` files for more details.

## SDK Contents

### Build Tools

This SDK consists of both Webpack and Babel plugins/loaders that are used to integrate Application Extensions support in the PWA-Kit platform. These are pre-integrated in version 4.x and you will not have to interact with these plugins directly. 

#### Plugins 🔌

 -  `babel/plugin-application-extensions`

    The PWA-Kit dev server uses Babel to transpile source code at runtime on the developer's machine. This plugin is integrated via the default babel configuration file located in your projects root folder. This plugin ensures all Application Extensions are loaded based on the current `extension` configuration.

 - `webpack/application-extensions-config-plugin` 

    This webpack plugin injects the current projects extension configuration into the compiler under the key `custom.extensions`. This webpack plugin is used primarily so that the inline loader (`overrides-resolver-loader`) has access to the current extensions configured without having to provide the current configuration via query parameters. 

#### Loaders 🏗️

 - `webpack/application-extensions-loader`

    Before deploying your PWA-Kit experience to the Managed Runtime, it's transpiled using Webpack. Similar to the Babel plugin described above, this loader, aptly named `application-extensions-loader`, replaces all imports of the Application Extensions array with a customized version specific to your applications currently configured extensions.

 - `webpack/override-resolver-loader`

    This _inline_ Webpack loader is responsible for build-time module resolution "overrides" support in your PWA-Kit application. This loader allows Application Extension developers the means to define what files are and are not overridable. 

    By using this loader in your extensions implementation it instructs webpack to bypass the normal modules resolution and use a custom resolution path which include all the `/overrides` folders defined in subsequent extensions and your base application.

    In the following sample scenario a PWA-Kit application configuration combined with an _overridable_ import would resolve in the module resolution path shown below.

    ### Base application configuration file.

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

    ### Snippet of Application Extension using the "overridable" loader

    ```
    // extension-chakra-checkout/src/setup-app.ts

    import Checkout from 'overridable!./pages/checkout'
    ...
    ```

    ### Result resolution path

    1. `app/overrides/@salesforce/extension-checkoutpages/checkout`
    2. `node_modules/@salesforce/extension-chakra-store-locator/src/overrides/@salesforce/extension-checkout/pages/checkout`
    4. `src/pages/checkout`


    ### Explanation: 

    The resolution path is mostly defined by the extensions configured in the base project and the order those extensions have been applied. 
    
    First look at the base project for any definitions of the overridable file, this allows users to provide implementations of overridable files in their base project without having to go through the trouble of creating an extension to do this. 

    Next, we look at the extensions array, processing from right to left, looking inside each for a defined modules that matches the overridable import.

    Finally, if no override is present, we treat the import as a normal module import and grab it from the project in which it was defined, this is called the modules canonical source.


### ExpressJS Middleware 👕

Application Extensibility is integrated into the ExpressJS side of the PWA-Kit application via a middleware called `applyApplicationExtensions`. This middleware is invoked during the `_setupCommonMiddleware` stage of the server initialization. The primary function of this middleware is to ensure that all configured Application Extensions have their `extendApp` methods called, allowing them to enhance the ExpressJS application. 

This allows the Application Extension developer to do things like:

1. Adding routes.
2. Request data validation.
3. Adding request logging.
4. Implementing authentication and authorization schemes.
5. Adding misc. middleware.

### React HOCs 🧩

In a similar manner, Application Extensibility is integrated into the React side of the PWA-Kit application via a higher-order component called `withApplicationExtensions`. This HoC is used in the PWA's rendering pipeline to enhance the React application. This HoC will ensure that all `extendApp` methods defined in the any configured Application Extensions `setup-app` file is called prior to rendering. 

Using the `extendApp` method in your extensions allows you to do things like:

1. Reusing component logic like data fetching or managing state.
2. Enhancing component behavior such as logging, analytics or adding error boundaries.
3. Conditional rendering in form of authentication status checks prior to content rendering.

### React Hooks 🪝

Sometimes it can be useful to know what extensions are configured and applied to the currently running PWA-Kit application. For this reason we provide a utility hook called `useApplicationExtensions`. This is useful for both base application developers as well as extension developers. A common scenario for using this hook would be to "unlock" certain behavior if a known extension is determined to be running. For example, in our `@salesforce/extension-chakra-storefront` we use this hook to determine if the `@salesforce/extension-chakra-store-locator` extension is loaded. If it is, we'll ensure that certain buttons are visible to the customer so they can navigate to the store locator successfully.

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