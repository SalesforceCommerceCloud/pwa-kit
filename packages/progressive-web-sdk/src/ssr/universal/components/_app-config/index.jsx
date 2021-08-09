/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/**
 * @module progressive-web-sdk/dist/ssr/universal/components/_app-config
 */

import React from 'react'
import PropTypes from 'prop-types'

/**
 * This is a special component that can be overridden in a project. It supports
 * two things:
 *
 *   1) Working with state management libraries such as Redux that need to set
 *      up <Provider> instances at the root of an application.
 *
 *   2) Injecting properties (such as Redux stores, API clients) into getProps()
 *      methods across an application. We can't use React's context to do this
 *      because getProps() and co. need to be static methods.
 */
class AppConfig extends React.Component {
    /**
     * Restore a state management backend from frozen state that was embedded
     * into the page HTML.
     *
     * You can also use this to initialize a state-management library, and should
     * save the instance onto `locals`.
     *
     * @param locals - res.locals on the server, an empty object as a substitute on
     *    the client.
     * @param frozen - the application state, restored from JSON in the HTML.
     */
    // eslint-disable-next-line no-unused-vars
    static restore(locals, frozen = {}) {}

    /**
     * Freeze a state management backend for embedding into the page HTML.
     *
     * @param locals - res.locals on the server, an empty object as a substitute on
     *    the client.
     * @return {Object} - the application state as an object, which will be
     *    serialized into JSON and embedded in the page HTML.
     */
    // eslint-disable-next-line no-unused-vars
    static freeze(locals) {
        return undefined
    }

    /**
     * Return any extra arguments to be injected into `getProps` methods across
     * the entire app, such as a Redux store.
     *
     * @param locals - res.locals on the server, an empty object as a substitute on
     *    the client.
     * @return {Object}
     */
    // eslint-disable-next-line no-unused-vars
    static extraGetPropsArgs(locals) {
        return {}
    }

    /**
     * This class is a React Component in order to provide this hook, which lets
     * you set up context Providers for a state-management library such as Redux.
     */
    render() {
        return <React.Fragment>{this.props.children}</React.Fragment>
    }
}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

export default AppConfig
