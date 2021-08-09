## Introduction

Mobify releases a new version of `progressive-web-sdk` every six weeks, including new features, enhancements to the SDK and scaffold, bug fixes, security patches, and key product documentation. To facilitate smooth upgrades for our partners and customers, releases are designed to incrementally improve the Mobify Platform, rather than introducing large breaking changes.

Improvements to our backend infrastructure are done outside of the product release process, in a system of continuous improvement. As a result, they’re not versioned. Examples include our Application Delivery Network and Mobify Cloud.

We recommend staying up to date with the latest Mobify Platform version, to access the latest features, patches, and bug fixes. To find a detailed summary of each release, check out our [Release Notes](../../../../platform/release-notes/).

## Mobify Platform repository structure

Prior to March 2019, the packages Mobify publishes to NPM used an independent versioning scheme. That meant, for example, that a Mobify Platform release may have included version 1.2.3 of the `progressive-web-sdk` and version 3.2.1 of `@mobify/commerce-integrations`.

In March 2019 we switched to a synchronized versioning scheme, which makes it easier to understand which package versions were released together, and have been tested to work together by Mobify. If you're upgrading packages in your project we recommend updating all Mobify packages together, to the same version number.

The following packages have used synchronized version numbers since version 1.11:

- `progressive-web-sdk`
- `@mobify/commerce-integrations`
- `@mobify/documentation-theme`
- `@mobify/test-framework`

## Checking your Mobify Platform version number

There are two ways to look up your version of the Mobify Platform. 

For one, you can find your `progressive-web-sdk` version inside the `package.json` file, which is found under your project's root folder. For projects operating on version 1.10 or lower, the `package.json` file will show the versions for each library.

You can also use our handy [DebugInfo SDK Component](../../components/#!/DebugInfo). This Component is a helpful tool for developers throughout the build, bringing together several important sources of information including the version of `progressive-web-sdk`. Just place the Component anywhere on a page, and it will automatically retrieve the available information.

## Milestones in Mobify Platform versions

The following list summarizes major technical milestones in Mobify’s Progressive Web SDK. For a full list of changes, visit our [Release Notes](../../../../platform/release-notes/). Typically, we find that partner developers are most interested in knowing their version for the project scaffold (project starting point), and knowing their version for our Commerce and Analytics Integrations SDKs.

### 2019

| Technology                                                                                                             | What is it?                                                                                                                                                                                                                                   | Release Date                                                             | Applicable Versions       |
|------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|---------------------------|
| [Mobify API: Target Management](https://docs.mobify.com/api/cloud/#api-Target_Management)                                             | An API for partner and customer developers to manage their own deployment targets.                                                                                                                                                            | [July 2, 2019](../../../../platform/release-notes/2019-july/)            | v1.11.0 and later        |
| Synchronized versioning                                                                                                | Beginning in July 2019, all packages and libraries within the monorepo are all synchronized, released at the same time under the same version. (Previously, each library had its own unique version.)                                         | [July 2, 2019](../../../../platform/release-notes/2019-july/)            | v1.11.0 and later        |
| [Analytics Integrations](../../analytics/analytics-integrations-overview/)                                             | Mobify's API to integrate analytics services. Replaces the [Analytics Manager](../../analytics/legacy-analytics-manager/), and is intended to give developers more control over their analytics implementation.                          | [July 2, 2019](../../../../platform/release-notes/2019-july/)            | v1.11.0 and later        |
| Documentation site redesign                                                                                            | New documentation site look and feel.                                                                                                                                                                                                         | [March 28, 2019](../../../../platform/release-notes/2019-march/)         | v1.9.0 and later         |
| [Mobify Test Framework](../../testing/mobify-test-framework/)                                                          | A package of testing tools for end to end and performance testing.                                                                                                                                                                            | [January 10, 2019](../../../../platform/release-notes/2019-january)      | v1.0.4-alpha.0 and later |
| New project starting point                                                                                             | Generated projects come with a starting point “scaffold”, essentially a template with some of the foundational PWA Components already implemented. Note that project starting points are not released as part of the product release process. | [January 10, 2019](../../../../platform/release-notes/2019-january/)     | v1.0.4-alpha.0 and later |

### 2018

| Technology                                                                                                                     | What is it?                                                                                                                              | Release Date                                                             | Applicable Versions |
|--------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------|---------------------|
| [Server-Side Rendered Progressive Web Apps (PWAs)](../../architecture/#2.-server-side-rendered-pwas) | Server-side rendering architecture, enabling Mobify’s fastest PWAs to date. (Originally called Universal Progressive Web Apps or UPWAs.) | [November 15, 2018](../../../../platform/release-notes/2018-november/)   |v1.6.0 and later    |
| [Commerce Integrations](../../integrations/commerce-integrations/)                                                             | API to integrate ecommerce backends. Replaces [Integration Manager](../../integrations/integration-manager/).                            | [September 27, 2018](../../../../platform/release-notes/2018-september/) | v1.0.0 and later   |
| [Performance Manager](../performance/)                                                                                         | An SDK tool which allows partner and customer developers to control and configure features that affect PWA performance.                  | [August 16, 2018](../../../../platform/release-notes/2018-august/)       | v1.4.0 and later   |

### 2017

| Technology                                                     | What is it?                                                                                                                            | Release Date  | Applicable Versions  |
|----------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|---------------|----------------------|
| [Integration Manager](../../integrations/integration-manager/) | API to integrate ecommerce backends. (Replaced in 2018 by [Commerce Integrations](../../integrations/commerce-integrations/).) | June 22, 2017 | v0.15.0 to v1.4.0 inclusive |
| [Mobify UI Kit](../../../../design/design-phase/ui-kit/)       | A ready-to-use collection of Sketch design files that pair with Mobify’s SDK Components to build ecommerce pages.                      | May 25, 2017  | v0.15.0 and later   |
| [Analytics Manager](../../analytics/legacy-analytics-manager/) | API to integrate analytics services. (Replaced in 2019 by [Analytics Integrations](../../analytics/analytics-integrations-overview/).) | May 24, 2017  | v0.15.0 to v1.10.0 inclusive |

### 2016

| Technology                    | What is it?                                                                                                      | Release Date  | Applicable Versions |
|-------------------------------|------------------------------------------------------------------------------------------------------------------|---------------|---------------------|
| [Progressive Web SDK](../../) | Mobify’s core Software Development Kit. Includes a set of components and utilities for building performant PWAs. | July 28, 2016 | v0.0.1 and later   |

### Prior to 2016

| Technology   | What is it?                                                                                                                                                     | Release Date | Applicable Versions                                                |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|--------------------------------------------------------------------|
| Mobify Cloud | Command line interface and backend infrastructure to manage the deployment of apps on the Mobify Platform.                                                      | 2012         | v0.0.1 and later. Note that Mobify Cloud is released continuously. |
| Mobify Tag   | A way of loading PWAs through a snippet of HTML and JavaScript, which loads the PWA into an existing web page. (Replaced in 2018 by server-side rendered PWAs.) | 2011         | v0.0.1 and later                                                   |




<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>