/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 *
 * @deprecated 🚨 since version 1.2
 *
 * Instead of using the Grid component, you can use the Susy library. Read our
 * tutorial, [Creating Responsive Layout Grids With
 * Susy](../guides/responsive-grid/).
 *
 * ---
 *
 * ## Introduction
 *
 * Related component:
 *
 * * [GridSpan](#!/GridSpan)
 *
 * `Grid` is a wrapper component for preparing grid layouts. It acts as the
 * initial foundation in which the GridSpan component may be used to define
 * layouts.
 *
 * Our grid framework of choice is
 * [Susy](http://susydocs.oddbird.net/en/latest/) and all of Grid's and
 * GridSpan's behaviors are defined with the Susy mixins.
 *
 * @example ./DESIGN.md
 **/

const Grid = ({children, className}) => {
    console.warn(
        '🚨 The Grid component has been deprecated since version 1.2 and will be deleted in a future version of the SDK. If you need similar behaviour, please see our responsive grid documentation: https://bit.ly/2sT9emO'
    ) // eslint-disable-line max-len

    const classes = classNames('pw-grid', className)

    return (
        <div className={classes}>
            <div className="pw-grid__inner">{children}</div>
        </div>
    )
}

Grid.propTypes = {
    /**
     * Any children to be nested within this component (most likely a GridSpan).
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string
}

export default Grid
