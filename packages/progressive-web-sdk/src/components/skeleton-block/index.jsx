/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related components:
 *
 * * [SkeletonInline](#!/SkeletonInline)
 * * [SkeletonText](#!/SkeletonText)
 *
 * A skeleton component that can be used to mimic block-level components, such as images.
 *
 * @example ./DESIGN.md
 */
const SkeletonBlock = (props) => {
    const classes = classNames('pw-skeleton-block', props.className)

    const styles = {
        height: props.height,
        width: props.width,
        ...props.style
    }

    const attributes = {
        ...props,
        role: 'presentation',
        className: classes,
        style: styles
    }

    return React.createElement(props.type, attributes)
}
SkeletonBlock.defaultProps = {
    height: 'auto',
    style: {},
    type: 'div',
    width: '100%'
}

SkeletonBlock.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Specifies the height of the skeleton, in any valid dimension type.
     */
    height: PropTypes.string,

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

export default SkeletonBlock
