<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> We've removed this glossary from the site navigation because we've incorporated many of these definitions directly into our articles, but we've left it here in case you still need to refer to it.
  </p>
</div>

## Mobify Platform terms <a name="mobify-platform" href="#mobify-platform">#</a>

Below is a list of words and phrases that have special meaning in the context of the Mobify Platform.

### Project <a name="project" href="#project">#</a>

We use the term _project_ in two different ways.

1. Each PWA based on a website is represented in Mobify [Cloud](#cloud) as a Project. When you log into Cloud, you will see a list of your projects, and you can manage them and their [bundles](#bundle).
2. The set of files on which a developer works when building a PWA is called a _project_. Your CSS, images, JS and JSX files are all part of your project. Project files are collected together and uploaded to Mobify Cloud in a [bundle](#bundle).

### Progressive Web App (PWA) <a name="pwa" href="#pwa">#</a> 

[Progressive web apps (PWAs)](https://developers.google.com/web/progressive-web-apps/)
bring fast, fluid, frictionless mobile experiences that are indistinguishable from a native app. Built into the core functionality of a PWA are techniques that make browsing feel 'native'. Instant page transitions and offline caching mean content is loaded fast on low or no connectivity, without it feeling like a new page is loading each time.

### SSR (Server-side Rendering) <a name="ssr" href="#ssr">#</a>
Server-side rendered PWAs have a code bundle which gets run on Mobify’s servers and is usually served from a cache to maximize speed. These PWAs can render content destined for any device, whether it’s mobile, tablet, or desktop. Learn more about [server-side rendered PWAs](../../architecture/#2.-server-side-rendered-pwas).

### The Mobify tag <a name="tag" href="#tag">#</a>

For [tag-loaded PWAs](../../architecture/#1.-tag-loaded-pwas), the Mobify tag is a snippet of HTML and JavaScript that lets Mobify securely load new code on a web page to optimize the experience for mobile users. In tag-loaded projects, the Mobify tag must be included in the source code for the home page and any other web pages that you want to optimize using the Mobify Platform. The tag for your project is available via your project's Tag page on [Mobify Cloud](#cloud). This code must be included inside the `<head>` tag of any web page using the Mobify Platform.

### Mobify Cloud <a name="cloud" href="#cloud">#</a>

Mobify Cloud (https://cloud.mobify.com) is the website that Mobify customers and partner developers use to manage the code for their Progressive Web Apps (PWAs). Mobify Cloud allows you to preview the code created during development and allows you to publish that code when it's ready to go into production.

### Bundle <a name="bundle" href="#bundle">#</a>

A bundle is a set of files that transforms your site's layout and performance for mobile. The files for your [PWA](#pwa) are collected into the bundle, which is uploaded to Mobify [Cloud](#cloud) and served over the Mobify [CDN](#cdn). The bundle will include CSS, images, JSX and JS scripts.

Uploading a bundle to Cloud is called ["pushing"](#pushing). There may be several bundles pushed up to Cloud. At any one time, one of them may be ["published"](#publishing). The files in the published bundle are used in production. The files in any non-published bundles may be [previewed](#preview) by developers, QA, or testers.

Each bundle has a name that is set when it is [pushed](#pushing). By default, the name is made up from the git hash and repository name, but you can set your own name.

### Content delivery network (CDN) <a name="cdn" href="#cdn">#</a>

The Mobify Content Delivery Network handles all files served from
`cdn.mobify.com`. When a [bundle](#bundle) is [pushed](#pushing) up to the Mobify [Cloud](#cloud), the files are then available via the CDN.

Production files from a [published](#publishing) bundle are available under `https://cdn.mobify.com/sites/<project-id>/production/`.

### Loader <a name="loader" href="#loader">#</a>

The `loader.js` file is part of your bundle. The source is available at
`web/app/loader.js` in your [project](#project). The loader file is loaded from the currently-published [bundle](#bundle) by the Mobify [Tag](#tag).

### Preview <a name="preview" href="#preview">#</a>

The Mobify preview functionality allows you to see changes that you make to your project by just refreshing your local browser, without the need to [push](#pushing) a bundle to Mobify Cloud. It works by running a local server on your development machine, and setting cookies that tell the PWA [loader](#loader) to fetch files and assets from that local server. Local preview is described
[here](../../getting-started/quick-start#previewing-your-new-project).

You can also preview a pushed [bundle](#bundle) before it's published, using `preview.mobify.com`. 

### Non-progressive <a name="non-progressive" href="#non-progressive">#</a>

For [tag-loaded PWAs](../../architecture/#1.-tag-loaded-pwas), the terms _non-progressive_ and _non-progressive mode_ refer to Mobify Platform features supported in browsers that don't load the PWA, such as desktop browsers. For example, Mobify's Push Messaging is supported in a [Progressive Web App](#pwa) and also for a range of non-PWA browsers. See the [guide for non-progressive support](../../guides/non-progressive). Within the Mobify platform code, _non-progressive_ file and variables use the names _non-pwa_ or _nonPWA_.

## Integration Manager terms <a name="integration-manager" href="#integration-manager">#</a>

The Integration Manager predates Mobify's [Commerce Integrations](../../integrations/commerce-integrations/), available for Mobify Platform versions v0.15.0 to v1.4.0 inclusive. It's the layer that isolates the frontend code from the backend service integration. It provides a set of Redux actions and JavaScript objects which form its API. Below is a list of words that have a special meaning in the context of Integration Manager.

### Command <a name="command" href="#command">#</a>

A Redux thunk action exported by the Integration Manager which is used by front end code to ask the Integration Manager to start some operation (eg. Fetch product page data, login, add to cart, etc.)

### Connector <a name="connector" href="#connector">#</a>

The component that conforms to the Integration Manager backend API. It provides a thunk action for each of the commands exported by the Integration Manager.

### Result <a name="result" href="#result">#</a>

A Redux action provided by the Integration Manager dispatched by the connector to return data from the underlying website/service that it is built for.

### Type <a name="type" href="#type">#</a>

A utility object that ensures that [results](#result) dispatched by a
[connector](#connector) comform to the Integration Manager schema. Type checking only happens in debug builds and is compiled out in production builds so that it doesn't impact bundle size or performance.
