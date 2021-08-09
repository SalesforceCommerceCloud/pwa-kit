/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import PropTypes from 'prop-types'

/**
 * The default AMPApp is a no-op that we expect to be overridden in all projects.
 *
 * @private
 */
const AMPApp = (props) => <div id="app">{props.children}</div>

AMPApp.propTypes = {
    children: PropTypes.element.isRequired
}

export default AMPApp
