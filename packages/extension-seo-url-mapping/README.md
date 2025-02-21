:loudspeaker: Hey there, Salesforce Commerce Cloud community!

We’re excited to hear your thoughts on your developer experience with PWA Kit and the Composable Storefront generally! Your feedback is incredibly valuable in helping us guide our roadmap and improve our offering.

:clipboard: Take our quick survey here: [Survey](https://forms.gle/bUZNxQ3QKUcrjhV18) 

Feel free to share this survey link with your colleagues, partners, or anyone who has experience with PWA Kit. Your input will help us shape the future of our development tools.

Thank you for being a part of our community and for your continuous support! :raised_hands:

# Description

This is a sample PWA-Kit Application Extension. The purpose of this application extensions is to show how
the Application Extensions API can be used to enhance your PWA-Kit base project.

# Folder Structure

This directory contains the PWA Kit Application Extension base files and structure. It includes the following files:
```
├── src
│   ├── setup-server.ts
│   └── setup-client.ts
└── dev
```

1. `src/setup-server.ts`: The server-side setup function for the extension.
2. `src/setup-client.ts`: The client-side setup function for the extension.
3. `dev/`: PWA Kit App TypeScript template project used for developing the generated PWA Kit App Extension.

# Peer Dependencies

PWA-Kit Application Extensions are NPM packages at their most simplest form, and as such you can define
what peer dependencies are required when using it. Because this sample application extension provides
UI via a new "Sample" page, it requires that the below dependencies are installed at a minimum. 

Depending on what features your application extensions provides it's recommended you include any third-party
packages as peer dependencies so that your base application doesn't end up having multiple versions of a 
given package.

"react": "^18.2.0",
"react-dom": "^18.2.0"

# Configuration

This section is optional and will depend on your application extensions implementation. If you have features
that are configurable, then list those configurations here so that the PWA-Kit project implementor can configure
the extension as they like. 

```
{
    path: '/sample-page'
}
```

# Installation

```
> npm install @salesforce/extension-starter<br/>
> Downloading npm package... <br/>
> Installing extension... <br/>
> Finished. <br/>
> Congratulations! The Sample extension was successfully installed! Please visit https://www.npmjs.com/package/@salesforce/extension-starter for more information on how to use this extension.
```

# State Management

By default all extensions are enhanced with state management using the `withApplicationExtensionStore` higher-order component. Under the hood
the state is provided using [Zustand](https://www.npmjs.com/package/zustand) as a global store for the entire PWA-Kit application. 
Each Application Extension inserts a "slice" into this global store following the 
[slicing pattern](https://github.com/pmndrs/zustand/blob/37e1e3f193a5e5dec6fbd0f07514aec59a187e01/docs/guides/slices-pattern.md). 
This allows you to have data separation from one extension to the other, but also allows you to access state and associated actions of other extensions when needed. 

You can access the state of other extensions via the global store. Below is an example of why you might want to access state and actions from another extensions. In the following snippet we use the global store to access actions from the store locator. You can then use these actions as you please.

This is how you would do something like this.

```
// /base-project/app/components/my-component.jsx
import {useApplicationExtensionsStore} from '@salesforce/pwa-kit-extension-sdk/react'

export MyComponent = () => {
    // Zustand V5 requires stable selector outputs. E.g. Do NOT return a new reference in your selectors return value. This will
    // cause infinite re-renders.
    const defaultState = {}

    // Grab the slice of the extension state for "extension-a"
    const {toggleMapsModal} = useApplicationExtensionsStore(
        (state) =>
            state.state['@salesforce/extension-store-locator'] || defaultState
    )

    return (
        <div>
            <button onClick={() => toggleMapsModal()}/>
        </div>
    )
}
```

# Advanced Usage

As an application extension developer you are responsible for documenting how your extension works including basic usage, its configuration, and advanced customization via overrides. Use this section to explain how your extension can use overrides to accomplish this. Make should to include what files are overridable as well as their expected inputs and outputs.

## Overridable Files

```
/src/path/to/overridable/files.ts
```
