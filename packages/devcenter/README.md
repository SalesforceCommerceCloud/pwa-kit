# DevCenter

This folder used to contain the source files for the [DevCenter](https://dev.mobify.com), which includes docs for v1 and v2 of the Mobify Platform.

Docs for the rebranded PWA Kit and Managed Runtime now live on the [Commerce Cloud Developer Center](https://developer.commercecloud.com/s/article/PWA-Kit), so the `devcenter` package is no longer needed. However, we are currenty using this folder to store and track changes to our script that generates Markdown documentation for our special components and utility functions included in the SDK.

## To Do

-   [ ] Move `jsdoc2md*` to `packages/pwa-kit-react-sdk/scripts`
-   [ ] Update script to work in the new location
-   [ ] Adapt the templates used by the script for CCDC and SFDocs platforms (if necessary)
-   [ ] Write tests for the script
