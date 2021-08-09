<div class="c-callout">
  <p>
    <strong>Note:</strong> The Node.js 10 upgrade instructions described here are only applicable to projects running on Mobify’s Application Delivery Network. They’re <strong>not applicable</strong> for tag-loaded Progressive Web Apps, AMP builds, or native apps.
  </p>
</div>

Mobify targets are the environments that run your app using Node.js. Previously, targets used Node.js version 8.10.x but that's changing going forward, as [version 8 will be discontinued in January 2020](https://github.com/nodejs/Release/blob/master/README.md#release-schedule).

**To prevent unpredictable behavior and ensure security, Mobify customers and their partners must upgrade their version of Node.js to 10.17.0 by January 1st, 2020.**

This requires testing and deploying a Node.js 10.x bundle to your `production` target.

<div class="c-callout">
  <p>
    <strong>Note:</strong> After January 1st 2020, all deployed bundles will use Node.js 10.
  </p>
</div>

This is a requirement for customers to fulfill their responsibilities within Mobify's [shared responsibility model](../../../../platform/support/#shared-responsibility-model). Typically, Node.js upgrades will happen every two years.

Please follow these instructions to deploy a Node.js 10.x bundle to your `production` target:

1. In your project’s `package.json` file, update `progressive-web-sdk` to a version which supports Node.js 10. We recommend updating to version [`1.11.3`](../../../../platform/release-notes/2019-september/), or patch version `1.13.2`.
2. In the `ssrParameters` section of your project’s `package.json` file, add the following field as a new line, copying the syntax exactly: 
`"ssrFunctionNodeVersion": "10.x"`
This parameter specifies the version of Node.js used to run the [SSR server](https://docs.mobify.com/progressive-web/latest/utility-functions/reference/SSRServer.html) and [request processor](../../guides/request-processor/).
3. Update your local development environment, your continuous integration, and anywhere else you're building bundles to use Node.js `v10.17.0` (npm `v6.11.3`) .
    1. Ensure all promises are correctly handled in your application. Unhandled rejection will now cause your application process to crash in Node.js 10.x.
4. Remove your existing `node_modules`. Run `npm install` (or if it's available based on your version of NPM, run `npm ci`).
5. Run a smoke test on your local build and ensure all continuous integration and lighthouse tests are passing.
6. [Push](../../mobify-cloud/overview/#pushing-the-bundle) a new bundle and [publish](../../mobify-cloud/overview/#publishing-a-bundle) it to a non-production target.
7. Confirm that the target is running as expected and that there are no regressions:
    1. Ensure the request processor is working as expected. Test to ensure that updates made to the query string and request class in the request processor are received by the SSR server.
    2. Complete a full end to end regression test, including checkout and other key flows of the site.
8. Publish your new bundle to `production`. Perform your standard testing after publishing to `production`.

After following these steps, you can rest assured that your `production` target will now be running on Node.js 10. If you’re experiencing any difficulties with your upgrade, be sure to contact [Mobify Support](https://support.mobify.com/support/home).
