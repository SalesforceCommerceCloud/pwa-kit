# [Extensibility] Tutorial🎓

Welcome to the hands-on tutorial for PWA Kit's multi-extensibility feature! In this comprehensive guide, you'll discover how to leverage the power of extensible architecture to create customizable, maintainable commerce applications. Through practical exercises, you'll gain firsthand experience with key concepts and best practices. Let's begin your journey into PWA Kit extensibility! 🚀

## Exercise #1. Build Your Storefront🏠

### Project Generation⚙️

In this initial phase, we'll create a new PWA Kit project that demonstrates the power of combining multiple extensions. Our focus will be on two core extensions: the Storefront extension, which provides essential commerce functionality, and the Store Locator extension, which adds geographic store discovery features.

The PWA Kit project generator provides an interactive experience to help you configure your project according to your needs. Let's walk through the generation process step by step:

First, open your terminal and run our project generator:

```
npx @salesforce/pwa-kit-create-app@4.0.0-extensibility-preview.3
```

During the generation process, you'll be presented with several configuration options, answer the questions as follows:

* What type of PWA Kit project would you like to create? **PWA Kit Application**
* Which Application Extensions do you want to install? *(use arrow key to navigate, space to select and enter to confirm)*
    * **@salesforce/extension-chakra-storefront**
    * **@salesforce/extension-chakra-store-locator**
* Do you want to proceed with extracting the Application Extensions code? **No**
* What is the name of your Project? **my-project**
Kit application. This generated project includes all necessary dependencies, configurations for a working demo instance, and a proper directory structure for extension-based development.

### Extension Configurations🔧

Now that we have our project generated, let's dive deep into how extensions are configured and managed within your PWA Kit application. The heart of extension configuration lives in your `package.json` file (or your JavaScript config files) under the `mobify.app.extensions` property. 

Open your `package.json` and locate this configuration section. You'll find an array that follows this structure:

```json
{
  "mobify": {
    "app": {
      "extensions": [
        ["@salesforce/extension-chakra-storefront", {
          "enabled": true,
          // Extension-specific configurations
        }],
        ["@salesforce/extension-chakra-store-locator", {
          "enabled": true,
          "radius": 50,
          "supportedCountries": ["US", "CA"]
          // More configuration options
        }]
      ]
    }
  }
}
```


1. The extension name (as published on NPM)
2. A configuration object specific to that extension

This configuration system provides several powerful capabilities:

1. **Dynamic Extension Management**: The `enabled` flag allows you to temporarily disable extensions without removing their configuration. This is particularly valuable during development and debugging phases when you need to isolate functionality.
2. **Extension-Specific Configuration**: Each extension can define its own configuration schema. For example, the Store Locator extension accepts parameters like `radius` and `supportedCountries` to customize its behavior. These configurations are strongly typed and validated at runtime.
3. **Order-Dependent Processing**: The order of extensions in the array matters. Extensions are processed sequentially, allowing later extensions to build upon or modify the functionality of earlier ones via overrides.

To see your configured extensions in action, navigate to your project directory and start the development server:

```sh
cd ./my-project
npm start
```

A browser window will automatically open to display your application's welcome page. Here, you'll see a comprehensive list of installed extensions along with their current configuration status. This view is particularly helpful for verifying that your extensions are properly installed and configured.

🔍 Pro Tips for Extension Configuration:

1. Always check the documentation of each extension for available configuration options
2. Use TypeScript for better configuration autocomplete and validation
3. Keep the `enabled` flag for easy debugging
4. Consider environment-specific configurations for different deployment scenarios

Next, we'll explore how to customize these extensions using the powerful override system...
### Extension Overrides🛠️

The override system is one of PWA Kit's most powerful customization mechanisms, allowing you to precisely modify extension functionality without altering the original source code. Let's explore how to effectively use overrides to customize your storefront's appearance and behavior.

#### Understanding the Override System

