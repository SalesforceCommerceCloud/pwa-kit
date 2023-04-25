/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import http from 'http'
import https from 'https'

let HTTP_AGENT, HTTPS_AGENT
const KEEPALIVE_AGENT_OPTIONS = {
    keepAlive: true
}

/**
 * Returns the http and https agent singletons.
 *
 * @private
 * @returns {object} -
 */
const getKeepAliveAgents = () => {
    if (!HTTP_AGENT || !HTTPS_AGENT) {
        HTTP_AGENT = new http.Agent(KEEPALIVE_AGENT_OPTIONS)
        HTTPS_AGENT = new https.Agent(KEEPALIVE_AGENT_OPTIONS)
    }

    return {
        httpAgent: HTTP_AGENT,
        httpsAgent: HTTPS_AGENT
    }
}

export const outgoingRequestHook = (wrapped, options) => {
    return function () {
        // Get the app hostname. If we can't, then just pass
        // the call through to the wrapped function. We'll also
        // do that if there's no access key.
        const accessKey = process.env.X_MOBIFY_ACCESS_KEY
        const {appHostname, proxyKeepAliveAgent} = options || {}

        if (!(appHostname && accessKey)) {
            return wrapped.apply(this, arguments)
        }

        // request and get can be called with (options[, callback])
        // or (url[, options][, callback]).
        let workingUrl = ''
        let workingOptions
        let workingCallback
        const args = arguments

        // The options will be in the first 'object' argument
        for (let i = 0; i < args.length; i++) {
            const arg = args[i]
            switch (typeof arg) {
                case 'object': {
                    // Assume this arg is the options
                    // We want to clone any options to avoid modifying
                    // the original object.
                    workingOptions = {...arg}
                    break
                }
                case 'string': {
                    // Assume this arg is the URL
                    workingUrl = arg
                    break
                }

                default:
                    // Assume this is the callback
                    workingCallback = arg
                    break
            }
        }

        if (!workingOptions) {
            // No options were supplied, so we add them
            workingOptions = {headers: {}}
        }

        // We need to identify loopback requests: requests that are
        // to the appHost (irrespective of protocol).
        // The workingUrl value may be partial (the docs are very
        // imprecise on permitted values). We check everywhere that
        // might give us what we need. If this is not a loopback
        // request, we just pass it through unmodified.
        const isLoopback =
            // Either hostname or host are allowed in the options. The docs
            // say that 'hostname' is an alias for 'host', but that's not
            // exactly true - host can include a port but hostname doesn't
            // always. So we need to compare both.
            workingOptions.host === appHostname ||
            workingOptions.hostname === appHostname ||
            (workingUrl && workingUrl.includes(`//${appHostname}`))

        if (!isLoopback) {
            return wrapped.apply(this, arguments)
        }

        // We must inject the 'x-mobify-access-key' header into the
        // request.
        workingOptions.headers = workingOptions.headers ? {...workingOptions.headers} : {}

        // Inject the access key.
        workingOptions.headers['x-mobify-access-key'] = accessKey

        // Create and add keep-alive agent to options for loop-back connection.
        if (proxyKeepAliveAgent) {
            const {httpAgent, httpsAgent} = getKeepAliveAgents()

            // Add default agent to global connection reuse.
            workingOptions.agent =
                workingUrl.startsWith('http:') || workingOptions?.protocol === 'http:'
                    ? httpAgent
                    : httpsAgent

            // `node-fetch` and potentially other libraries add connection: close headers
            // remove them to keep the connection alive. NOTE: There are variations in
            // whether or not the connection header is upper or lower case, so handle both.
            delete workingOptions?.headers?.connection
            delete workingOptions?.headers?.Connection
        }

        // Build the args, omitting any undefined values
        const workingArgs = [workingUrl, workingOptions, workingCallback].filter((arg) => !!arg)

        return wrapped.apply(this, workingArgs)
    }
}
