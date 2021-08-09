Released on February 6th, 2020 which corresponds to version `1.16.0` for the v1.0 stream of our SDKs and version `2.0.0-preview.2` for the v2.0 stream of our SDKs.

In this release, we’re shipping a new architecture for rendering server side content for the upcoming v2.0 release of our SDKs, and also shipping a large number of bug fixes for both v1.0 and v2.0 streams of our SDKs.

As a reminder, in [November](../2019-november) we announced that we're preparing for a Version 2.0 release to support Node.js server-side rendering. To ease the transition, we'll be releasing two versions: Version 1, and a Version 2.0 release candidate, `2.0.0-preview`. As a release candidate, developers can expect the code to frequently change with continued iteration, and can also expect breaking changes to occur.

For full detail of the version 2.0 release plan, check out our announcement in our [November 2019 release notes](../2019-november).

## <span class="c-label c--updates">Updates</span>

### PWA (Progressive Web App) SDK

#### Express.js compatible server side rendering architecture (Version 2.0 release candidate only)
The SSRServer class within the PWA SDK is Mobify’s main entry point for developers to access [server side rendering](https://docs.mobify.com/progressive-web/2.0.0-preview.1/architecture/server-side-rendering/) (SSR), and all the features associated with SSR. Previously, the `SSRServer` contained an Express.js application within it. Now, we’ve refactored the `SSRServer` to instead become an Express application itself, which brings the following benefits:

- As Express.js is widely-used and well understood, developers should have a much easier time working with the `SSRServer` for their projects. Developers building SSR projects will require less Mobify-specific domain knowledge.
- Many developers have asked us what we can and can’t run on the Mobify Platform. This change seeks to make this clear-- if it’s an Express.js application, we can run it!

## <span class="c-label c--bugs">Bug Fixes</span>

### PWA SDK
- Updated the PWA SDK’s peer dependencies for React and ReactDOM to `>=16.8`. In the January 2020 release, we added features which depend on React 16.8 but didn’t appropriately update its peer dependencies to reflect this.
- Addressed an issue with the [Analytics Integrations](https://docs.mobify.com/progressive-web/latest/analytics/analytics-integrations-overview/) library, which was tracking subsequent page loads inaccurately.
- Addressed an issue in which device type detection wasn’t working during server-side rendering (Version 2.0 release canadidate only).

### Commerce Integrations
- Addressed an issue with the [Salesforce Commerce Integrations Connector]((https://docs.mobify.com/progressive-web/latest/integrations/commerce-integrations/#setting-up-the-salesforce-connector)), where product filtering was not returning results. The issue was the result of a [backwards-incompatible change](https://help.salesforce.com/articleView?id=b2c_20_1_W6869118_ocapi_product_search_comma_fix_as.htm&type=5) with the Salesforce OCAPI product search endpoint.
    
### Others
- Resolved an issue in which Mobify Tag Preview was not functioning correctly on iOS 13.3.
- Resolved a bug which was preventing Mobify partner developers from accessing log files for [server-side rendered](https://docs.mobify.com/progressive-web/2.0.0-preview.1/architecture/server-side-rendering/) PWA projects.
- Resolved a bug in the [Mobify API](https://docs.mobify.com/api/cloud/#api-Target_Management), in which targets that had previously been deleted were continuing to appear in the project’s list of targets.    


## <span class="c-label c--known">Known Issues</span>

None!

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS RELEASE:</b></p></div>
