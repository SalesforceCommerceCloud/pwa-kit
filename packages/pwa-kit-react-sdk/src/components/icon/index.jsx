/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import withUniqueId from '../with-unique-id'

/**
 * `Icon` component renders an SVG that uses the chosen symbol from the SVG sprite present on the page.
 *
 * @example ./DESIGN.md
 */

class Icon extends React.PureComponent {
    constructor(props) {
        super(props)

        this.id = `icon-${props.id}`
    }

    render() {
        const {prefix, name, title, size, className, style} = this.props

        const a11y = title.length ? {role: 'img'} : {'aria-hidden': 'true'}
        const sizeClass = `pw--${size}`

        const classes = classNames(
            'pw-icon',
            {
                [sizeClass]: !!size
            },
            className
        )

        return (
            <svg
                {...a11y}
                className={classes}
                title={title}
                aria-labelledby={this.id}
                style={style}
            >
                <title id={this.id}>{title}</title>
                <use role="presentation" xlinkHref={`#${prefix}-${name}`} />
            </svg>
        )
    }
}

Icon.defaultProps = {
    name: '',
    title: '',
    prefix: 'pw',
    style: {}
}

Icon.propTypes = {
    /**
     * Identifier for the desired icon. Usually the filename, sans its prefix.
     * For example, if the target icon is `pw-chevron-up.svg`, the name
     * is `chevron-up`.
     */
    name: PropTypes.string.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * ID for the component, `withUniqueId` will be responsible for generating
     * unique id to ensure that it's the same on the client and server-side.
     */
    id: PropTypes.string,

    /**
     * The prefix is the first part of the icon name/id. If you're using a
     * different icon set, the prefix may need to be modified.
     */
    prefix: PropTypes.string,

    /**
     * The size of the icon, controlled by CSS.
     */
    size: PropTypes.string,

    /**
     * Custom `style` attribute.
     */
    style: PropTypes.object,

    /**
     * **Beware** that ommitting a `title` will leave the icon **invisible** to
     * screen readers. If included, screen readers will read and treat the
     * icon like an image with alt text.
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

export {Icon as IconWithoutUniqueId}
export default withUniqueId(Icon)
