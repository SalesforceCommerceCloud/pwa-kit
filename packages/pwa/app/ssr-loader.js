/*
 The SSR-loader is a cut-down version of loader.js that sets up the correct
 environment for main.js.
 */

/* global DEBUG, AJS_SLUG */
/* eslint import/no-commonjs:0 */

import {applyPolyfills} from 'progressive-web-sdk/dist/ssr/ssr-polyfills'
import {loadUPWA} from 'progressive-web-sdk/dist/utils/ssr-loader-utils'
import {getNeededPolyfills} from './utils/polyfills'

// Polyfills - importing them will install them if needed. We always include
// them, since loading them asynchronously is slow, and unless they're
// installed by the time main.js is evaluated, it's possible that module
// initialization code will fail if it relies on a polyfilled feature.
import 'core-js/es6/array' // Array.fill and Array.find
import 'core-js/es6/promise' // Promise
import 'core-js/es6/string' // string.includes
import 'whatwg-fetch' // window.fetch
import 'url-polyfill'
import 'es6-object-assign/auto' // Object.assign polyfill

const neededPolyfills = getNeededPolyfills()
neededPolyfills.forEach((polyfill) => {
    polyfill.load(() => {})
})

applyPolyfills()

loadUPWA({
    debug: DEBUG,
    mobifyPropertyId: AJS_SLUG
})
