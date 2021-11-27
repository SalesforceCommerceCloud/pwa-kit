/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import awsServerlessExpress from 'aws-serverless-express'
import {processLambdaResponse} from '../../utils/ssr-server'
import {BaseServerFactory} from './build-base-server'

/**
 * An Array of mime-types (Content-Type values) that are considered
 * as binary by awsServerlessExpress when processing responses.
 * We intentionally exclude all text/* values since we assume UTF8
 * encoding and there's no reason to bulk up the response by base64
 * encoding the result.
 *
 * We can use '*' in these types as a wildcard - see
 * https://www.npmjs.com/package/type-is#type--typeisismediatype-types
 *
 * @private
 */
const binaryMimeTypes = ['application/*', 'audio/*', 'font/*', 'image/*', 'video/*']

/**
 * @private
 */
export class RemoteServerFactory extends BaseServerFactory {
    setupSSRRequestProcessorMiddleware(app) {
        return super.setupSSRRequestProcessorMiddleware(app)
    }

    getProtocol(options) {
        return 'https'
    }

    getDefaultCacheControl(options) {
        return `max-age=${options.defaultCacheTimeSeconds}, s-maxage=${options.defaultCacheTimeSeconds}`
    }

    strictSSL(options) {
        return true
    }

    setCompression(app) {
        // Let the CDN do it
    }

    setupLogging(app) {
        // Nope
    }

    setupMetricsFlushing(app) {
        // Nope
    }

    setupProxying(app, options) {
        // This was a mistake we made that is set for deprecation.
        if (options.enableLegacyRemoteProxying) {
            super.setupProxying(app, options)
        } else {
            app.all('/mobify/proxy/*', (_, res) => {
                return res.status(501).json({
                    message:
                        'Environment proxies are not set: https://sfdc.co/managed-runtime-setup-proxies',
                })
            })
        }
    }

    setupHealthcheck(app) {
        return super.setupHealthcheck(app)
    }

    setupCommonMiddleware(app, options) {
        return super.setupCommonMiddleware(app, options)
    }

    validateConfiguration(options) {
        return super.validateConfiguration(options)
    }

    serveCompiledAssets(app) {
        console.warn('Not implemented')
    }

    /**
     * Builds a Lambda handler function from an Express app.
     *
     * See: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
     *
     * @param app {Express} - an Express App
     * @private
     */
    createHandler(app) {
        // This flag is initially false, and is set true on the first request
        // handled by a Lambda. If it is true on entry to the handler function,
        // it indicates that the Lambda container has been reused.
        let lambdaContainerReused = false

        const server = awsServerlessExpress.createServer(app, null, binaryMimeTypes)

        const handler = (event, context, callback) => {
            // We don't want to wait for an empty event loop once the response
            // has been sent. Setting this to false will "send the response
            // right away when the callback executes", but any pending events
            // may be executed if the Lambda container is then reused for
            // another invocation (which we expect will happen under all
            // but very low load). This means two things:
            // 1. Any code that we have *after* the callback MAY be executed
            // if the Lambda container is reused, but there's no guarantee
            // it will be.
            // 2. There is no way to have code do cleanup work (such as sending
            // metrics) after the response is sent to the browser. We have
            // to accept that doing such work delays the response.
            // It would be good if we could set this to true and do work like sending
            // metrics after calling the callback, but that doesn't work - API Gateway
            // will wait for the Lambda invocation to complete before sending
            // the response to the browser.
            context.callbackWaitsForEmptyEventLoop = false

            if (lambdaContainerReused) {
                // DESKTOP-434 If this Lambda container is being reused,
                // clean up memory now, so that we start with low usage.
                // These regular GC calls take about 80-100 mS each, as opposed
                // to forced GC calls, which occur randomly and can take several
                // hundred mS.
                app._collectGarbage()
                app.sendMetric('LambdaReused')
            } else {
                // This is the first use of this container, so set the
                // reused flag for next time.
                lambdaContainerReused = true
                app.sendMetric('LambdaCreated')
            }

            // Proxy the request through to the server. When the response
            // is done, context.succeed will be called with the response
            // data.
            awsServerlessExpress.proxy(
                server,
                event, // The incoming event
                context, // The event context
                'CALLBACK', // How the proxy signals completion
                (err, response) => {
                    // The 'response' parameter here is NOT the same response
                    // object handled by ExpressJS code. The awsServerlessExpress
                    // middleware works by sending an http.Request to the Express
                    // server and parsing the HTTP response that it returns.
                    // Wait util all pending metrics have been sent, and any pending
                    // response caching to complete. We have to do this now, before
                    // sending the response; there's no way to do it afterwards
                    // because the Lambda container is frozen inside the callback.

                    // We return this Promise, but the awsServerlessExpress object
                    // doesn't make any use of it.
                    return (
                        app._requestMonitor
                            ._waitForResponses()
                            .then(() => app.metrics.flush())
                            // Now call the Lambda callback to complete the response
                            .then(() => callback(err, processLambdaResponse(response)))
                        // DON'T add any then() handlers here, after the callback.
                        // They won't be called after the response is sent, but they
                        // *might* be called if the Lambda container running this code
                        // is reused, which can lead to odd and unpredictable
                        // behaviour.
                    )
                }
            )
        }
        return {server, handler}
    }
}
