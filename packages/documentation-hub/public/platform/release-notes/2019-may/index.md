Released on May 16, 2019

In this release, we've made enhancements to Progressive Web Apps (PWAs), the Mobify Testing Framework, and the PWA Scaffold.

- `progressive-web-sdk @1.10.0`  -
  [Changelog](https://docs.mobify.com/progressive-web/latest/changelog/web-sdk/)
- `mobify-amp-sdk @1.2.0` -
  [Changelog](https://docs.mobify.com/amp-sdk/latest/references/changelog/)
- `mobify-progressive-app-sdk @3.0.6` - [Changelog](http://astro.mobify.com/changelog/)
- `@mobify/commerce-integrations @1.2.0` -
  [Changelog](https://docs.mobify.com/commerce-integrations/latest/changelog/)

## <span class="c-label c--features">Features</span>

### Progressive Web Apps

#### Request Processor

To make your server-side rendered PWA as fast as possible, engineers working on the Mobify Platform have to develop cacheable pages with a high cache hit ratio. The challenge is that there’s often a need for unique URLs, such as query parameters appended for tracking unique visitors. These unique URLs violate the cache key, resulting in a slow response, as the request cannot be resolved from the cache. The Request Processor addresses this issue. It’s an interface that allows Mobify Platform engineers to customize the path and query parameters for requests, so that the unique URLs can be used, without the negative impacts to cache-based performance.

A key use case of this feature is to map a large number of URLs to a smaller set of URLs to drastically improve your PWA’s cache hit ratio. For example, you can use it for query parameter filtering. When a URL is requested from the content delivery network, query parameter filtering can edit the set of query parameters, removing any query parameters that would affect caching beyond those required by the server. The content delivery network can then better cache responses because URLs are more likely to match. To learn more about using the Request Processor to optimize your site’s performance, please read our guide, [Query Parameter Filtering for Server-side Rendered PWAs](https://docs.mobify.com/progressive-web/latest/guides/query-parameter-filtering/).

#### Track Server-Side Timing
In an effort to help developers understand the performance of their site and iterate over time, we’ve developed a new feature that tracks the server-side timing of a page load in the source of the page.

To use this new tool, simply load a page and <b>Inspect</b> it to see how long each element of your page takes to load. We believe this new feature will allow you to understand your build in more detail, and identify where you can make the most critical improvements.


## <span class="c-label c--updates">Updates</span>

### Progressive Web Apps Scaffold

#### Connector Enhancements

To give developers more guidance as they start to implement the Commerce Integrations interface for their projects, we've made a number of adjustments to the connector which gets generated out of the box with the scaffold.

Inline examples and instructions have been added to the generated connector, along with a template for each of Mobify's supported connector types. With these improvements, developers will have all the information they'll need to set up their connector.

#### Developer Server Output Cleanup

Previously when developers would start up their local development server, they'd encounter verbose log output. We've dialed that back so you will only see the critical information: warnings, errors, and the URL where you can access the development server.

### Mobify Test Framework

#### Configurable Lighthouse Options

Projects leveraging the [Mobify Test Framework](http://docs.mobify.com/mobify-test-framework/latest/) will now be able to adjust Lighthouse options and values, such as the minimum Lighthouse scores they'd like their project to meet. This can be done directly in a PWA project's `package.json` file by adjusting the values for the `testFrameworkConfig` object in there.

### Progressive Web Apps

#### Updated SDK to JSDom 14.0.0

As part of this release, the SDK has been updated to use JSDom 14.0.0. This improves the performance of the PWA and enables Mobify to further improve our feature set by being on the latest version of JSDom.

## <span class="c-label c--bugs">Bug Fixes</span>

### Native apps

- Adjusted the [AnchoredLayoutPlugin](http://astro.mobify.com/latest/api-reference/anchored-layout/) on iOS so that web content inside of an AnchoredLayoutPlugin will no longer be visible under the header bar and tab bar.

### Progressive Web Apps

- Resolved an SEO issue where web crawlers would intermittently pick up a Mobify-injected tag and display the contents of that tag as the page's meta description rather than the page's actual meta description.
- On non-PWA pages, performance and page view analytics events are still being tracked. Intermittently, a race condition would occur causing the `platform` field for these analytic events to not be set. We've resolved this race condition so the `platform` field will always be set.
- The [NavSlider](https://docs.mobify.com/progressive-web/latest/components/#!/NavSlider) component previously had styles that caused any new items introduced to be displaced either above or below each other, causing jarring animations. We've adjusted the styles on the component for smooth transitions.
- We resolved an issue for server-side rendered PWAs where a build-up of memory usage caused slow response times for shoppers.
- We fixed an issue for query parameters attached to server-side rendered PWA requests, which were being re-ordered alphabetically by the system. With this fix, query parameters should retain their original ordering as they go through the system.
- We resolved an issue for the image carousel component, which was producing non-centered images in Internet Explorer 11 and Safari 12. We’ve adjusted this component so the images are centered on those browsers.


## <span class="c-label c--known">Known Issues</span>

None!

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS RELEASE:</b></p></div>
