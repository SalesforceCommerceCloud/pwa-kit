/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import SkeletonInline from '../skeleton-inline'

/**
 * Related components:
 *
 * * [SkeletonBlock](#!/SkeletonBlock)
 * * [SkeletonInline](#!/SkeletonInline)
 *
 * A skeleton component that mimics lines of text on a page. Internally, it uses `<SkeletonInline />`.
 *
 * @example ./DESIGN.md
 */
const SkeletonText = (props) => {
    const classes = classNames('pw-skeleton-text', props.className)
    const lineClasses = classNames('pw-skeleton-text__line', props.lineClassName)

    const attributes = {
        role: 'presentation',
        className: classes,
        style: props.style
    }

    const skeletons = []
    for (let i = 0; i < props.lines; i++) {
        skeletons.push(
            <SkeletonInline
                key={i}
                type="div"
                size={props.size}
                width={props.width}
                className={lineClasses}
            />
        )
    }

    return React.createElement(props.type, attributes, skeletons)
}

SkeletonText.defaultProps = {
    lines: 1,
    style: {},
    type: 'span'
}

SkeletonText.propTypes = {
    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Adds values to the `class` attribute of the text line elements.
     */
    lineClassName: PropTypes.string,

    /**
     * Specifies the number of lines in the skeleton.
     */
    lines: PropTypes.number,

    /**
    * Specifies the font-size (effectively the height) of the skeleton elements,
    in any valid dimension type.
    */
    size: PropTypes.string,

    /**
     * Specifies any inline styles to be applied to the skeleton.
     */
    style: PropTypes.object,

    /**
     * Specifies the element type to be constructed.
     */
    type: PropTypes.string,

    /**
     * Specifies the width of the skeleton elements' children.
     */
    width: PropTypes.string
}

export default SkeletonText
