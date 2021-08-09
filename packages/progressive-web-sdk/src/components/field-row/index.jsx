/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related components:
 *
 * * [Field](#!/Field)
 * * [FieldSet](#!/FieldSet)
 *
 * `FieldRow` is used to group multiple Fields on one line of a form.
 *
 * @example ./DESIGN.md
 */
const FieldRow = ({className, children}) => {
    const classes = classNames('pw-field-row', className)

    return <div className={classes}>{children}</div>
}

FieldRow.propTypes = {
    /**
     * The content that should be rendered within `FieldRow`.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string
}

export default FieldRow