When you navigate to `http://localhost:3000`, you'll see the default implementation of the Chakra storefront extension's home page. While this provides an excellent starting point, your business likely requires customized layouts, content, and functionality. The override system enables these customizations while maintaining the benefits of using extensions.

The override system follows a few key principles:

1. **Explicit Overridability**: Extensions explicitly declare which files can be overridden, ensuring a stable and maintainable public interface.
2. **File-level Resolution**: Overrides are resolved using a predictable path structure that mirrors the extension's internal organization.
3. **Granular Control**: You can override specific components or pages while keeping the rest of the extension's functionality intact.

#### Implementing Your First Override

Let's customize the home page by creating an override. First, we'll establish the necessary directory structure:

Here, we will be customizing the home page by using **Extension Overrides.** It is a customization mechanism that works at the **file level.** Each extension can declare a list of “overridable” files. If a file is overridable, you can create a file in the “overrides” folder to replace the implementation.

* Places all overrides under the `/app/overrides` directory
* include the full extension package name as path
* Mirrors the internal path of the file being overridden

```sh
# Create a folder called overrides, in the app folder
# This is where you will keep all extension overrides
mkdir -p ./app/overrides/@salesforce/extension-chakra-storefront/pages/home/

touch ./app/overrides/@salesforce/extension-chakra-storefront/pages/home/index.jsx
```

Now, update your `index.jsx` with custom implementation:

```js
import React from 'react'

const Home = () => {
    return <h1>Hello World</h1>
}

export default Home
```
For now, you need to restart the dev server for new override files to take effect. Once the server is started, navigate to home page and you should see. 

