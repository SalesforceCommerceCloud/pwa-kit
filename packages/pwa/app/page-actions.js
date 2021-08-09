import {onRouteChanged} from 'progressive-web-sdk/dist/store/app/actions'
import {onPageReady} from './actions'
import {
    ssrRenderingComplete,
    ssrRenderingFailed
} from 'progressive-web-sdk/dist/utils/universal-utils'
import {getURL} from 'progressive-web-sdk/dist/utils/utils'
import {runningServerSide} from 'progressive-web-sdk/dist/utils/utils'
import {getAnalyticsManager} from './analytics'

/**
 * Tracks loading of an SSR-rendered page.
 *
 * Assuming that your Page loads data asynchronously, use `trackPageLoad` to wrap
 * your Page's data-loading promise. The `trackPageLoad` function will then notify
 * the SSR server when rendering is complete and a Page is ready to send to the
 * client.
 *
 * You can also use `trackPageLoad` to set response options - HTTP status codes,
 * headers, etc. - by using the `getResponseOptions` callback. That callback
 * receives the result from your promise and must return an Object with
 * the response options you'd like to set, eg.
 *
 *     const promise = fetch('http://www.example.com')
 *     trackPageLoad(promise, 'product-list-page', (result) => ({
 *         statusCode: 200,
 *         headers: {
 *             'X-Powered-By': 'Mobify'
 *         }
 *     }))
 *
 * The available response options are described here
 * https://dev.mobify.com/v1.x/apis-and-sdks/progressive-web-sdk/utils/universal-utils#module-colon-progressive-web-sdk-slash-dist-slash-utils-slash-universal-utils-dot-ssrRenderingComplete
 *
 * @param promise {Promise} your Page's data loading promise.
 * @param pageType {String} the page type, for Analytics tracking, eg. 'product-list-page'.
 * @param getResponseOptions {Function} HTTP options for server-rendered responses.
 */
export const trackPageLoad = (promise, pageType, getResponseOptions = () => undefined) => (
    dispatch,
    getState
) => {
    /**
     * Signal that rendering is complete for SSR purposes.
     */
    const ssrComplete = (result) => ssrRenderingComplete(getState(), getResponseOptions(result))

    if (Boolean(promise) && promise.then === undefined) {
        console.warn(`trackPageLoad received a value that was not a promise -
            this is likely a programmer error.`)
        ssrComplete(undefined)
    } else {
        const url = getURL(location)
        Promise.resolve()
            .then(() => {
                dispatch(onRouteChanged(url, pageType))
                if (!runningServerSide()) {
                    promise = getAnalyticsManager().trackPageLoad(promise)
                }
                return promise
            })
            .then((result) => {
                dispatch(onPageReady(pageType))
                ssrComplete(result)
            })
            .catch((error) => {
                ssrRenderingFailed(error)
                console.error(error)
                return Promise.reject(error) // Don't swallow errors!
            })
    }
}
