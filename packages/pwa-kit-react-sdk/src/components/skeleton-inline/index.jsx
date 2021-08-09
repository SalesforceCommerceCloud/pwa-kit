/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related components:
 *
 * * [SkeletonBlock](#!/SkeletonBlock)
 * * [SkeletonText](#!/SkeletonText)
 *
 * An inline skeleton component respects text properties such as line-height
 * and font-size (which effectively becomes the height).
 */
const SkeletonInline = (props) => {
    const classes = classNames(`pw-skeleton-inline`, props.className)

    const styles = {
        fontSize: props.size,
        width: props.width,
        ...props.style
    }

    const attributes = {
        role: 'presentation',
        className: classes,
        style: styles
    }

    // Add an href to the element's attributes if we're rendering an anchor
    if (props.type === 'a') {
        attributes.href = '#'
    }

    return React.createElement(props.type, attributes)
}

SkeletonInline.defaultProps = {
    size: 'inherit',
    type: 'span',
    width: '100%'
}

SkeletonInline.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Specifies the font-size (effectively the height) of the skeleton, in any valid dimension type.
     */
    size: PropTypes.string,

    /**
     * Specifies any inline styles to be applied to the element.
     */
    style: PropTypes.object,

    /**
     * Specifies the element type to be constructed.
     */
    type: PropTypes.string,

    /**
     * Specifies the width of the skeleton's children's width, in any valid dimension type.
     */
    width: PropTypes.string
}

export default SkeletonInline
