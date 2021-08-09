// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// import React from 'react'
// import PropTypes from 'prop-types'
// import StepperButton from '../partials/stepper-button'
// import * as utils from '../../../utils/component'
// import {ANALYTICS_NAME_COUNT, ANALYTICS_NAME_INCREMENT, ANALYTICS_NAME_DECREMENT} from '../index'

// /**
//  * The `StatefulStepper` is used in the `Stepper` component.
//  * It manages it's own value as internal state.
//  */
// class StatefulStepper extends React.Component {
//     constructor(props) {
//         super(props)

//         let initialValue = props.initialValue

//         initialValue = this.getBoundedValue(initialValue)

//         this.state = {
//             value: initialValue
//         }

//         this.incrementValue = this.incrementValue.bind(this)
//         this.decrementValue = this.decrementValue.bind(this)
//         this.getBoundedValue = this.getBoundedValue.bind(this)
//         this.onChange = this.onChange.bind(this)
//         this.setBoundedValue = this.setBoundedValue.bind(this)
//         this.interval = 1
//     }

//     componentWillReceiveProps(nextProps) {
//         const boundedValue = this.getBoundedValue(this.state.value, nextProps)
//         // This is an optimization, so we can't really test it
//         /* istanbul ignore else */
//         if (boundedValue !== this.state.value) {
//             this.setState({
//                 value: boundedValue
//             })
//         }
//     }

//     setBoundedValue(value) {
//         const nextValue = this.getBoundedValue(value)

//         if (!isNaN(nextValue)) {
//             this.setState({
//                 value: nextValue
//             })
//         }

//         this.props.onChange && this.props.onChange(nextValue)
//     }

//     incrementValue(evt) {
//         evt.preventDefault()
//         this.setBoundedValue(this.state.value + this.interval)
//     }

//     decrementValue(evt) {
//         evt.preventDefault()
//         this.setBoundedValue(this.state.value - this.interval)
//     }

//     getBoundedValue(newValue, props = this.props) {
//         return utils.getBoundedValue(newValue, props.minimumValue, props.maximumValue)
//     }

//     onChange(e) {
//         this.setBoundedValue(e.target.value)
//     }

//     onClickInput(e) {
//         const input = e.target
//         input.setSelectionRange(0, input.value.length)
//     }

//     render() {
//         const {
//             countAnalyticsName,
//             decrementAnalyticsName,
//             decrementIcon,
//             decrementText,
//             disabled,
//             name,
//             incrementAnalyticsName,
//             incrementIcon,
//             incrementText,
//             inputId,
//             iconSize
//         } = this.props

//         const decrementDisabled =
//             disabled || this.getBoundedValue(this.state.value - this.interval) === this.state.value
//         const incrementDisabled =
//             disabled || this.getBoundedValue(this.state.value + this.interval) === this.state.value

//         return (
//             <div>
//                 <div>
//                     <div className="pw-stepper__inner">
//                         <StepperButton
//                             isDecrement
//                             onClick={this.decrementValue}
//                             icon={decrementIcon}
//                             iconSize={iconSize}
//                             text={decrementText}
//                             title={decrementText}
//                             disabled={decrementDisabled}
//                             analyticsName={decrementAnalyticsName}
//                         />

//                         <div className="pw-stepper__count">
//                             <input
//                                 className="pw-stepper__input"
//                                 id={inputId}
//                                 type="tel"
//                                 value={this.state.value}
//                                 name={name}
//                                 disabled={disabled}
//                                 onChange={this.onChange}
//                                 onClick={this.onClickInput}
//                                 data-analytics-name={countAnalyticsName}
//                             />
//                         </div>

//                         <StepperButton
//                             isIncrement
//                             onClick={this.incrementValue}
//                             icon={incrementIcon}
//                             iconSize={iconSize}
//                             text={incrementText}
//                             title={incrementText}
//                             disabled={incrementDisabled}
//                             analyticsName={incrementAnalyticsName}
//                         />
//                     </div>
//                 </div>
//             </div>
//         )
//     }
// }

// StatefulStepper.defaultProps = {
//     countAnalyticsName: ANALYTICS_NAME_COUNT,
//     decrementAnalyticsName: ANALYTICS_NAME_DECREMENT,
//     decrementText: 'decrement quantity',
//     disabled: false,
//     incrementAnalyticsName: ANALYTICS_NAME_INCREMENT,
//     incrementText: 'increment quantity',
//     initialValue: 0,
//     maximumValue: null,
//     minimumValue: 0
// }

// StatefulStepper.propTypes = {
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
//      * Change icon size
//      */
//     iconSize: PropTypes.string,

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
//      * Sets the initial value of the Field's input.
//      */
//     initialValue: PropTypes.number,

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
//     name: PropTypes.string,

//     /**
//      * A function called when the stepper changes, and gets the new value
//      * passed as an argument.
//      */
//     onChange: PropTypes.func
// }

// export default StatefulStepper
