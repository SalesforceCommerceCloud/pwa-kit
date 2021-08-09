/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import {positiveValue} from '../../utils/prop-types'

const INT_FRAGMENT = '[1-9]\\d*'
const TWO_INT_REGEX = new RegExp(`^${INT_FRAGMENT}:${INT_FRAGMENT}$`)

/**
 * Fluid-width element with an intrinsic width/height ratio. Best used with
 * media elements like `img` or `video`.
 */

const Ratio = ({aspect, children, className, height, width}) => {
    let w
    let h

    if (aspect) {
        ;[w, h] = aspect.split(':')
    } else {
        // these are guaranteed to be defined and positive if proptypes pass
        ;[w, h] = [width, height]
    }

    const ratio = (h / w) * 100
    const innerStyle = {
        paddingBottom: `${ratio}%`
    }
    const classes = classNames('pw-ratio', className)

    return (
        <div className={classes}>
            <div className="pw-ratio__fill" style={innerStyle} />

            <div className="pw-ratio__inner">{children}</div>
        </div>
    )
}

Ratio.defaultProps = {
    style: {},
    height: 1,
    width: 1
}

const aspectPropType = (props, propName) => {
    const aspect = props[propName]

    if (aspect === undefined) {
        // If undefined, assume that the height and width props are being used
        return null
    }

    const hasTwoIntegers = TWO_INT_REGEX.test(aspect)

    if (!hasTwoIntegers) {
        return new Error(
            'The aspect prop must contain a ":" character between two positive integers, for example 4:3'
        )
    }

    return null
}

Ratio.propTypes = {
    /**
     * The aspect ratio, which designates the Ratio component's width and
     * height. Written in the format of `x:y`, for example `4:3`.
     */
    aspect: aspectPropType,

    /**
     * The content that will be rendered inside `pw-ratio__inner`.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Designates the Ratio component's height.
     */
    height: positiveValue,

    /**
     * Designates the Ratio component's width.
     */
    width: positiveValue
}

export {Ratio as default, aspectPropType}
