/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '../icon'

/**
 * Accessible feedback component that includes error and success styles
 *
 * @example ./DESIGN.md
 */

const Feedback = ({className, icon, text, title, isBlock, isError, isSuccess}) => {
    const classes = classNames(
        'pw-feedback',
        {
            'pw--error': isError,
            'pw--success': isSuccess,
            'pw--block': isBlock
        },
        className
    )
    let feedbackIcon

    if (!icon) {
        // These are default icons for success and error if user doesn't provide any icon for them
        if (isSuccess) {
            feedbackIcon = 'check'
        } else if (isError) {
            feedbackIcon = 'warning'
        }
    } else {
        // Use user input icon
        feedbackIcon = icon
    }

    return (
        <div className={classes}>
            {feedbackIcon && (
                <Icon className="pw-feedback__icon" name={feedbackIcon} title={title} />
            )}
            <div className="pw-feedback__content">{text}</div>
        </div>
    )
}

Feedback.propTypes = {
    /**
     * Text for the feedback.
     */
    text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Includes an icon of the given name in the feedback.
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    icon: PropTypes.string,

    /**
     * Defines if feedback is a block element.
     */
    isBlock: PropTypes.bool,

    /**
     * Defines if feedback is error.
     */
    isError: PropTypes.bool,

    /**
     * Defines if feedback is success.
     */
    isSuccess: PropTypes.bool,

    /**
     * The title to be used for accessibility.
     */
    title: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
}

export default Feedback
