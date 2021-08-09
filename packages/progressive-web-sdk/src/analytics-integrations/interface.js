/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* eslint no-unused-vars: 0 */ // Interfaces are empty, disable for whole file
/** @module */
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
     * @see {@link module:utils.loadScript} to load a library from a script.
     *
     * @returns {Promise<undefined>} Returns a resolved promise when the resources are fully loaded.
     */
    load() {
        return Promise.reject(`Not implemented`)
    }

    /**
     * Track an analytics event and send it to an analytics provider.
     *
     * @param {String} type The event type, which can be any String, but Mobify
     *   has special support for some built-in types.
     * @param {Object} data The event data, which can be any Object, but Mobify
     *   has special support for some built-in types.
     * @returns {Object} The data that was sent to the analytics provider.
     *
     * @see {@link module:types} for more on Mobify's built-in analytics event types.
     */
    track(type, data) {
        throw new Error('Not implemented')
    }
}