You can also verify the overrides by running the [List Overridable Files](README.md#list-overridable-files) command at the root of your project directory:
```bash
npm run list-overrides
```

#### Important Considerations

🙋 Note: After creating new override files, you'll need to restart your development server for the changes to take effect. This is because override resolution happens during the application's bootstrap phase.

⚠️ Warning: Not every file in an extension is overridable. Extension developers carefully choose which files to make overridable to maintain a stable public interface. This deliberate approach helps:

* Prevent breaking changes when updating extensions
* Maintain clear boundaries between extension and custom code
* Ensure reliable upgrade paths for your application

#### Override Discovery and Documentation

To discover which files are overridable in an extension:

1. Check the extension's documentation for a list of overridable files
2. Look for files imported with the `overridable!` prefix within the extension

In the next exercise, we'll explore how to create your own extension and make its components overridable...

## Exercise #2. Create Your Extension

After mastering the use of existing extensions, you're ready to create your own. In this exercise, we'll explore how to build a custom extension that can be shared across projects or even published for others to use. Let's dive into the development process that will transform you from an extension consumer to an extension author.

### Getting Started with Extension Development

First, we’ll generate a fresh PWA Kit project by running the following command:

```sh
npx @salesforce/pwa-kit-create-app
```

The generator will prompt you a few questions, answer the questions as follows:

* What type of PWA Kit project would you like to create? **PWA Kit Application Extension**
* What is the name of your Application Extension? **extension-starter**

The generator creates two key components:

1. Your extension project in `/@salesforce/extension-starter`
2. A development environment preconfigured to test your extension

Running `npm start` launches a development server where you can see your extension in action. This environment is crucial for testing your extension in isolation before integrating it with other projects.
### Extending the Server - setup-server.js

One of the fundamental ways to enhance a PWA Kit application is through server-side extensions. The `/src/setup-server.js` file serves as your entry point for server customization, allowing you to add new endpoints, middleware, and server-side functionality.

Every PWA Kit extension includes this file by definition, exporting a class that extends `ApplicationExtension`. This server extension system enables you to:

* Add new API endpoints for your features
* Apply custom middleware, e.g. authentication or logging
* Handle specific business logic requirements


Integrate with external services and APIs Here's how you can leverage it to extend your application's server capabilities:

```js
class StarterExtension extends ApplicationExtension<Config> {
    /**
     * Enhance your ExpressJS Application with custom routes and middleware
     */
    extendApp(app: Application): Application {
        // Add custom endpoints
        app.get('/my-route', (req, res) => {
            res.send("Hello world")
        })
        return app
    }
}
```

Now, visit http://localhost:3000/my-route, you will see the endpoint respond with a string “Hello World”.


### Extending the React Application - setup-app.js

The `/src/setup-app.js` file is your gateway to enhancing the React application layer. This special file works isomorphically, meaning your extensions work consistently on both server-side rendering and client-side execution.

The `extendApp` method allows you to wrap your application with higher-order components (HOCs), enabling powerful customizations:

```js
const sampleHOC = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
    const SampleHOC: React.FC<P> = (props: SampleHOCProps) => {
        return (
            <div className="sample-hoc">
                <WrappedComponent {...(props as P)} />
            </div>
        )
    }

    return SampleHOC
}

class Sample extends ApplicationExtension<Config> {
    static readonly id = extensionMeta.id

    /**
     * Use this method to wrap or enhance your PWA-Kit application using [React higher-order components](https://legacy.reactjs.org/docs/higher-order-components.html).
     * You can use this to add visual treatments to your application, change the props that are supplied to the application component
     * or add things like providers and contexts to be used throughout your app.
     */
    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        const HOCs = [
            // Example higher-order component, this can be safely removed.
            sampleHOC,
        ]

        return applyHOCs(App, HOCs)
    }
}
```

In this example we created a sample higher-order-component that wraps React component using a simple `div` element, for more common cases, you could imagine using HOCs for React Context/Providers to enhance your application. `applyHOCs` is a PWA Kit extension SDK utility to help you conveniently apply multiple HOCs.

This powerful system enables you to:

* Add global state management
* Implement theme providers
* Inject analytics tracking
* Add error boundaries
* Enhance performance monitoring


`extendRoutes` is a method of the ApplicationExtension class that allows you to add/modify the routes for your React application and `beforeRouteMatch` is used to modify all routes if necessary during server side rendering.


### Creating a Public Interface with Overridable Files 🎯

A well-designed extension provides clear customization points. The `overridable!` import prefix is your tool for declaring which parts of your extension can be customized.

To make a file overridable, use the `overridable!` import path prefix for your import statements, such as

```js
import sampleHOC from 'overridable!./components/sample-hoc'
```

By default, no file is overridable. This is a major paradigm shift from how we looked at how overrides worked in the past. We want to give extension authors the super power to “declare” their extension’s public interfaces. This is beneficial for backwards compatibility for new versions and extension consumers can easily consume/override without worry about breaking changes.

When selecting files to make overridable, consider:

1. Which components are likely to need customization
2. What level of granularity provides the best developer experience
3. How to maintain backward compatibility as your extension evolves

### Configuring Your Extension ⚙️

In most cases it's beneficial to make your application extension configurable. This will allow your extension to meet the needs of different PWA-Kit developers whom have varying requirements. This can be as simple as configuring the url path to the page your extension adds, to more complex scenarios like configuring layouts to those same pages.

The `/config` directory contains two crucial files:

1. `default.json`: Default configuration values that work out of the box
2. `sample.json`: Example configurations demonstrating all available options


The `default.json` is used by the PWA Kit generator to populate configuration values and the `sample.json` helps others to understand the types and patterns for each properties in your extension’s config.

Best practices for configuration:

* Provide sensible defaults for all options
* Document each configuration option thoroughly
* Include validation logic for configuration values
* Consider environment-specific configurations


Let’s imagine that you want to add a configuration for the URL path of a new storefront page. Here is what you can do to make it a configuration.

First, create a `./src/types/config.ts` file to declare the typescript type declaration:

```js
import type {ApplicationExtensionConfig} from '@salesforce/pwa-kit-extension-sdk/types'

export interface UserConfig extends ApplicationExtensionConfig {
    path?: string
}
export type Config = Required<UserConfig> 
```

Next, in your setup-app.js or setup-server.js, you can consume the user provided configuration during runtime like:

```js
class Sample extends ApplicationExtension<Config> {
    extendApp(App){
       console.log(this.getConfig())
    }
}
```

If you want to read the config from within your React components, you can use the `useExtensionConfig` hook that is included in the extension boilerplate.

### Extension State Management 🔄

In a multi-extension architecture, effective state management is crucial for enabling extensions to communicate and share data while maintaining clean separation of concerns. The PWA Kit provides a robust state management solution built on [Zustand](https://zustand.docs.pmnd.rs/getting-started/introduction), allowing extensions to declare their own states and actions while ensuring proper isolation and interoperability.

#### **Designing Your Extension's State**

When implementing state management for your extension, start by designing a clear public interface that defines both the state structure and the actions that can modify it. Let's explore this concept through a practical counter example:

```js
import {
    SliceInitializer
} from '@salesforce/pwa-kit-extension-sdk/react'

interface StoreSlice {
    count: number
    increment: () => void
    decrement: () => void
}

const sliceInitializer: SliceInitializer<StoreSlice> = (set) => ({
    count: 0,
    increment: () => set((state) => ({count: state.count + 1})),
    decrement: () => set((state) => ({count: state.count - 1}))
})
```

This implementation follows Zustand's patterns, providing a clean and predictable state management solution. The `SliceInitializer` creates a contained state slice with its associated actions, ensuring your extension's state remains encapsulated and manageable.

#### Registering Your Extension's Store

Once you've defined your state slice, register it with the application using the `withApplicationExtensionStore` higher-order component:

```js
class Sample extends ApplicationExtension<Config> {
    extendApp<T extends React.ComponentType<T>>(
        App: React.ComponentType<T>
    ): React.ComponentType<T> {
        const HOCs = [
            (component: React.ComponentType<any>) =>
                withApplicationExtensionStore(component, {
                    id: "extension-counter",
                    initializer: sliceInitializer
                })
        ]

        return applyHOCs(App, HOCs)
    }
}

export default Sample
```

The PWA Kit Extension SDK automatically handles namespacing your store data using your extension's ID, preventing conflicts between different extensions' states. This architecture ensures that each extension's state remains isolated while still being accessible to other extensions when needed. A benefit of this approach is that each extension maintains its own state logic while allowing controlled access from other extensions

#### Accessing Extension State

Other extensions can access your extension's state using the `useApplicationExtensionsStore` hook:

```js
import {useApplicationExtensionsStore} from '@salesforce/pwa-kit-extension-sdk/react'

export const MyComponent = () => {
    const state = useApplicationExtensionsStore(
        (*state*: Record<string, any>) => *state*.state["extension-counter"]
    )
    return <div>Count: {state.count}</div>
}
```

#### Best Practices for Extension State Management

When implementing state management in your extensions:

1. **Clear Boundaries**: Define clear state boundaries and keep state specific to each extension's functionality
2. **Minimal Interface**: Expose only the necessary state and actions that other extensions might need
3. **Documentation**: Clearly document your state structure and available actions for other developers

By following these patterns, you'll create maintainable, scalable extensions that can effectively share state while maintaining clean architecture principles.

⚠️ Important: The state management system is designed for client-side UI state only. States are not serialized during server-side rendering and will not be available during initial page load. For data that needs to be present during server-side rendering, use alternative approaches like react query or `getProps`.

## Conclusion 

The PWA Kit's multi-extensibility architecture represents a significant advancement in how we build and maintain ecommerce applications. Through this tutorial, you've learned how to leverage extensions to create modular, maintainable, and customizable applications. From consuming existing extensions to creating your own, you now have the foundational knowledge to build sophisticated commerce experiences while maintaining clean architecture and code reusability.

As you continue your development journey with PWA Kit, remember that extensibility is more than just a technical feature—it's a paradigm that promotes code sharing, reduces time to market, and ensures your applications remain upgradeable as the platform evolves. 
