## Introduction    

<div class="c-callout">
  <p>
    <strong>Note:</strong> The Salesforce Commerce Concepts series is designed to dive into some of the more challenging topics you may encounter when working with Salesforce B2C Commerce. If you're new to working with Mobify's Salesforce Connector, we suggest reviewing <a href="../../integrations/commerce-integrations/#setting-up-the-salesforce-connector">our Salesforce Connector docs</a>.
  </p>
</div>

In this lesson, we will dive headfirst into session bridging, which is one of the most challenging topics you may encounter when working with Salesforce B2C Commerce. We will walk you through the storefront, the session bridging problem it introduces, and some approaches to address that problem. By the end of the lesson, you will appreciate the advantages of working purely with OCAPI for all of your PWA’s data and functionality. 

## Essential prerequisites  

To get the most out of this guide, make sure you:  

- If you’re *not* a backend developer yourself, you’ll need to make friends with one, as a lot of the tactics discussed in this guide require backend development expertise. Often, projects require changes to expose more data using requests to the Salesforce Commerce Cloud Open Commerce API, (OCAPI). The best case scenario is being able to work with a backend developer who understands the site’s OCAPI implementation. This will allow you to make changes to the site that will save you from having to scrape the data from desktop, or send multiple requests to get the same data.
- Complete our initial [Salesforce Connector setup steps](../../integrations/commerce-integrations/#setting-up-the-salesforce-connector).
- Have Salesforce B2C Business Manager access for the development environment (not the production environment). This is very useful for debugging and testing certain kinds of issues, such as when the availability of a product changes.
- Be able to access the [Salesforce Documentation](https://documentation.b2c.commercecloud.salesforce.com/DOC1/index.jsp), so you can pause and review the underlying API when necessary.

## OCAPI and the storefront

When working with Salesforce B2C Commerce, we need to consider both the Open Commerce API (OCAPI) and the storefront. Think of them as two different ways to interact with the same underlying data. 

OCAPI, as its name suggests, provides an API that can be used to interact with this underlying data. With an API, maintenance is predictable. APIs are bound by contracts which require changes to be backwards compatible.

The storefront provides a website - this is the existing desktop website. If you wish to interact with the underlying data, you must use scraping to get data and submit HTML forms to update data. When using scraping, maintenance is unpredictable. When the HTML of a website changes, the integration must change with it.

In order to achieve a truly headless architecture, your PWA should rely exclusively on OCAPI for integrating with Salesforce Commerce.

However, there may be cases where the functionality present in OCAPI and the storefront is different. For example, some features may only be available on the storefront.

Whenever possible, those cases should be addressed by extending OCAPI. Custom endpoints should be created which add the missing functionality to OCAPI.

If this is not possible, then you will need to use both OCAPI and the storefront. This will require you to take some steps to sync the user’s state between the two code bases. In this tutorial, we will walk you through the most common syncing issues and possible solutions. Your implementation may be unique due to how your OCAPI is set up, but there’s a lot that can be applied across implementations.  

### Why would a PWA need to use the storefront?  

There are two main reasons why your PWA may need to use the storefront in addition to OCAPI:

1. **Storefront functionality is not present in OCAPI, or the storefront works differently than OCAPI.** For example, with features like PayPal, address verification and tax calculation, the functionality will only work with baskets that have been created by the storefront. These features may not work with baskets created by OCAPI. You may also encounter important storefront-only code being executed after an order is submitted, which is necessary to process the order correctly. In these cases, if you do not bridge the session, you will not be able to take an action through the storefront and have it update the basket you’re using in OCAPI.  

2. **The PWA may not be loading for all pages across the site.** If the user is able to navigate outside of the PWA, you will want their state to be synced so that any non-PWA pages display the correct information. As examples, you will want to make sure that they stay logged in across the site, and that their basket will work if the checkout isn’t included in the PWA.

To synchronize state between OCAPI and the storefront, we need to use the **session bridge**, which is a concept from Salesforce B2C Commerce.

### Session bridging

A JSON Web Token (JWT) is used to persist a user’s session in OCAPI, while session cookies are used to persist a user’s session on the storefront. The session bridge allows us to sync states by turning a JWT into session cookies, or vice versa. This allows us to share the same session across both OCAPI and the storefront.

For a tag-loaded PWA, we will typically get the session cookies from the storefront first, and then exchange these for a JWT. When we send requests to OCAPI using that JWT, any actions we perform will use the current storefront session. Read on below for more detail about this process.

In contrast, for a server-side rendered PWA, we will typically start by requesting the JWT from OCAPI first. When necessary, we will exchange the JWT for session cookies if we need to send requests to the storefront.

#### The process

Here’s what session bridging might look like when starting up a **tag-loaded PWA**:  

- The user sends an HTTP request to `demandware.example.com`
- The HTTP response from `demandware.example.com` includes a `Set-Cookie` header  
    - This header contains* the session cookies - `dwanonymous`, `dwsid` and `dwsecuretoken`.
    - These cookies should be `httpOnly` so it’s unlikely you will be able to see them using `document.cookies`. Instead, inspect the HTTP responses in the **Network** tab
- The browser sets the session cookies based on the `Set-Cookie` header.
- The PWA sends a request to the `customers/auth` endpoint to start a session. This request includes the session cookies
- The HTTP response from OCAPI contains a JWT that corresponds to the session cookies provided
- The PWA stores the JWT to use for future requests. For example, it might be stored in sessionStorage
- After the session has been bridged, the PWA can now make requests that require the JWT. This includes requests for customer specific information, such as the basket. *The PWA should not request the basket before the session has been bridged; if it does, the request will fail.*

 \*Note that your response should contain the session cookies, but it might not if your site has multiple locales. On one project, the response from `demandware.example.com/en-uk/` (where the user landed) did not contain the session cookies. Instead, we needed to send an additional request to `demandware.example.com/` to get the correct cookies.

<figure class="u-text-align-center">

  ![Session bridging](session-bridging.png)

</figure>

After the session has been bridged, we are in a state where the JWT and the session cookies point to the same session. This is very important; we can only access storefront functionality if the storefront and OCAPI are in the same session. However, it is possible for the session cookies to change and point to a different session from the JWT. This can happen when the user logs *in* or *out* of the storefront site.

Next, we’ll examine each of these cases and discuss some possible solutions. For each case, consider whether you will need to handle it within your PWA.

##### Syncing logins that occur on the storefront  

User logins are a key situation where states can become out of sync. When the user completes a login using the desktop site, they are likely logging in via the storefront instead of OCAPI. This means that the session cookies will be updated, but the JWT will not be up to date. Then, a user may have logged in to the desktop site but not the PWA, because they have not logged in to OCAPI. If the login page is responsive, the user will never be able to login to the PWA. 

To address this issue, do the following:

1. Determine when the desktop site is in the logged-in state. This could be done by inspecting `document.cookies`, or if necessary, by scraping the desktop site**. 
2. Determine if the user is logged in via OCAPI. To do this:
    1. Get the `customer_id`. This is stored inside the JWT. The JWT consists of a header, payload and signature separated by a `.`. Each part is encoded. Split the token into parts and use [atob](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/atob) to decode the payload
    2. Send a GET request to the `/customers/<customer_id>` endpoint
    3. Check the response for the value `auth_type`. If `auth_type` is `guest`, the user is *not* logged in via OCAPI. If the `auth_type` is `registered`, the user *is* logged in via OCAPI.
3. If desktop is logged in and the PWA is not:
    1. If you have stored your `basket ID` and JWT, delete them.
    2. Request a new session from OCAPI using the `/customers/auth` endpoint. This request must include your session cookies. It will return a new JWT. This JWT will now point to a session that is logged in to the same account as the storefront.

You should also do this if the desktop site and the PWA are logged into different accounts. You may be able to determine this by comparing the value of the cookie `cqcid` with the `customer_id` that is returned by OCAPI. If they are different, you may be logged into two different accounts.

We suggest that you handle this case if there is any possibility for the user to login from any pages that do not load the PWA.  

**Scraping the desktop site is not ideal as it introduces a dependency on the desktop HTML. HTML can change over time, so it might not be a reliable long term solution to determine if the user is logged in.

##### Syncing logouts that occur on the storefront

Another issue where states become out of sync is with the logout process. When a user chooses to logout using the desktop site, they are likely logging out via the storefront instead of OCAPI. This means that the session cookies will be updated, but the JWT will not be up to date. As a result, a user may have logged out of the desktop site as they intended, but find themselves still logged in to the PWA, because they are still logged in to OCAPI.

To address this issue, do the following:

1. Determine when the desktop site is in the logged in state. This could be done by inspecting document.cookies, or if necessary, by scraping the desktop site.
2. Determine if the PWA is in the logged in state, using the instructions from the previous section.
3. If the desktop site is logged out and the PWA is logged in:
    1. Make a request with the method DELETE to `/customers/auth/`.
    2. Delete your `basket ID` and JWT from `sessionStorage`.
    3. Request a new guest session from OCAPI.
    4. When you get your new JWT, store it in `sessionStorage`.

We suggest that you **always handle this case**, even if there are no pages that do not load the PWA. This is because the storefront session may expire before the OCAPI session, which could log the user out of the storefront even if they do not logout manually.

#### Testing the session bridge on server-side rendered PWAs

In a server side rendered PWA, the user can no longer access the storefront _directly_. In this case, you may decide to use the session bridge to support existing payment integrations, such as PayPal and Apple Pay. To verify that the session bridge has been setup correctly, we suggest testing features between your current session and the existing storefront site. You can test your session bridge by using a code snippet like the one below.

If you paste this code into the console of the existing desktop page and then refresh the browser, it will put the desktop tab into the same session as the PWA.  

````javascript
fetch('$BASEPATH/sessions', {
   method: 'POST',
   credentials: 'same-origin',
   headers: {
       'Content-Type': 'application/json',
       'x-dw-client-id': $CLIENTID,
       'Authorization': $JWT
   }
})

````

## Wrap up  

After reading this guide, we hope you can anticipate some of the common pitfalls when working with Salesforce Commerce, and start making informed decisions.  

As a general takeaway, there are many challenges associated with session bridging. If and when possible, you can avoid many of these challenges by adding APIs and updating OCAPI implementations.  

To continue learning about Salesforce Commerce concepts, check out our next lesson, on [Checkout](../salesforce-commerce-concepts-checkout)




<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>