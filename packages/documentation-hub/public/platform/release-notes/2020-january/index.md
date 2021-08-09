Released on January 9th, 2020 which corresponds to version `1.15.0` for the v1.0 stream of our SDKs and version `2.0.0-preview.1` for the v2.0 stream of our SDKs.

In this release, we’re shipping improvements to our Application Cache, upgrading to Node.js 10, addressing several component bugs, and cleaning up the libraries in our Version 2.0 release candidate, in anticipation of the upcoming Version 2.0 release of our SDK.

As a reminder, in [November](../2019-november) we announced that we're preparing for a Version 2.0 release to support Node.js server-side rendering. To ease the transition, we'll be releasing two versions: Version 1, and a Version 2.0 release candidate, `2.0.0-preview`. As a release candidate, developers can expect the code to frequently change with continued iteration, and can also expect breaking changes to occur.

For full detail of the version 2.0 release plan, check out our announcement in our [November 2019 release notes](../2019-november).

## <span class="c-label c--features">Features</span>

### Application Cache: rendering HTML for different device types

Now, you can validate that the cached content behaves as expected for each device type while developing locally.

To test the cached content for a given device, append the query string `mobify_devicetype` to the URL and set it as `mobile`, `desktop`, or `tablet`. For example, to test the cached content for `www.example.com` on mobile, you'd set the URL to `www.example.com/?mobify_devicetype=mobile`.

## <span class="c-label c--updates">Updates</span>

### PWA (Progressive Web App) SDK

#### Removing obsolete libraries (Version 2.0 release candidate only)
The transition to our next major SDK version gives us an opportunity remove obsolete and unused APIs, libraries, and utilities that were previously used to maintain backwards compatibility for our Version 1 release stream. That includes removing the following:

- **[Analytics Manager](https://docs.mobify.com/progressive-web/latest/analytics/legacy-analytics-manager/)**: Analytics Manager is replaced by the [Analytics Integrations](https://docs.mobify.com/progressive-web/latest/analytics/analytics-integrations-overview/) library.
- **[Integration Manager](https://docs.mobify.com/progressive-web/latest/integrations/integration-manager/)**: Integration Manager is replaced by the [Commerce Integrations](https://docs.mobify.com/progressive-web/latest/integrations/commerce-integrations/) library.
- **[iFrame Bridge](https://docs.mobify.com/progressive-web/latest/reference/frame-bridge/)**: The iFrame bridge is incompatible with the latest version of the Mobify Platform and, as it does not meet Mobify's performance standards, it will not be used in Version 2.0
- **[Mobify's CLI](https://docs.mobify.com/progressive-web/latest/guides/mobify-cli-tool/)**: the Mobify CLI is challenging to work with in its current form, and as it isn't being heavily used, we've decided to remove it in Version 2.0.
- **[Mobify Test Framework](https://docs.mobify.com/progressive-web/latest/testing/mobify-test-framework/)**: Mobify's Test Framework was developed to simplify automated Lighthouse and Nightwatch testing on the Mobify Platform. The value of the framework has reduced over time, so we've decided to remove it from Version 2.0.
- **Redux actions/reducers/selectors**: The intention with this removal is to decouple the PWA SDK from Redux.
- **Non-PWA Features**: Prior to the Mobify Platform officially supporting desktop screens, there were several components and utilities created specifically for desktop screens which we labelled as `non-PWA`. Now that the Mobify Platform supports desktop screens, we've opted to remove these obsolete components and utilities.
- **React Router customizations**: Previously, there were React Router customizations living directly in the SDK which meant that we weren't be able to change React Router versions without making breaking changes. Removing these customizations enables the move to the latest version of React Router.

### Node.js 10 Upgrade

In November, we [enabled support for Node.js 10](../2019-november/#updates), and warned that Node.js 8 would no longer be supported in 2020 to prevent unpredictable behavior and ensure security.

**Bundles deployed to a target now default to run on Node.js 10.**

<div class="c-callout c--important">
 <p>
   <strong>Note:</strong> After January 31st, bundles configured to run on Node.js 8 will not be supported and will result in an error when published.
 </p>
</div>

We recommend Mobify customers and their partners upgrade their version of Node.js to 10.17.0. To upgrade, follow our [Node.js Upgrade Guide](../../../progressive-web/latest/upgrades/node/).

## <span class="c-label c--bugs">Bug Fixes</span>

### PWA SDK
- Resolved an issue with the [accordion](https://docs.mobify.com/progressive-web/latest/components/#!/Accordion) component, where the component was always _closed_ by default.
- Resolved an issue with the [dangerousHTML](https://docs.mobify.com/progressive-web/latest/components/#!/DangerousHTML) component, which was not applying custom classes being passed to the component.
- Addressed various user experience issues within our [Component Library documentation](https://docs.mobify.com/progressive-web/latest/components/all/).

### Application Cache

- Resolved an issue in which rendering HTML for different device types (such as mobile or tablet) during local development was failing. Instead of being served HTML for mobile or tablet, developers were only being served Desktop markup.


## <span class="c-label c--known">Known Issues</span>
- When using the [Analytics Integrations](https://docs.mobify.com/progressive-web/latest/analytics/analytics-integrations-overview/) Engagement Engine connector, subsequent page loads are tracked inaccurately.
- When using the [Salesforce Commerce Cloud connector](https://docs.mobify.com/progressive-web/latest/integrations/commerce-integrations/#setting-up-the-salesforce-connector), product filtering returns zero results.

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS RELEASE:</b></p></div>
