/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import StatefulStepper from './partials/stateful-stepper'
import ReduxFormStepper from './partials/redux-form-stepper'
import {noop} from '../../utils/utils'

export const ANALYTICS_NAME_COUNT = 'count'
export const ANALYTICS_NAME_INCREMENT = 'increment_quantity'
export const ANALYTICS_NAME_DECREMENT = 'decrement_quantity'

const getUniqueId = (() => {
    let i = 0

    return () => `stepper-${i++}`
})()

/**
 * The `Stepper` is a type of input that contains a number, which can be incremented
 * or decremented by clicking buttons. A common use for a stepper is a quantity
 * picker on a product page.
 *
 * @example ./DESIGN.md
 */
class Stepper extends React.Component {
    constructor(props) {
        super(props)

        this.inputId = props.idForLabel || getUniqueId()
    }

    render() {
        const {className, useReduxForm, label, stepperRef} = this.props

        const classes = classNames('pw-stepper', className)

        return (
            <div className={classes}>
                {label && <label htmlFor={this.inputId}>{label}</label>}

                {useReduxForm ? (
                    // Continue to use the stepperRef name here,
                    // as ref is not allowed on functional components
                    <ReduxFormStepper
                        {...this.props}
                        stepperRef={stepperRef}
                        inputId={this.inputId}
                    />
                ) : (
                    <StatefulStepper {...this.props} ref={stepperRef} inputId={this.inputId} />
                )}
            </div>
        )
    }
}

Stepper.defaultProps = {
    countAnalyticsName: ANALYTICS_NAME_COUNT,
    decrementAnalyticsName: ANALYTICS_NAME_DECREMENT,
    decrementText: 'decrement quantity',
    disabled: false,
    incrementAnalyticsName: ANALYTICS_NAME_INCREMENT,
    incrementText: 'increment quantity',
    maximumValue: null,
    minimumValue: 0,
    onDecreaseClick: noop,
    onIncreaseClick: noop,
    useReduxForm: false
}

Stepper.propTypes = {
    /**
     * The name of the input.
     */
    name: PropTypes.string.isRequired,

    /**
     * Click handler for decrease quantity button when using `redux-form` stepper.
     */
    onDecreaseClick: PropTypes.func.isRequired,
    /**
     * Click handler for increase quantity button when using `redux-form` stepper.
     */
    onIncreaseClick: PropTypes.func.isRequired,

    /**
     * Adds values to the `class` attribute of the root element.
     */
    className: PropTypes.string,
    /**
     * Analytics name to use for the count input.
     */
    countAnalyticsName: PropTypes.string,
    /**
     * Analytics name to use for the decrement button.
     */
    decrementAnalyticsName: PropTypes.string,
    /**
     * Icon to use for the decrement button.
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    decrementIcon: PropTypes.string,
    /**
     * Text for the decrement button.
     */
    decrementText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * Defines if the stepper button is disabled.
     */
    disabled: PropTypes.bool,
    /**
     * Used as the `id` attr for the input and the `for` attr for the label.
     * If not provided, a default ID is generated.
     */
    idForLabel: PropTypes.string,
    /**
     * Analytics name to use for the increment button.
     */
    incrementAnalyticsName: PropTypes.string,
    /**
     * Icon to use for the increment button.
     * For more information about available icons, see the [Icon component](#!/Icon).
     */
    incrementIcon: PropTypes.string,
    /**
     * Text for the increment button.
     */
    incrementText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * Sets the initial value of the Field's input.
     */
    initialValue: PropTypes.number,
    /**
     * Label of the stepper
     */
    label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
    /**
     * Sets the lower limit for the stepper.
     */
    maximumValue: PropTypes.number,
    /**
     * Sets the upper limit for the stepper.
     */
    minimumValue: PropTypes.number,
    /**
     * This function receives the instance of the inner Stepper component used
     */
    stepperRef: PropTypes.func,
    /**
     * Determines if the component works with redux-form or not.
     */
    useReduxForm: PropTypes.bool
}

export default Stepper
