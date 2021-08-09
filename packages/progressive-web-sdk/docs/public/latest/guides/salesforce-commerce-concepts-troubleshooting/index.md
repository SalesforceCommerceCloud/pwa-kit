## Introduction  

<div class="c-callout">
  <p>
    <strong>Note:</strong> The Salesforce Commerce Concepts series is designed to dive into some of the more challenging topics you may encounter when working with Salesforce B2C Commerce. If you're new to working with Mobify's Salesforce Connector, we suggest reviewing <a href="../../integrations/commerce-integrations/#setting-up-the-salesforce-connector">our Salesforce Connector docs</a>.
  </p>
</div>

This lesson focuses on troubleshooting common issues that can arise while working with Salesforce B2C Commerce backend.

## Essential prerequisites  

To get the most out of this guide, make sure you:  

- If you’re *not* a backend developer yourself, you’ll need to make friends with one, as a lot of the tactics discussed in this guide require backend development expertise. Often, projects require changes to expose more data using requests to the Salesforce Commerce Cloud Open Commerce API, (OCAPI). The best case scenario is being able to work with a backend developer who understands the site’s OCAPI implementation. This will allow you to make changes to the site that will save you from having to scrape the data from desktop, or send multiple requests to get the same data.
- Complete our initial [Salesforce Connector setup steps](../../integrations/commerce-integrations/#setting-up-the-salesforce-connector).
- Have Salesforce B2C Business Manager access for the development environment (not the production environment). This is very useful for debugging and testing certain kinds of issues, such as when the availability of a product changes.
- Be able to access the [Salesforce Documentation](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp), so you can pause and review the underlying API when necessary.

## Troubleshooting

In this section, we'll go through the most common issues you may need to troubleshoot during a Mobify project with a Salesforce backend.


### iOS and basic auth

Salesforce Commerce development environments are often protected using [Basic HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication) which uses the Authorization HTTP header. Unfortunately, OCAPI authentication using JWT also uses the Authorization HTTP header. The Safari browser cannot provide both Basic HTTP authentication and JWT authentication. The JWT authentication header is not correctly sent and OCAPI requests fail.

To test the PWA on Safari, disable basic authentication on your Salesforce Commerce environment. If the environment must be protected, use another method of access control like IP whitelisting instead.


### PUT methods

OCAPI requests using the PUT method no longer work on staging or production environments. Instead, a POST method must be used with the `x-dw-http-method-override` header. Read more in the [Salesforce Documentation](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp), and in the [Salesforce developer community](https://xchange.demandware.com/message/82112).


### Locales and the service worker

Often, Salesforce Commerce sites with multiple locales will not be able to serve `service-worker-loader.js` from the root of the site. For example, it is available from `demandware.example.com/en-ca/service-worker-loader.js`, but not `demandware.example.com/service-worker-loader.js`. While we normally want to host the loader from the root so that it is able to handle all requests on the domain, most requests on the site will actually be within the domain, which makes this approach acceptable. However, you will need to customize the logic for loading the service worker. The utils for loading the service worker in the SDK currently assume that the SW will be present at the root, so these utilities need to be overridden in your project.

At the moment, the easiest way to do this is to create a new file in your project for the service worker utils. In that file, provide your own versions of the `loadWorker` and `getServiceWorkerURL` utilities that include the locale. Finally, update `loader.js` to import your local copy of `loadWorker` instead of the one from the SDK.


### Routing

The SDK's router works best when you can use a pattern in the URL to determine which template to render. Often this is not the case for various pages on Salesforce Commerce projects, especially category landing pages and product listing pages. On tag-loaded PWAs, we address this by using the [SelectorRouter](../../guides/routing/#the-selectorrouter-and-selectorroute-components). This router sends a request to the desktop site, and we can search the DOM of the desktop site for a particular selector. This is much slower than routing purely based off of the URL, so it should be used sparingly.


## Wrap up

After reading this guide, we hope you can troubleshoot some of the common issues we've seen during Mobify builds with Salesforce B2C Commerce. 

After completing this guide, you may want to review previous lessons in this series, such as [session bridging](../salesforce-commerce-concepts-session-bridging), or [checkout](../salesforce-commerce-concepts-checkout).

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>