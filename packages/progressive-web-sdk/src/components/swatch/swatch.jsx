/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import SwatchItem from './swatch-item'
import {noop} from '../../utils/utils'

/**
 * Related component:
 *
 * * [SwatchItem](#!/SwatchItem)
 *
 * `Swatch` allows the user to select from a small list of options.
 *
 * @example ./DESIGN.md
 */

const Swatch = (props) => {
    const {label, children, value, onChange, className} = props

    const classes = classNames('pw-swatch', className)
    let labelStr = label
    if (typeof labelStr == 'string') {
        labelStr = label.replace(/\s/g, '-')
    }
    const labelId = labelStr

    return (
        <div className={classes} role="radiogroup" aria-labelledby={`swatch-label-${labelId}`}>
            <div className="pw-swatch__label" id={`swatch-label-${labelId}`}>
                {label}
            </div>

            <div className="pw-swatch__items">
                {React.Children.map(children, (child) => {
                    if (child && child.type && child.type.name === SwatchItem.name) {
                        const childValue = child.props.value

                        return React.cloneElement(child, {
                            selected: childValue === value,
                            key: childValue,
                            onClick: onChange
                        })
                    } else {
                        return child
                    }
                })}
            </div>
        </div>
    )
}

Swatch.defaultProps = {
    label: '',
    onChange: noop
}

Swatch.propTypes = {
    /**
     * The options to choose between (Should be SwatchItems).
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The label for the Swatch.
     */
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The selected swatch value.
     */
    value: PropTypes.string,

    /**
     * This function is called whenever the user selects a new value.
     * It is passed the new value.
     */
    onChange: PropTypes.func
}

export default Swatch
