/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'

/**
 * @module pwa-kit-react-sdk/react/components/_app
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
