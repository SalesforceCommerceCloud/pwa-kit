/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This is an EXAMPLE file. To enable request processing, rename it to
// 'request-processor.js' and update the processRequest function so that
// it processes requests in whatever way your project requires.

// Uncomment the following line for the example code to work.
import {QueryParameters} from 'pwa-kit-runtime/utils/ssr-request-processing'

/**
 * The processRequest function is called for *every* non-proxy, non-bundle
 * request received. That is, all requests that will result in pages being
 * rendered, or the Express app requestHook function being invoked. Because
 * this function runs for every request, it is important that processing
 * take as little time as possible. Do not make external requests from
 * this code. Make your code error tolerant; throwing an error from
 * this function will cause a 500 error response to be sent to the
 * requesting client.
 *
 * The processRequest function is passed details of the incoming request,
 * function to support request-class setting plus parameters that refer to
 * the target for which this code is being run.
 *
 * The function must return an object with 'path' and 'querystring'. These
 * may be the same values passed in, or modified values.
 *
 * Processing query strings can be challenging, because there are multiple
 * formats in use, URL-quoting may be required, and the order of parameters
 * in the URL may be important. To avoid issues, use the QueryParameters
 * class from the SDK's 'utils/ssr-request-processing' module. This
 * class will correctly preserve the order, case, values and encoding of
 * the parameters. The QueryParameters class is documented in the SDK.
 *
 * @param path {String} the path part of the URL, beginning with a '/'
 * @param querystring {String} the query string part of the URL, without
 * any initial '?'
 * @param headers {Headers} the headers of the incoming request. This should
 * be considered read-only (although header values can be changed, most headers
 * are not passed to the origin, so changes have no effect).
 * @param setRequestClass {function} call this with a string to set the
 * "class" of the incoming request. By default, requests have no class.
 * @param parameters {Object}
 * @param parameters.appHostname {String} the "application host name" is the
 * hostname to which requests are sent for this target: the website's hostname.
 * @param parameters.deployTarget {String} the target's id. Use this to have
 * different processing for different targets.
 * @param parameters.proxyConfigs {Object[]} an array of proxy configuration
 * object, each one containing protocol, host and path for a proxy. Use this
 * to have different processing for different backends.
 * @returns {{path: String, querystring: String}}
 */
export const processRequest = ({
    // Uncomment the following lines for the example code to work.
    // headers,
    // setRequestClass,
    // parameters,
    path,
    querystring
}) => {
    // This is an EXAMPLE processRequest implementation. You should
    // replace it with code that processes your requests as needed.

    // This example code will remove any of the parameters whose keys appear
    // in the 'exclusions' array.
    const exclusions = [
        // 'gclid',
        // 'utm_campaign',
        // 'utm_content',
        // 'utm_medium',
        // 'utm_source'
    ]

    // This is a performance optimization for SLAS.
    // On client side, browser always follow the redirect
    // to /callback but the response is always the same.
    // We strip out the unique query parameters so this
    // endpoint is cached at the CDN level
    if (path === '/callback') {
        exclusions.push('usid')
        exclusions.push('code')
    }

    // Build a first QueryParameters object from the given querystring
    const incomingParameters = new QueryParameters(querystring)

    // Build a second QueryParameters from the first, with all
    // excluded parameters removed
    const filteredParameters = QueryParameters.from(
        incomingParameters.parameters.filter(
            // parameter.key is always lower-case
            (parameter) => !exclusions.includes(parameter.key)
        )
    )

    // Re-generate the querystring
    querystring = filteredParameters.toString()

    /***************************************************************************
    // This example code will detect bots by examining the user-agent,
    // and will set the request class to 'bot' for all such requests.
    const ua = headers.getHeader('user-agent')
    // This check
    const botcheck = /bot|crawler|spider|crawling/i
    if (botcheck.test(ua)) {
        setRequestClass('bot')
    }
    ***************************************************************************/
    // Return the path unchanged, and the updated query string
    return {
        path,
        querystring
    }
}
