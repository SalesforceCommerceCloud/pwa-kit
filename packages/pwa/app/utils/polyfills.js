/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {getAssetUrl} from 'progressive-web-sdk/dist/asset-utils'
import {loadScript} from 'progressive-web-sdk/dist/utils/utils'

export const availablePolyfills = [
    {
        test: () => !Array.prototype.fill || !window.Promise || !Object.values,
        load: (callback) => {
            loadScript({
                id: 'progressive-web-core-polyfill',
                src: getAssetUrl('core-polyfill.js'),
                onload: callback,
                onerror: callback
            })
        }
    },
    {
        test: () => !global.fetch,
        load: (callback) => {
            loadScript({
                id: 'progressive-web-fetch-polyfill',
                src: getAssetUrl('fetch-polyfill.js'),
                onload: callback,
                onerror: callback
            })
        }
    },
    {
        // For iOS (9 and below) and Samsung, we need to wait for window.Intl to
        // load before mounting the app. Else, IntlProvider (part of react-i18n)
        // will break.
        test: () => !window.Intl,
        load: (callback) => {
            loadScript({
                id: 'internationalization-polyfill',
                src: getAssetUrl('static/js/react-i18n-ios-polyfill.min.js'),
                onload: callback,
                onerror: callback
            })
        }
    },
    {
        // For IE (11 and below), we need to convert window.Event to a function
        // which is not the supoported behavior in IE by default.
        test: () => !Event || typeof Event !== 'function',
        load: (callback) => {
            window.Event = function(event, params) {
                if (!event) throw new Error('An Event needs to be passed in')
                params = {
                    bubbles: false,
                    cancelBubble: false,
                    composed: false,
                    ...params
                }
                const evt = document.createEvent('Event')
                evt.initEvent(event, params.bubbles, params.cancelable, params.composed)
                return evt
            }
            callback()
        }
    }
]

export const getNeededPolyfills = () => {
    return availablePolyfills.filter((polyfill) => polyfill.test())
}
