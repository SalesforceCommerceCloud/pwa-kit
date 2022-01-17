/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

const ApplicationState = React.createContext()

/**
 * Use the AppConfig component to inject extra arguments into the getProps
 * methods for all Route Components in the app – typically you'd want to do this
 * to inject a connector instance that can be used in all Pages.
 *
 * You can also use the AppConfig to configure a state-management library such
 * as Redux, or Mobx, if you like.
 */
const AppConfig = ({children, locals = {}}) => {
    return <ApplicationState.Consumer>{children}</ApplicationState.Consumer>
}


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
AppConfig.restore = (locals = {}) => {

}

/**
 * Freeze a state management backend for embedding into the page HTML.
 *
 * @param locals - res.locals on the server, an empty object as a substitute on
 *    the client.
 * @return {Object} - the application state as an object, which will be
 *    serialized into JSON and embedded in the page HTML.
 */
AppConfig.freeze = () => undefined

/**
 * Return any extra arguments to be injected into `getProps` methods across
 * the entire app, such as a Redux store.
 *
 * @param locals - res.locals on the server, an empty object as a substitute on
 *    the client.
 * @return {Object}
 */
AppConfig.extraGetPropsArgs = (locals = {}) => {

}

AppConfig.propTypes = {
    children: PropTypes.node,
    locals: PropTypes.object
}

export default AppConfig
