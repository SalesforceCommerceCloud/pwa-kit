/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import Icon from '../icon'
import ProgressStepsStep from './partials/progress-steps-step'

/**
 * Related component:
 *
 * * [ProgressSteps](#!/ProgressSteps)
 *
 * This component is used inside `ProgressSteps` component to display each step.
 *
 * @example ./DESIGN.md
 */

const ProgressStepsItem = (props) => {
    const {
        className,
        completed,
        current,
        disabled,
        getStepMessage,
        href,
        icon,
        number,
        title,
        total,
        onClick
    } = props

    const classes = classNames(
        'pw-progress-steps__item',
        {
            'pw--current': current,
            'pw--completed': completed,
            'pw--disabled': disabled
        },
        className
    )

    const stepWidth = 100 / total
    const styles = {width: `${stepWidth}%`}

    return (
        <li className={classes} style={styles}>
            <ProgressStepsStep
                className="pw-progress-steps__step"
                href={!disabled ? href : undefined}
                onClick={!disabled ? onClick : undefined}
            >
                <div className="pw-progress-steps__label">
                    <div className="pw-progress-steps__number">
                        <div className="pw-progress-steps__badge">
                            {icon ? (
                                <Icon className="pw-progress-steps__icon" name={icon} />
                            ) : (
                                `${number}`
                            )}
                        </div>
                    </div>

                    <div className="pw-progress-steps__title">
                        {title}
                        <span className="u-visually-hidden">{getStepMessage(number, total)}</span>
                    </div>
                </div>
            </ProgressStepsStep>
        </li>
    )
}

const defaultGetStepMessage = (stepIndex, total) => `Step ${stepIndex} of ${total}`

ProgressStepsItem.defaultProps = {
    completed: false,
    getStepMessage: defaultGetStepMessage
}

ProgressStepsItem.propTypes = {
    /**
     * The label for the step.
     */
    title: PropTypes.string.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * PROVIDED INTERNALLY: Adds `pw--completed` styling class to completed step.
     */
    completed: PropTypes.bool,

    /**
     * Indicates whether the step is the current one.
     */
    current: PropTypes.bool,

    /**
     * Indicates whether the step is disabled.
     */
    disabled: PropTypes.bool,

    /**
     * This function should return a string (or node) that describes the meaning of each individual
     * "step" of the `ProgressSteps`. This function is run for each step, and is passed the current
     * step index and the total number of steps.
     */
    getStepMessage: PropTypes.func,

    /**
     * If provided, the ProgressStepsItem will render as a Link to this URL.
     */
    href: PropTypes.string,

    /**
     * Icon to be displayed in the ProgressStepsItem.
     * If omitted, the step number will be displayed instead.
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    icon: PropTypes.string,

    /**
     * PROVIDED INTERNALLY: The number of the step. Rendered if no icon is provided.
     */
    number: PropTypes.number,

    /**
     * PROVIDED INTERNALLY: Total number of steps in the ProgressSteps.
     */
    total: PropTypes.number,

    /**
     * Called when the ProgressStepsItem is clicked on
     */
    onClick: PropTypes.func
}

export default ProgressStepsItem
