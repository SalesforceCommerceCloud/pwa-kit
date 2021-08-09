/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '../icon'
import Button from '../button'

/**
 * An icon and label combination. If no iconSize is passed in, the default will be medium
 *
 * @example ./DESIGN.md
 */

const IconLabel = ({label, iconName, iconPrefix, iconSize, button, className}) => {
    const classes = classNames('pw-icon-label', className)
    let iconLabel

    if (button) {
        const buttonClasses = classNames('pw--button', classes)
        const buttonInnerClasses = classNames('u-padding-0', button.buttonInnerClassName)

        iconLabel = (
            <Button
                onClick={button.onClick}
                className={buttonClasses}
                innerClassName={buttonInnerClasses}
                data-analytics-name={button.analyticsName}
                {...button.buttonProps}
            >
                <IconLabelContent
                    label={label}
                    iconName={iconName}
                    iconPrefix={iconPrefix}
                    iconSize={iconSize}
                />
            </Button>
        )
    } else {
        iconLabel = (
            <div className={classes}>
                <IconLabelContent
                    label={label}
                    iconName={iconName}
                    iconPrefix={iconPrefix}
                    iconSize={iconSize}
                />
            </div>
        )
    }

    return <div>{iconLabel}</div>
}

IconLabel.propTypes = {
    /**
     * The name of the icon to be used in the IconLabel.
     */
    iconName: PropTypes.string.isRequired,

    /**
     * The label text to be used in the IconLabel.
     */
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,

    /**
     * Render Button component
     */
    button: PropTypes.shape({
        /**
         * Analytics name for button event
         */
        analyticsName: PropTypes.string,

        /**
         * The properties for button
         */
        buttonProps: PropTypes.object,

        /**
         * Add classes to the inner div of button
         */
        buttonInnerClassName: PropTypes.string,

        /**
         * On click function for button
         */
        onClick: PropTypes.func
    }),

    /**
     * Adds values to the `class` attribute of the root element
     */
    className: PropTypes.string,

    /**
     * The icon prefix is the first part of the icon name/id. If you're using a
     * different icon set, the prefix may need to be modified.
     */
    iconPrefix: PropTypes.string,

    /**
     * Adds size of icon (normally, one of `small`, `medium`, or `large`).
     */
    iconSize: PropTypes.string
}

/**
 * Content in the IconLabel component
 */
const IconLabelContent = ({iconName, iconSize, label, iconPrefix}) => {
    const iconProps = {
        name: iconName,
        size: iconSize
    }

    if (iconPrefix) {
        iconProps.prefix = iconPrefix
    }

    return (
        <div>
            <Icon {...iconProps} />
            <span className="pw-icon-label__label">{label}</span>
        </div>
    )
}

IconLabelContent.propTypes = {
    iconName: PropTypes.string.isRequired,
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
    /**
     * Adds a prefix to the icon name (defaults to 'pw').
     */
    iconPrefix: PropTypes.string,
    iconSize: PropTypes.string
}

IconLabelContent.defaultProps = {
    iconSize: 'medium'
}

export default IconLabel
