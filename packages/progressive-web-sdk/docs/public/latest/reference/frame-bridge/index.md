<div class="c-callout c--important">
  <p>
    <strong>Important:</strong> We've removed this article from the site navigation because Mobify projects that were generated after January 2019 do <em>not</em> include the Frame Bridge technology described below. If you are maintaining a project that was generated before January 2019 that <em>does</em> include the Frame Bridge, we have left this documentation in place for you.
  </p>
</div>

## Introduction

In cases where data cannot be scraped from the source document of the desktop
site (i.e. content generated through JavaScript or via a framework like
Angular), the desktop site can be allowed to run in a sandboxed iframe hidden on
the page. This utility provides several methods for manipulating and
communicating between parent and child windows.

## The parent module

There are two files that you'll need to import: the parent module and the child module. Import the parent module into your application wherever you need it.

```javascript
import Parent from 'progressive-web-sdk/dist/iframe/parent'

const parent = new Parent()
```

### Methods

#### Parent(options)

Constructor. Initializes the Parent object

_Parameters_

- **options**: `object` - options object for configuring the bridge
    - **origin**: `string` - used to listen to messages only sent over the same domain
    - **debug**: `boolean` - whether to log messages to console and display the iframe contents
    - **src**: `string` - the starting href of the child frame

**returns**: `this`

-----

#### on(event, callback)

Add a new event listener

_Parameters_

- **event**: `string` - the name of the event you wish to listen for
- **callback**: `function` - the method to be run if the event is received

The `callback` function accepts the following parameters:

- **data**: `object` - optional information provided by `trigger`
- **eventName**: `string` - the name of the event that was triggered
- **eventData**: `object` - the raw event object passed

**returns**: `this`

-----

#### off(event, callback)

Removes an event listener

_Parameters_

- **event**: `string` - the name of the event you wish to unregister from
- **callback**: `function` - the function to unregister (this must be exactly
  the same function that was registered with `.on()`)

**returns**: `this`

-----

#### trigger(eventName, data)

Send an event to the child frame

_Parameters_

- **eventName**: `string` - the name of the event to trigger
- **data**: `object` - key/value pair containing information to send

**returns**: `this`

-----

#### navigate(url)

Tell the child frame to navigate to the given url

_Parameters_

- **url**: `string` - the url that should be set as `window.location.href` of
  the child frame

**returns**: `this`

-----

#### callMethod(fnName, ...args)

Invoke a method that was registered in the child frame (using `registerMethod()`)

_Parameters_

- **fnName**: `string` - the name of the registered method to invoke
- **args**: `Array` - a variable number of arguments to pass to the called method (0 or more)

**returns**: `Promise` - a Promise that resolves after the child method returns or resolves

-----

## The child module

The child module should be imported in a JavaScript file that is injected into
the iframe document via `loader.js`. By convention, this is a file called
`child-iframe.js`:

```javascript
// Inside child-iframe.js
import Child from 'progressive-web-sdk/dist/iframe/child'

const child = new Child()
```

