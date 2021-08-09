/* global DEBUG, __webpack_require__ */

import {initCacheManifest, getBuildOrigin, getAssetUrl} from 'progressive-web-sdk/dist/asset-utils'
import {renderOrHydrate} from 'progressive-web-sdk/dist/utils/universal-utils'
import cacheHashManifest from './cache-hash-manifest.json'
import {runningServerSide} from 'progressive-web-sdk/dist/utils/utils'
import {watchOnlineStatus} from './utils/utils'
import {onOnlineStatusChange} from './actions'
import logger from 'progressive-web-sdk/dist/utils/logger'
import {getConnector} from './connector'
import ResponsiveContext from './components/responsive-context'

logger.setDebug(DEBUG)

let origin = getBuildOrigin()

if (!/\/$/.test(origin)) {
    origin += '/'
}

// If the `window.getWebpackChunkPath` function is defined, patch
// __webpack_require__.p to use the value it returns. This allows
// webpack chunk loading to be controlled under SSR.
// If window.getWebpackChunkPath isn't defined, set __webpack_require__.p
// to be the build origin, so that all assets are loaded from the bundle
// location.
Object.defineProperty(__webpack_require__, 'p', {
    get: window.getWebpackChunkPath || (() => origin)
})

// React
import React from 'react'
import configureStore from './store'
import Router from './router'
import Loadable from 'react-loadable'

// Stylesheet: importing it here compiles the SCSS into CSS. The CSS is actually
// added to the markup in `loader.js`
// eslint-disable-next-line no-unused-vars
import Stylesheet from './stylesheet.scss'

/**
 * Until the day that the `use` element's cross-domain issues are fixed, we are
 * forced to fetch the SVG Sprite's XML as a string and manually inject it into
 * the DOM. See here for details on the issue with `use`:
 * @URL: https://bugs.chromium.org/p/chromium/issues/detail?id=470601
 */
const fetchSvgSprite = () => {
    return runningServerSide()
        ? Promise.resolve()
        : fetch(getAssetUrl('static/svg/sprite-dist/sprite.svg'))
              .then((response) => response.text())
              .then((text) => {
                  const div = document.createElement('div')
                  div.innerHTML = text
                  div.hidden = true
                  document.body.appendChild(div)
              })
}

const main = () => {
    Promise.resolve()
        .then(() => Loadable.preloadReady())
        .then(() => getConnector())
        .then((connector) => {
            initCacheManifest(cacheHashManifest)
            const store = configureStore(connector)
            const rootEl = document.getElementsByClassName('react-target')[0]

            watchOnlineStatus((isOnline) => store.dispatch(onOnlineStatusChange(isOnline)))

            renderOrHydrate(
                <ResponsiveContext>
                    <Router store={store} />
                </ResponsiveContext>,
                store,
                rootEl
            )
        })
        .then(() => fetchSvgSprite())
}

main()
