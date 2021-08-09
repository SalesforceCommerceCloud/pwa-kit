## Introduction  

<div class="c-callout">
  <p>
    <strong>Note:</strong> The Salesforce Commerce Concepts series is designed to dive into some of the more challenging topics you may encounter when working with Salesforce B2C Commerce. If you're new to working with Mobify's Salesforce Connector, we suggest reviewing <a href="../../integrations/commerce-integrations/#setting-up-the-salesforce-connector">our Salesforce Connector docs</a>.
  </p>
</div>

This guide builds on lesson one in this series, on session bridging. (If you haven’t covered it yet, we suggest [starting there](../salesforce-commerce-concepts-session-bridging).) There are a few checkout features that are *not* handled by session bridging. In this lesson, you will learn about those checkout features and some tips as you devise your approach, so you can limit the likelihood of getting stuck along the way. 

## Essential prerequisites

To get the most out of this guide, make sure you:  

- If you’re *not* a backend developer yourself, you’ll need to make friends with one, as a lot of the tactics discussed in this guide require backend development expertise. Often, projects require changes to expose more data using requests to the Salesforce Commerce Cloud Open Commerce API, (OCAPI). The best case scenario is being able to work with a backend developer who understands the site’s OCAPI implementation. This will allow you to make changes to the site that will save you from having to scrape the data from desktop, or send multiple requests to get the same data.
- Complete our initial [Salesforce Connector setup steps](../../integrations/commerce-integrations/#setting-up-the-salesforce-connector).
- Have Salesforce B2C Business Manager access for the development environment (not the production environment). This is very useful for debugging and testing certain kinds of issues, such as when the availability of a product changes.
- Be able to access the [Salesforce Documentation](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp), so you can pause and review the underlying API when necessary.

## Checkout

There are a few checkout features that deserve special attention, as they are not handled by [session bridging](../salesforce-commerce-concepts-session-bridging):

1. Storefront-only logic
2. Creating the storefront basket
3. Multi-ship
4. Flash messages
5. Rebridging the session after an order has been placed 

Let's take a look at each of these in more detail.


### Storefront-only logic

Your site may have custom logic in the checkout that is only applied to storefront baskets, and not to OCAPI baskets. The most common places to look for this are in tax calculation, address verification and order submission. For example, if tax is only calculated for the storefront basket, you may not see the correct tax value in the response for the OCAPI basket. If you can identify a case of storefront-only logic, work with your team's backend developer to ensure that this logic will also run on OCAPI baskets. For example, you may be able to add custom endpoints to the storefront.

It's best to check for cases of storefront-only logic as early as possible to give your backend developers enough time to make any changes, in the case that they need to use a more time-intensive approach. For example, in one Mobify Platform project, we built checkout using OCAPI but found that we could not add the custom endpoints to checkout with an OCAPI basket. As a result, we had to rebuild the checkout using desktop scraping. Save yourself rework and identify if an OCAPI checkout is possible early in the process! 


### Creating the storefront basket

For performance benefits, the storefront _lazily_ creates the user's basket. Creating a basket is an expensive operation on the backend, so the storefront waits to create that basket, delaying until it's actually needed. As a result, most often the basket is not created until the user actually adds an item to the basket.

When using the storefront and OCAPI, there is an important implication for creating baskets. The creation of the OCAPI basket is not tied to the creation of the storefront basket. (Generally, we create the OCAPI basket much earlier.) However, creating the storefront basket has an important effect on the OCAPI basket: when the storefront basket is created, it will mutate the OCAPI basket. Typically the items in the basket stay the same, but anything else added to the basket such as promo codes, shipping addresses, or payment methods will be _removed_. As a result, you will want to manually create the storefront basket as early as possible so that you don't start modifying the OCAPI basket only to lose your changes.

Usually, you can manually trigger the creation of the storefront basket by sending an HTTP GET request to the desktop cart page _after_ an item has been added to the OCAPI basket. This request will typically force the storefront basket to be created. Note that session bridging needs to occur _before_ you force the creation of the storefront basket.

Typically, it's ideal to send this request *after* the first time the user adds an item to their cart. You should also send this request when the user navigates to their cart page, if they have items in the cart and you have not sent the request already. (For example, if the user has refreshed the page.) You can keep track of this using the redux store.

The implementation will differ slightly for each site. For each unique project, we suggest asking the backend developer how their storefront implementation creates the basket.

### Multi-ship

Currently, the Salesforce Connector does not support using multiple shipping methods by default. If your project uses multiple shipping methods, you will need to implement this logic manually.

### Flash messages

You will need to manually check for flash messages on a basket before attempting to create an order, as the Salesforce Connector does not do this automatically. Flash messages indicate that the basket is invalid and that it likely cannot be submitted in its current state. You can also create custom flash messages that might not block placing an order, but likely still need to be handled or communicated to the owner of the site.

### Rebridging the session after an order has been placed

If you submit an order using the storefront endpoint, the storefront basket can become out of sync with the OCAPI basket. Here's how that would occur: after order submission, both the storefront and OCAPI baskets are destroyed. Next, when OCAPI attempts to create a new basket, this new basket is not picked up by the storefront, even if the session is bridged. This is true even after you add items to the OCAPI basket and request the storefront cart page.

In order to force the storefront to pick up the OCAPI basket, we need to make a POST to the OCAPI sessions endpoint. This will update your session cookies (`dwanonymous`, `dwsecuretoken` and `dwsid`). Once those cookies are updated, the storefront will create a basket based on the new OCAPI basket.

In general, use the following approach depending on where your order submission occurs:

*   If your order submission occurs within the PWA, it's best to make this request _after_ an order has been submitted. 
*   If it occurs on the desktop site, you can handle this when fetching data for the cart page. When fetching the cart data, get the number of items in the OCAPI basket and the number of items in the storefront basket (possibly through scraping). If the number of items in each basket does not match, POST to `/sessions`.


## Wrap up

In this lesson, you learned about specific features in checkout that require special attention. As a general takeaway, there are many challenges associated with session bridging. If and when possible, you can avoid many of these challenges by adding APIs and updating OCAPI implementations.

After reading this guide, we hope you can anticipate some of the most common pitfalls you may encounter when building Mobify Platform projects with Salesforce B2C Commerce, and start making informed decisions.  

To continue learning about Salesforce Commerce concepts, check out our next lesson, which is all about [Content Slots](../salesforce-commerce-concepts-content-slots).

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>