/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

import Button from '../button'

/**
 * Accessible `Banner` component that includes promo and alert styles
 *
 * @example ./DESIGN.md
 */

const Banner = ({children, className, icon, isAlert, href, title, onClick}) => {
    const classes = classNames('pw-banner', className, {
        'pw--alert': isAlert
    })

    return (
        <div className={classes}>
            <div className="pw-banner__content">{children}</div>

            <div className="pw-banner__action">
                <Button
                    className="pw-banner__button"
                    href={href}
                    icon={icon}
                    title={title}
                    onClick={onClick}
                />
            </div>
        </div>
    )
}

Banner.propTypes = {
    /**
     * Any children to be nested within this banner.
     */
    children: PropTypes.node,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * The intended target URL.
     */
    href: PropTypes.string,

    /**
     * Includes an icon of the given name in the banner.
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    icon: PropTypes.string,

    /**
     * Defines if banner is alert.
     */
    isAlert: PropTypes.bool,

    /**
     * The title to be used for accessibility.
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

    /**
     * `onClick` handler for hooking in click events.
     */
    onClick: PropTypes.func
}

export default Banner
