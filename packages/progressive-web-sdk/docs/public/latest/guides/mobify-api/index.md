<div class="c-callout">
  <p>
    <strong>Note:</strong> The Mobify API is under active development. Not all resources and actions available through the Mobify Cloud dashboard are currently available through the API.
  </p>
</div>


## Introduction

The Mobify API allows you to interact with resources via a [RESTful](https://developer.mozilla.org/en-US/docs/Glossary/REST) interface:

* **Projects** represent a specific application. _Projects have targets and bundles._
* **Targets** are environments that run your app. _They might be named and long lived like `production` or `staging`, or disposable and short lived like `september-load-testing` or `homepage-add-new-hero-banner`._
* **Bundles** are app code at a specific point in time. _They are immutable artifacts containing JavaScript and other resources to run your app._
* **Deployments** put the code from a bundle onto a target.

**[Access our Mobify API Reference →](https://docs.mobify.com/api/cloud/)**

## Before you begin

To use the API, you need a [Mobify API Key 🔑](https://cloud.mobify.com/account/). The key must be included in the HTTP request `Authorization` header with the value `Bearer $MOBIFY_API_KEY`.

<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> Treat your API key like a password as it allows scripts to perform operations on your behalf.
  </p>
</div>

You can make API requests using tools like [`curl`](https://curl.haxx.se/docs/manpage.html) or [Postman](https://www.getpostman.com/).

<div class="c-callout">
  <p>
    <strong>Note:</strong> To follow along in this tutorial, replace the Project ID with your own Project's ID. You can find it on your project's <strong>Settings</strong> page in <a href="https://cloud.mobify.com/">Mobify Cloud</a>.
  </p>
</div>

## Tutorial

Let's begin to learn the API by walking through an example step by step, using Mobify’s `training` project.

By default, projects start with a target called `production`. Often, it's useful to create non-production targets for testing.

First, we will list the `training` project's targets:

```bash
curl 'https://cloud.mobify.com/api/projects/training/target/' \
  --header "Authorization: Bearer $MOBIFY_API_KEY"
```

Second, let's create a new target, `staging`, that we can use to verify changes before deploying them to `production`:

```bash
curl 'https://cloud.mobify.com/api/projects/training/target/' \
  --request 'POST' \
  --header "Authorization: Bearer $MOBIFY_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"name": "staging"}'
```

_To use your new target, you must deploy a bundle to it in Mobify Cloud._

Third, let's review the details of the `staging` target we created:

```bash
curl 'https://cloud.mobify.com/api/projects/training/target/staging/' \
  --header "Authorization: Bearer $MOBIFY_API_KEY"
```

Finally, let's modify our `staging` target to set its configured [proxies](https://docs.mobify.com/progressive-web/latest/reference/upwa/proxying/):

```bash
curl 'https://cloud.mobify.com/api/projects/training/target/staging/' \
  --request 'PATCH'  \
  --header "Authorization: Bearer $MOBIFY_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"ssr_proxy_configs": [{"host": "api.example.com"}]}'
```

_Changing the configuration will cause the current bundle to be re-deployed automatically so that the changes can take effect._

If you're having trouble with the above commands:

-   Try using `curl`'s `--fail` argument to display errors.
-   Check your [API key](https://cloud.mobify.com/account/).
-   Check your [project's ID](https://cloud.mobify.com).
-   API endpoints also work in browser. Log in to [Mobify Cloud](https://cloud.mobify.com) then open the endpoint you are using directly in your browser.

**[Access our list of Target API endpoints →](https://docs.mobify.com/api/cloud/#api-Projects-CreateTargets)**

## Another example: restricting target access to specific IPs

<div class="c-callout">
  <p>
    <strong>Note:</strong> Use these steps only when your security policy requires you to restrict access to environments by IP. <em>In the general case, we recommend restricting access using <a href="https://en.wikipedia.org/wiki/Basic_access_authentication">HTTP authorization</a> or a secret HTTP header checked in request processor or the app server.</em>
  </p>
</div>

Now let’s look at another example. Consider the `staging` target we created above, and imagine we wanted to restrict access to specific IPs. You can restrict access to `staging` using the Mobify API by updating its `ssr_whitelisted_ips`.

First, we will fetch the settings for the `staging` target:
```bash
curl 'https://cloud.mobify.com/api/projects/training/target/staging/' \
  --header "Authorization: Bearer $MOBIFY_API_KEY"
```

Next, we will update `staging` by passing in the set of IPs that will be allowed access.

```bash
curl 'https://cloud.mobify.com/api/projects/training/target/staging/' \
  --request 'PATCH'  \
  --header "Authorization: Bearer $MOBIFY_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"ssr_whitelisted_ips": "104.255.11.140/32,104.255.11.141/32"}'
```

Note: IPs in `ssr_whitelisted_ips` use <a href="https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing">CIDR format</a> and are comma separated.

Following these steps, you can modify any of the target settings returned by the JSON object in the first step!

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>
