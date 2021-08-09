/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import PropTypes from 'prop-types'

/**
 * @module progressive-web-sdk/dist/ssr/universal/components/_app
 */

/**
 * The PWAApp is a special component that will be overridden in your project. Its
 * main purpose is to provide the layout for your application as well as set up any
 * global actions and data fetching via the `getProps` method. Typically this is
 * where you will set up components like your application header, footer and
 * navigation. The contents of this component are project specific, but the rule
 * of thumb is that anything outside of your pages will be added here.
 */
const App = (props) => <div id="app">{props.children}</div>

App.propTypes = {
    children: PropTypes.element.isRequired
}

export default App
