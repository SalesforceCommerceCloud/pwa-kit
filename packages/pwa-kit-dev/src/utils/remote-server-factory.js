/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Minimal stub version of RemoteServerFactory for pwa-kit-dev
 * This breaks the cyclical dependency with pwa-kit-runtime
 * @private
 */
export const RemoteServerFactory = {
    /**
     * @private
     */
    _configure(options) {
        // Minimal configuration for dev server
        const defaults = {
            projectDir: process.cwd(),
            buildDir: process.cwd(),
            defaultCacheTimeSeconds: 600,
            port: 3443,
            protocol: 'https',
            proxyKeepAliveAgent: true,
            quiet: false,
            strictSSL: true,
            mobify: undefined,
            localAllowCookies: false,
            useSLASPrivateClient: false,
            applySLASPrivateClientToEndpoints:
                /\/oauth2\/(token|passwordless\/(login|token)|password\/(reset|action))/
        }

        options = Object.assign({}, defaults, options)
        return options
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _logStartupMessage(options) {
        // Hook for the DevServer
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getAllowCookies(options) {
        return 'MRT_ALLOW_COOKIES' in process.env ? process.env.MRT_ALLOW_COOKIES == 'true' : false
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getProtocol(options) {
        return 'https'
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getDefaultCacheControl(options) {
        return 'max-age=0, nocache, nostore, must-revalidate'
    },

    /**
     * @private
     */

    _strictSSL(options) {
        return options.strictSSL
    },

    /**
     * @private
     */
    _isBundleOrProxyPath(url) {
        return url.startsWith('/mobify/bundle') || url.startsWith('/mobify/proxy')
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getSlasEndpoint(options) {
        return process.env.SLAS_HOSTNAME || 'account.demandware.com'
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setCompression(app) {
        // Compression setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupLogging(app) {
        // Logging setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setRequestId(app) {
        // Request ID setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupMetricsFlushing(app) {
        // Metrics flushing setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _updatePackageMobify(options) {
        // Package mobify update would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _configureProxyConfigs(options) {
        // Proxy config setup would go here
    },

    /**
     * @private
     */

    _createApp(options) {
        // App creation would go here
        return {options}
    },

    /**
     * @private
     */

    _createExpressApp(options) {
        // Express app creation would go here
        return {options}
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _addSDKInternalHandlers(app) {
        // SDK internal handlers would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setForwardedHeaders(app, options) {
        // Forwarded headers setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupSSRRequestProcessorMiddleware(app) {
        // SSR request processor setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupProxying(app, options) {
        // Proxying setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _handleMissingSlasPrivateEnvVar(app) {
        // SLAS private env var handling would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupSlasPrivateClientProxy(app, options) {
        // SLAS private client proxy setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupHealthcheck(app) {
        // Healthcheck setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _setupCommonMiddleware(app, options) {
        // Common middleware setup would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _validateConfiguration(options) {
        // Configuration validation would go here
    },

    /**
     * @private
     */
    _addStaticAssetServing() {
        // Static asset serving would go here
    },

    /**
     * @private
     */
    _addDevServerGarbageCollection() {
        // Dev server garbage collection would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    serveServiceWorker(req, res) {
        // Service worker serving would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    serveStaticFile(filePath, opts = {}) {
        // Static file serving would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    render(req, res, next) {
        // Rendering would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _createHandler(app, options) {
        // Handler creation would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createHandler(options, customizeApp) {
        // Handler creation would go here
    },

    /**
     * @private
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _getRequestProcessor(req) {
        // Request processor would go here
    }
}
