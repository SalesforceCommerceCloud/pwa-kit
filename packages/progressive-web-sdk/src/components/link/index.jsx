/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {Link as RawLink} from 'react-router'
import classNames from 'classnames'

import isReactRoute, {ORIGIN} from '../../routing/is-react-route'

/**
 * A link that converts to a react-router Link for paths within the React
 * site. It can take the link text/content either as child elements or as
 * a `text` prop.
 * If no href is passed, the link is rendered with a `#` href.
 * The list of routes from your project is automatically used to make decisions
 * whether the component renders a react-route link or an anchor tag'.
 */
const Link = ({
    children,
    className,
    data,
    href,
    openInNewTab,
    text,
    onBlur,
    onClick,
    onFocus,
    onMouseEnter,
    onMouseLeave,
    ...props
}) => {
    let contents
    if ((!children || !children.length) && text) {
        contents = text
    } else {
        contents = children
    }

    const attrs = {
        className: classNames('pw-link', className),
        onBlur,
        onClick,
        onFocus,
        onMouseEnter,
        onMouseLeave,
        ...data,
        ...props
    }

    if (openInNewTab) {
        attrs.target = '_blank'
        attrs.rel = 'noopener'
    }

    if (isReactRoute(href)) {
        return (
            <RawLink to={href.replace(ORIGIN, '')} {...attrs}>
                {contents}
            </RawLink>
        )
    } else {
        return (
            <a href={href} {...attrs}>
                {contents}
            </a>
        )
    }
}

Link.defaultProps = {
    href: 'javascript:'
}

Link.propTypes = {
    /**
     * Any children for the Link component or anchor element.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * <p style="color:red;">Deprecated</p> An object of data key/value pairs that are passed
     * through to the underlying DOM node.
     * Now that the Link component relays arbitrary props, this is unnecessary.
     */
    data: (props, propName, componentName) => {
        const dataPropObj = props[propName]
        if (dataPropObj) {
            const isDataPropValid = Object.keys(dataPropObj).every((dataProp) =>
                dataProp.startsWith('data')
            )

            if (!isDataPropValid) {
                return new Error(
                    'Invalid prop ' +
                    propName +
                    ' supplied to ' +
                    componentName +
                    '.' + // eslint-disable-line prefer-template
                        " Make sure it's an object with keys that start with 'data-'." +
                        ' Validation failed.'
                )
            }
        }
        return null
    },

    /**
     * The intended target URL.
     */
    href: PropTypes.string,

    /**
     * If true, target="_blank" will be added to the link.
     * Only use this property if you trust the link! https://mathiasbynens.github.io/rel-noopener
     */
    openInNewTab: PropTypes.bool,

    /**
     * The text of the link (only used if no children are passed)
     */
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * User-defined method for hooking into blur events. Use with
     * onMouseLeave as a keyboard substitute for hover events.
     */
    onBlur: PropTypes.func,

    /**
     * A callback to be called when the Link is clicked.
     */
    onClick: PropTypes.func,

    /**
     * User-defined method for hooking into focus events. Use with
     * onMouseEnter as a keyboard substitute for hover events.
     */
    onFocus: PropTypes.func,

    /**
     * User-defined method for hooking into mouseEnter events. Use with the onFocus prop for keyboard a11y purposes.
     */
    onMouseEnter: PropTypes.func,

    /**
     * User-defined method for hooking into mouseLeave events. Use with the onBlur prop for keyboard a11y purposes.
     */
    onMouseLeave: PropTypes.func
}

Link.displayName = 'Link'

export default Link
