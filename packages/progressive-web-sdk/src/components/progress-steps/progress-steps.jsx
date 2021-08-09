/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'

/**
 * Related component:
 *
 * * [ProgressStepsItem](#!/ProgressStepsItem)
 *
 * `ProgressStep` component is commonly used in the checkout flow showing the user
 * which step they are currently on and an overview of the amount of steps in this workflow.
 *
 * @example ./DESIGN.md
 */
const ProgressSteps = ({className, children, disableIncompleteSteps}) => {
    // count of steps
    const total = children.length
    let completed = true
    const classes = classNames('pw-progress-steps', className)

    return (
        <ol className={classes}>
            {React.Children.map(children, (child, index) => {
                if (child.props.current) {
                    completed = false
                }

                const childProps = {
                    total,
                    number: index + 1,
                    key: index,
                    completed,
                    disabled: disableIncompleteSteps ? !child.props.current && !completed : false
                }

                return React.cloneElement(child, childProps)
            })}
        </ol>
    )
}

ProgressSteps.defaultProps = {
    disableIncompleteSteps: false
}

ProgressSteps.propTypes = {
    /**
     * The set of steps in the ProgressSteps. To be provided as
     * ProgressStepsItem components.
     */
    children: PropTypes.node.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,

    /**
     * Indicates if incomplete steps should be disabled
     */
    disableIncompleteSteps: PropTypes.bool
}

export default ProgressSteps
