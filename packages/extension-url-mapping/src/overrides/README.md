# Extension Overrides 👺

Like PWA-Kit applications, PWA-Kit extensions can also provide file overrides. These overrides allow you to add or modify the behaviors of your application outside of the prescribed extension API (e.g. `setup-app.ts` and `setup-server.ts`). Customizing via overrides is a powerful mechanism and should be used with caution, below are some details and limitations of using overrides in your extension.

## Caveats

### Dependencies

Because we are working at the file replacement level, there is an assumption that every override in your extension exists in another extension configured before it. In short this means that you are introducing dependencies for other extensions. 

For example, lets say we have an override defined in our extension located at `src/overrides/@salesforce/extension-chakra-storefont/src/components/header/index.jsx`. In order for this file to be used, we must have the `@salesforce/extension-chakra-storefont` as a dependency of this extension. That can lead to extensions being less portable as they will only work with other extensions and not stand-alone.

### Public API

Every module imported using the "overridable" loader becomes part of your extensions public API. As such you should document all the files that are overridable in your extension via its readme file. If your overridable files include things like React components or javascript utilities, you should document all the exported objects and functions including the function arguments and what they return, so that developers can use your overrides to their full potential.

_NOTE: By default modules used in your project are not overridable as you need to use the `overridable` loader syntax to opt-in to having that module be overridable. Overrides are resolved at build time, this means that you do not pay a bundle size penalty for adding overrides to your extension, since only one module will ultimately be added to your application bundle._

## When to use Overrides?

In general you should seek to add you extensions features via the prescribed API. There are however exceptions to this rule. If your extension primarily modifies another extension, then you might seek to use overrides. But before doing so, you should see if the extension you seek to modify can be configured to work in a way that you want using its configuration.

A good example for using overrides, is theming. If an extension lists a theme file as a module that is overridable you can provide a new theme file via overrides to customize the extensions look and feel. Please refer to the individual extensions readme to understand its capabilities for configuration and customization via overrides.