/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint no-unused-vars: 0 */ // Interfaces are empty, disable for whole file
/**
 * The `interface` module contains the `AnalyticsConnector` interface that
 * is used to implement a connector for an analytics provider.
 * @module progressive-web-sdk/dist/analytics-integrations/interface
 */
/**
 * A generic interface for the Analytics Manager and its Connectors.
 *
 * @interface
 */
export class AnalyticsConnector {
    /**
     * Loads necessary resources and performs any additional set up required to
     * create the connection to the Analytics Provider.
     *
     *
     * @see module:progressive-web-sdk/dist/analytics-integrations/utils.loadScript
     *
     * @returns {Promise<undefined>} Returns a resolved promise when the resources are fully loaded.
     */
    load() {
        return Promise.reject(`Not implemented`)
    }

    /**
     * Track an analytics event and send it to an analytics provider.
     * @see module:progressive-web-sdk/dist/analytics-integrations/types
     * @param {String} type The event type, which can be any String, but Mobify
     *   has special support for some built-in types.
     * @param {Object} data The event data, which can be any Object, but Mobify
     *   has special support for some built-in types.
     * @returns {Object} The data that was sent to the analytics provider.
     *
     */
    track(type, data) {
        throw new Error('Not implemented')
    }
}
