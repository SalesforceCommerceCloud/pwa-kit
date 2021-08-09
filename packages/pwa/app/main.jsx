import {getAssetUrl} from 'progressive-web-sdk/dist/ssr/universal/utils'
import {start, registerServiceWorker} from 'progressive-web-sdk/dist/ssr/browser/main'
import {getAnalyticsManager} from './analytics'

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
    return fetch(getAssetUrl('static/svg/sprite-dist/sprite.svg'))
        .then((response) => response.text())
        .then((text) => {
            const div = document.createElement('div')
            div.innerHTML = text
            div.hidden = true
            document.body.appendChild(div)
        })
}

const main = () => {
    return Promise.all([
        start(),
        getAnalyticsManager(),
        fetchSvgSprite(),
        registerServiceWorker('/worker.js')
    ])
}

main()
