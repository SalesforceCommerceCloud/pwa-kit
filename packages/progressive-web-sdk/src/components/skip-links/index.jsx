/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Skip Links are a simple technique that is used to provide a fast navigation
 * option for non-mouse users. For example, users who interact using keyboards,
 * screen readers or other assistive technologies.
 *
 * `SkipLinks` remain hidden until they are focused on by tabbing to it, etc., at
 * which point they become visible.
 *
 * @url: http://webaim.org/techniques/skipnav/
 *
 * @example ./DESIGN.md
 */

const SkipLinks = ({className, items}) => {
    const classes = classNames('pw-skip-links', className)
    return (
        <div className={classes}>
            {items.map(({target, label}, key) => (
                <a
                    href={target}
                    className="pw-skip-links__anchor"
                    key={`skip-link-${target}-${key}`}
                >
                    {label}
                </a>
            ))}
        </div>
    )
}

SkipLinks.defaultProps = {
    items: []
}

const targetPropType = (props, propName) => {
    const isAlphaNumeric = new RegExp(/^#[\w\-_]+$/).test(props[propName])
    if (!isAlphaNumeric) {
        return new Error(
            'SkipLinks item target is invalid. Must be an ID selector, starting with "#" followed by alphanumeric characters, dashes and underscores with no spaces.'
        )
    }

    return true
}

SkipLinks.propTypes = {
    /**
     * An array of items, each with a `target` and a `label`.
     */
    items: PropTypes.arrayOf(
        PropTypes.shape({
            target: targetPropType,
            label: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
        })
    ).isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string
}

export {SkipLinks as default, targetPropType}
