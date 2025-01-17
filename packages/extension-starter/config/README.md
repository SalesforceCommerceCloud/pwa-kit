# Extension Configuration 🧩

In most cases it's beneficial to make your application extension configurable. This will allow your extension to meet the needs of different PWA-Kit developers whom have varying requirements. This can be as simple as configuring the url path to the page your extension adds, to more complex scenarios like configuring layouts to those same pages.


## `Sample` vs `Default` Configurations

This folder is home to two configuration files, `default.json` and `sample.json`. Both of which have their type define in the `src/types/config` file. But these files are used differently. Below is a summary of how each file is used.

### `default.json`

This configuration is used during the project generation as well as the extensions loading phase when running your PWA-Kit application. 

During your PWA-Kit project generation, you can select which extensions are configured for your app. This ultimately leads to your applications configuration being setup with the extensions selected during the project questionnaire phase. For example, if you were to choose to use `@salesforce/extension-chakra-storefront` in your PWA-Kit app, then you might see something along the lines of this in your app config, where `<user_defined_configuration>` is initially set to the contents of the `default.json` file:

```
app: {
    extensions: [
        ['@salesforce/extension-chakra-storefront', <user_defined_configuration>]
    ]
}
```

Additionally, during the PWA-Kit application execution the default configuration is merged with the user define configuration to ensure that all configuration key have a value. This means that you do not have to worry about scattering default values in your extensions code, whether it's in a React component or the setup files. 

It's worth noting that if your configuration file is expected to have values supplied by the PWA-Kit application developer, you can use placeholder values that will prompt the developer to replace them with real world values. Below is an example default config file with a placeholder:

```
{
    "enabled": true,
    "activeDataEnabled": false,
    "categoryNav": {
        "defaultNavSsrDepth": 1,
        "defaultRootCategory": "root"
    },
    "commerceAPI": {
        "proxyPath": "/mobify/proxy/api",
        "parameters": {
            "clientId": "<CLIENT_ID>",
            "organizationId": "<ORGANIZATION_ID>",
            "shortCode": "<SHORT_CODE>",
            "siteId": "<SITE_ID>"
        }
    },
    ...
}
```

### `sample.json`

This configuration is similar in many ways to the one above, with the primary difference being that you cannot use placeholder values in it. The configuration is expected to have all its properties defined with valid values.

This configuration file is used internally by the PWA-Kit create-app application whenever a project is generated using a preset. This allows us to create E2E tests on our CI environment where we know that a project generated can be run without further modification to the configuration file.

We also recommend that you reference this configuration file from your extensions root README so that developers know what a valid configuration looks like.

## How to use your extension configuration?

Your extensions configuration can be used in different ways depending on the context in which you want to use it. Your configuration will primarily be used in two places, your React components and your extension setup files. 

### Setup Files

The exported extension classes in `setup-app.ts` and `setup-server.ts` are extended from the `ApplicationExtension` class. This class provide a method called `getConfig` which returns the configuration your extension was instantiated with. you can use this method to grab the configuration and use it however you want. 

Please refer to the `src/setup-app.ts` file to see a sample of how it's being used in the `extendRoutes` implementation.

### React Components

Every application extension generated will have a convenience hook scaffolded for you located at `src/hooks/use-extension-config`. You can use this hook in any pages, components, or other hooks that you add to your extension. Below is an example component that uses this hook:

```
// src/components/sample-component.tsx
import React from 'react'
import {useExtensionConfig} from '../hooks/use-extension-config'

export const Sample = (): JSX.Element => {
    const {path} = useExtensionConfig()

    return (
        <span>{path}<span/>
    )
}

export default Sample
```

### Other Contexts

If you plan on using the extension configuration in other contexts such as utility files, we recommend that you use dependency injection whenever possible. Passing in the configuration to these utilities will not only be a simple solution, but it will also make testing these utilities easier if you choose to do that.