`child-iframe.js` is typically placed within your [connector](../glossary/#connector) folder.

You'll need to make additional modifications to your Webpack configuration to
transpile `child-iframe.js` to ES5 syntax and build any dependencies.

First, create a new file called `web/webpack/base.child-iframe.js`. Add this
configuration:

```javascript
/* eslint-disable import/no-commonjs */
/* eslint-env node */

const path = require('path')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

const analyzeBundle = process.env.MOBIFY_ANALYZE_CHILD_IFRAME === 'true'

const config = {
    entry: './connectors/my-connector/child-iframe.js',
    output: {
        path: path.resolve(process.cwd(), 'build'),
        filename: 'child-iframe.js'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader'
                }
            }
        ],
    }
}

if (analyzeBundle) {
    console.info('Analyzing build...')
    config.plugins = config.plugins.concat([
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true
        })
    ])
}

module.exports = config
```

This configuration includes the ability to run the [Webpack Bundle Analyzer](https://github.com/webpack-contrib/webpack-bundle-analyzer) on `child-iframe.js`. This can be very helpful for ensuring that you keep `child-iframe.js` as [small as possible](#check-size). Inside `web/package.json`, add the following script to run the analyzer on `child-iframe.js`:

```json
"analyze-child-iframe": "MOBIFY_ANALYZE_CHILD_IFRAME=true webpack --config webpack/child-iframe.js -p --display-error-details --bail"
```

Next, you need to load this webpack configuration. Inside `web/webpack/dev.js` and
`web/webpack/production.js` - import the configuration for `child-iframe` and add it
to `module.exports`:

```javascript
const loaderConfig = require('./base.loader')
const mainConfig = require('./base.main')
const workerConfig = require('./base.worker')
const onboardingConfig = require('./base.onboarding')
const childIframeConfig = require('./base.child-iframe')
const ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = [mainConfig, loaderConfig, workerConfig, onboardingConfig, childIframeConfig]
```

Now when you build the app, a transpiled version of `child-iframe.js` will also
be created in the `web/build` directory.

Inside the child frame, the Mobify tag will load `loader.js`. We'll then need to
modify the existing control flow and add a new `else if` condition to handle
this and load the transpiled `child-iframe.js` instead of the React application:

```javascript
// Inside web/loader.js

const isInIframe = () => {
    try {
        return window.self !== window.top
    } catch (e) {
        return true
    }
}

...

if (isReactRoute() && !isInIframe()) {
    ...
} else if (isInIframe()) {
    // Child iframe
    initCacheManifest(cacheHashManifest)
    
    loadAsset('script', {src: '//cdn.mobify.com/capturejs/capture-latest.min.js', async: true, className: 'capture-remove'})
    const contentApi = `<script src="${getAssetUrl('child-iframe.js')}"></script>`

    const interval = setInterval(() => {
        if (window.Capture) {
            clearInterval(interval)
            window.Capture.init((capture) => {
                capture.restore(contentApi)

            })
        }
    }, 150)
} else {
    ...
}
```

### Methods

#### Child(options)

Constructor. Initializes the Child object

_Parameters_

- **options**: `object` - options object for configuring the child frame
    - **origin**: `string` - used to listen to messages only sent over the same
      domain
    - **debug**: `boolean` - whether to log messages to console and display the
      iframe contents
    - **readyCheck**: `Promise` - a Promise that resolves when the child frame
      content has loaded

**returns**: `this`

-----

#### on(event, callback)

Adds a new event listener

_Parameters_

- **event**: `string` - the name of the event you wish to listen for
- **callback**: `function` - the function to be run if the event is received

`callback` receives the following arguments:

- **data**: `object` - optional information provided by `trigger`
- **eventName**: `string` - the name of the event that was triggered
- **eventData**: `object` - the raw event object passed

**returns**: `this`

-----

#### off(event, callback)

Removes an event listener

_Parameters_

- **event**: `string` - the name of the event you wish to unregister from
- **callback**: `function` - the function to unregister (this must be exactly
  the same function that was registered with `.on()`)

**returns**: `this`

-----

#### trigger(eventName, data)

Send an event between frames

_Parameters_

- **eventName**: `string` - the name of the event to trigger
- **data**: `object` - key/value pair containing information to send

**returns**: `this`

-----

### registerMethod(fnName, method)

Register a method that can be invoked by the parent (via `callMethod()`)

_Parameters_

- **fnName**: `string` - the unique name of the method
- **method**: `function` - the function that should be invoked. Can return a
  Promise

**returns**: `this`


## Best Practices

### Avoid importing dependencies into `child-iframe.js`

The file `child-iframe.js` does not use the `vendor.js` file which contains all of your project's dependencies. If you import a dependency into `child-iframe.js`, webpack will include that dependency directly in the bundled `child-iframe.js` file. This can result in loading the same dependency twice.

Try to keep all dependencies outside of `child-iframe.js` and use the bridge to communicate data back and forth. For example, say you're submitting a form inside the iframe. If the form submission fails, you want to throw a [`SubmissionError`](../../guides/forms/#submit-validation). Instead of importing `SubmissionError` into `child-iframe.js`, you should trigger an event telling the parent that the form failed to submit. The parent can then import and throw the `SubmissionError`.

### Regularly check the size of `child-iframe.js`

The size of `child-iframe.js` has a large impact on the performance of the Frame Bridge. Regularly checking the size of this file and keeping it as small as possible can help you maximize the performance of the Frame Bridge.

The main thing to check for is to make sure you aren't accidentally including any dependencies, which will significantly bloat the file size. For more detailed information, you can run `npm run analyze-child-iframe` to check what files are being bundled into `child-iframe.js`.

### Defer initializing the Frame Bridge

Starting up the Frame Bridge can involve a lot of CPU and network intensive work. On the first page load, wait until after the app shell has been painted before initializing the Frame Bridge. This allows you to paint the app shell faster and improve the perceived performance of your PWA. Make sure that any functions that use the Frame Bridge are only run after this initialization occurs.

<div id="toc"><p class="u-text-size-smaller u-margin-start u-margin-bottom"><b>IN THIS ARTICLE:</b></p></div>