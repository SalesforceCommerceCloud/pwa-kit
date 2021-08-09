/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Link from '../link'
import Icon from '../icon'
import {onKeyUpWrapper} from '../../utils/a11y'

/**
 * A styleable, accessible button component.
 *
 * @example ./DESIGN.md
 */

class Button extends React.PureComponent {
    render() {
        const {
            // Values
            href,
            icon,
            iconSize,
            iconClassName,
            innerClassName,
            showIconText,
            text,
            title,
            type,

            // Attributes
            id,
            className,
            disabled,
            name,
            value,
            role,
            openInNewTab,

            // Handlers
            onBlur,
            onClick,
            onFocus,
            onMouseEnter,
            onMouseLeave
        } = this.props

        const classes = classNames(
            'pw-button',
            {
                'pw--anchor': !!href,
                'pw--icon-only': !!icon && !this.props.children
            },
            className
        )
        const innerClass = classNames('pw-button__inner', innerClassName)
        const iconClass = classNames('pw-button__icon', iconClassName, {
            'pw--has-siblings': this.props.children || (title && showIconText)
        })
        const textClass = classNames('pw-button__text', {
            'u-visually-hidden': !showIconText
        })

        const attrs = {
            href,
            id,
            disabled,
            name,
            value,
            role,
            onBlur,
            onClick,
            onFocus,
            onMouseEnter,
            onMouseLeave,
            onKeyUp: onKeyUpWrapper(onClick),
            className: classes
        }

        let children

        if (icon) {
            children = [
                <Icon className={iconClass} size={iconSize} name={icon} key="autoicon" />,
                title && (
                    <span className={textClass} key="autotitle">
                        {title}
                    </span>
                )
            ]

            if (typeof this.props.children === 'string') {
                children.push(this.props.children)
            } else {
                children.push(...(this.props.children || []))
            }
        } else {
            children = text || this.props.children
        }

        // Add all aria and data attributes
        Object.keys(this.props).forEach((key) => {
            if (/^(aria|data)-/.test(key)) {
                attrs[key] = this.props[key]
            }
        })

        if (href) {
            return (
                <Link {...attrs} openInNewTab={openInNewTab}>
                    <div className={innerClass}>{children}</div>
                </Link>
            )
        } else {
            return (
                <button {...attrs} type={type}>
                    <div className={innerClass}>{children}</div>
                </button>
            )
        }
    }
}

Button.defaultProps = {
    type: 'button'
}

Button.propTypes = {
    /**
     * Any children to be nested within this button.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Defines if button is disabled.
     */
    disabled: PropTypes.bool,

    /**
     * If specified, the component is rendered as a link, with this value set as the href.
     */
    href: PropTypes.string,

    /**
     * If specified, includes an icon of the given name in the button.
     * For more information about available icons, see the `Icon` component.
     */
    icon: PropTypes.string,

    /**
     * Adds values to the class attribute in the `Icon` component.
     */
    iconClassName: PropTypes.string,

    /**
     * If specified, will set the icon to the size of your choice.
     */
    iconSize: PropTypes.string,

    /**
     * Sets the `id` attribute of the root element.
     */
    id: PropTypes.string,

    /**
     * Adds values to the class attribute of the inner container.
     */
    innerClassName: PropTypes.string,

    /**
     * The button's `name` attribute.
     */
    name: PropTypes.string,

    /**
     * For use with Buttons with an href set.
     *
     * If true, target="_blank" will be added to the button.
     * Only use this property if you trust the link! https://mathiasbynens.github.io/rel-noopener
     */
    openInNewTab: PropTypes.bool,

    /**
     * The button's `role` attribute.
     */
    role: PropTypes.string,

    /**
     * For use when the icon and title attributes have been defined.
     * If false, `u-visually-hidden` class will be added to the container that wraps
     * the title attribute. If true, `u-visually-hidden` will be removed.
     *
     */
    showIconText: PropTypes.bool,

    /**
     * Text contents of the button.
     */
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * The title to be used for accessibility (generally if `icon` is used).
     * If showIconText is set to true, this text will be shown with the icon
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * Specifies button type, defaults to `button`.
     */
    type: PropTypes.oneOf(['button', 'submit']),

    /**
     * The button's `value` attribute.
     */
    value: PropTypes.string,

    /**
     * User-defined method for hooking into blur events. Use with
     * onMouseLeave as a keyboard substitute for hover events.
     */
    onBlur: PropTypes.func,

    /**
     * User-defined method for hooking into click events.
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

export default Button
