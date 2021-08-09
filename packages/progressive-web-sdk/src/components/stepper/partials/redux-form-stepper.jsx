// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// import React from 'react'
// import PropTypes from 'prop-types'
// import StepperButton from '../partials/stepper-button'
// import * as ReduxForm from 'redux-form'
// import {getBoundedValue} from '../../../utils/component'
// import {ANALYTICS_NAME_COUNT, ANALYTICS_NAME_INCREMENT, ANALYTICS_NAME_DECREMENT} from '../index'

// const noop = () => undefined

// const QuantityInput = ({
//     countAnalyticsName,
//     disabled,
//     input,
//     inputId,
//     decrementAnalyticsName,
//     decrementIcon,
//     decrementText,
//     incrementAnalyticsName,
//     incrementIcon,
//     incrementText,
//     onDecreaseClick,
//     onIncreaseClick,
//     maximumValue,
//     minimumValue
// }) => {
//     const incrementDisabled = disabled || (maximumValue && input.value === maximumValue)
//     const decrementDisabled = disabled || input.value === minimumValue

//     return (
//         <div className="pw-stepper__inner">
//             <StepperButton
//                 isDecrement
//                 icon={decrementIcon}
//                 text={decrementText}
//                 title={decrementText}
//                 disabled={decrementDisabled}
//                 analyticsName={decrementAnalyticsName}
//                 onClick={onDecreaseClick}
//             />

//             <div className="pw-stepper__count">
//                 <input
//                     className="pw-stepper__input"
//                     type="tel"
//                     disabled={disabled}
//                     data-analytics-name={countAnalyticsName}
//                     id={inputId}
//                     {...input}
//                 />
//             </div>

//             <StepperButton
//                 icon={incrementIcon}
//                 text={incrementText}
//                 title={incrementText}
//                 disabled={incrementDisabled}
//                 analyticsName={incrementAnalyticsName}
//                 onClick={onIncreaseClick}
//             />
//         </div>
//     )
// }

// QuantityInput.propTypes = {
//     /**
//      * Click handler for decrease quantity button.
//      */
//     onDecreaseClick: PropTypes.func.isRequired,

//     /**
//      * Click handler for increase quantity button.
//      */
//     onIncreaseClick: PropTypes.func.isRequired,

//     /**
//      * Adds values to the `class` attribute of the root element.
//      */
//     className: PropTypes.string,

//     /**
//      * Analytics name to use for the count input.
//      */
//     countAnalyticsName: PropTypes.string,

//     /**
//      * Analytics name to use for the decrement button.
//      */
//     decrementAnalyticsName: PropTypes.string,

//     /**
//      * Icon to use for the decrement button.
//      */
//     decrementIcon: PropTypes.string,

//     /**
//      * Text for the decrement button.
//      */
//     decrementText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

//     /**
//      * Defines if the stepper button is disabled.
//      */
//     disabled: PropTypes.bool,

//     /**
//      * Analytics name to use for the increment button.
//      */
//     incrementAnalyticsName: PropTypes.string,

//     /**
//      * Icon to use for the increment button.
//      */
//     incrementIcon: PropTypes.string,

//     /**
//      * Text for the increment button.
//      */
//     incrementText: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),

//     /**
//      * [Internal] Props for input element added by redux form
//      */
//     input: PropTypes.object,

//     /**
//      * This prop sets the id for input.
//      */
//     inputId: PropTypes.string,

//     /**
//      * Sets the lower limit for the stepper.
//      */
//     maximumValue: PropTypes.number,

//     /**
//      * Sets the upper limit for the stepper.
//      */
//     minimumValue: PropTypes.number,

//     /**
//      * The name of the input.
//      */
//     name: PropTypes.string
// }

// /**
//  * The `ReduxFormStepper` is used in the `Stepper` component.
//  * Use this stepper inside redux form so you can use redux form to manage it's value.
//  */

// const ReduxFormStepper = ({
//     countAnalyticsName,
//     decrementAnalyticsName,
//     decrementIcon,
//     decrementText,
//     disabled,
//     name,
//     incrementAnalyticsName,
//     incrementIcon,
//     incrementText,
//     inputId,
//     maximumValue,
//     minimumValue,
//     onDecreaseClick,
//     onIncreaseClick,
//     stepperRef
// }) => {
//     return (
//         <ReduxForm.Field
//             component={QuantityInput}
//             name={name}
//             props={{
//                 countAnalyticsName,
//                 disabled,
//                 inputId,
//                 decrementAnalyticsName,
//                 decrementIcon,
//                 decrementText,
//                 incrementAnalyticsName,
//                 incrementIcon,
//                 incrementText,
//                 onDecreaseClick,
//                 onIncreaseClick,
//                 maximumValue,
//                 minimumValue
//             }}
//             normalize={(value) => getBoundedValue(value, minimumValue, maximumValue)}
//             withRef={!!stepperRef}
//             ref={stepperRef}
//         />
//     )
// }
// ReduxFormStepper.defaultProps = {
//     countAnalyticsName: ANALYTICS_NAME_COUNT,
//     decrementAnalyticsName: ANALYTICS_NAME_DECREMENT,
//     decrementText: 'decrement quantity',
//     disabled: false,
//     incrementAnalyticsName: ANALYTICS_NAME_INCREMENT,
//     incrementText: 'increment quantity',
//     maximumValue: null,
//     minimumValue: 0,
//     onDecreaseClick: noop,
//     onIncreaseClick: noop
// }

// ReduxFormStepper.propTypes = {
//     /**
//      * The name of the input.
//      */
//     name: PropTypes.string.isRequired,

//     /**
//      * Click handler for decrease quantity button.
//      */
//     onDecreaseClick: PropTypes.func.isRequired,

//     /**
//      * Click handler for increase quantity button.
//      */
//     onIncreaseClick: PropTypes.func.isRequired,

//     /**
//      * Adds values to the `class` attribute of the root element.
//      */
//     className: PropTypes.string,

//     /**
//      * Analytics name to use for the count input.
//      */
//     countAnalyticsName: PropTypes.string,

//     /**
//      * Analytics name to use for the decrement button.
//      */
//     decrementAnalyticsName: PropTypes.string,

//     /**
//      * Icon to use for the decrement button.
//      */
//     decrementIcon: PropTypes.string,

//     /**
//      * Text for the decrement button.
//      */
//     decrementText: PropTypes.string,

//     /**
//      * Defines if the stepper button is disabled.
//      */
//     disabled: PropTypes.bool,

//     /**
//      * Analytics name to use for the increment button.
//      */
//     incrementAnalyticsName: PropTypes.string,

//     /**
//      * Icon to use for the increment button.
//      */
//     incrementIcon: PropTypes.string,

//     /**
//      * Text for the increment button.
//      */
//     incrementText: PropTypes.string,

//     /**
//      * This prop sets the id for input.
//      */
//     inputId: PropTypes.string,

//     /**
//      * Sets the lower limit for the stepper.
//      */
//     maximumValue: PropTypes.number,

//     /**
//      * Sets the upper limit for the stepper.
//      */
//     minimumValue: PropTypes.number,

//     /**
//      * This function receives the instance of the inner Stepper component used
//      */
//     stepperRef: PropTypes.func
// }

// export default ReduxFormStepper
