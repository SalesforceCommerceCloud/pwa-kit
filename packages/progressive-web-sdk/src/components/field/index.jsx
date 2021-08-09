// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
// import withUniqueId from '../with-unique-id'

// /**
//  * Related components:
//  *
//  * * [FieldRow](#!/FieldRow)
//  * * [FieldSet](#!/FieldSet)
//  *
//  * `Field` is a wrapper around a single form input that standardizes layout
//  * of labels, hints and errors when using `redux-form`.
//  *
//  * It expects to receive an `<input>`, `<select>`, `<textarea>` or a custom
//  * form-input component. Custom inputs should be compatible with redux-form
//  * which typically means accepting `onChange`, `onBlur` and `value` props.
//  *
//  * @example ./DESIGN.md
//  */
// class Field extends React.Component {
//     constructor(props) {
//         super(props)

//         if (props.idForLabel) {
//             this.inputId = props.idForLabel
//         } else {
//             this.inputId = `field-${props.id}`
//         }

//         this.isCheckRadio = false
//         this.shouldStackLabelInput = this.shouldStackLabelInput.bind(this)
//         this.shouldPlaceLabelAtEnd = this.shouldPlaceLabelAtEnd.bind(this)
//         this.buildEventHandler = this.buildEventHandler.bind(this)
//     }

//     shouldStackLabelInput() {
//         if (!this.props.labelPosition) {
//             return !this.isCheckRadio
//         } else {
//             return this.props.labelPosition === 'top'
//         }
//     }

//     shouldPlaceLabelAtEnd() {
//         if (!this.props.labelPosition) {
//             return this.isCheckRadio
//         } else {
//             return this.props.labelPosition === 'end'
//         }
//     }

//     buildEventHandler(eventHandlerName) {
//         const customHandler = this.props.customEventHandlers[eventHandlerName]
//         const input = this.props.input

//         if (input) {
//             return typeof customHandler === 'function'
//                 ? (e) => {
//                       this.props.input[eventHandlerName](e)
//                       customHandler(e)
//                   }
//                 : this.props.input[eventHandlerName]
//         }
//         return customHandler
//     }

//     render() {
//         const {
//             label,
//             hint,
//             error,
//             caption,
//             className,
//             children,
//             shouldShowErrorsInstantly,
//             customEventHandlers
//         } = this.props

//         let childDisabled = false
//         let childChecked = false
//         const onlyChild = React.Children.count(children) === 1

//         const newChildren = React.Children.map(children, (child, idx) => {
//             let childProps = {}

//             const isFormControl =
//                 child.type === 'input' ||
//                 child.type === 'select' ||
//                 child.type === 'textarea' ||
//                 typeof child.type == 'function' // Custom component, can handle props

//             if (isFormControl) {
//                 childProps = {...this.props.input}
//             }

//             if (customEventHandlers) {
//                 // Redux form adds it's own handlers for these events
//                 // In order to add our own and prevent redux-forms being overwritten
//                 // we need to build a new function that calls both
//                 // Overwritting redux form's handlers will cause validation to break
//                 childProps.onBlur = this.buildEventHandler('onBlur', childProps)
//                 childProps.onFocus = this.buildEventHandler('onFocus', childProps)
//                 childProps.onChange = this.buildEventHandler('onChange', childProps)
//                 childProps.onDrop = this.buildEventHandler('onDrop', childProps)
//                 childProps.onDragStart = this.buildEventHandler('onDragStart', childProps)
//             }

//             childProps = {
//                 ...childProps,
//                 'aria-invalid': !!error,
//                 'aria-required': child.props.required,
//                 ...child.props
//             }

//             if (child.props.disabled) {
//                 childDisabled = true
//             }

//             if (childProps.checked) {
//                 childChecked = true
//             }

//             if (error) {
//                 childProps.className = classNames(child.props.className, 'pw--has-error')
//             }

//             // Give the first child the id for the field
//             if (idx === 0) {
//                 childProps.id = this.inputId
//             }

//             if (onlyChild && (child.props.type === 'radio' || child.props.type === 'checkbox')) {
//                 this.isCheckRadio = true
//             }

//             if (child.props.required) {
//                 this.isRequired = true
//             }

//             return React.cloneElement(child, childProps)
//         })

//         const metaProps = this.props.meta
//         const shouldShowReduxError =
//             metaProps &&
//             ((metaProps.touched && !metaProps.active) ||
//                 (metaProps.dirty && shouldShowErrorsInstantly))
//         const reduxFormError = metaProps && shouldShowReduxError && metaProps.error
//         const fieldError = error || reduxFormError

//         const classes = classNames(
//             'pw-field',
//             {
//                 'pw--is-check-radio': this.isCheckRadio,
//                 'pw--error': fieldError,
//                 'pw--required': this.isRequired,
//                 'pw--disabled': childDisabled,
//                 'pw--checked': childChecked
//             },
//             className
//         )

//         const innerClasses = classNames('pw-field__inner', {
//             'pw--stack': this.shouldStackLabelInput()
//         })

//         const labelClasses = classNames('pw-field__label-wrap', {
//             'pw--end': this.shouldPlaceLabelAtEnd()
//         })

//         const inputClasses = classNames('pw-field__input')

//         return (
//             <div className={classes}>
//                 <div className={innerClasses}>
//                     {label && (
//                         <div className={labelClasses}>
//                             <label className="pw-field__label" htmlFor={this.inputId}>
//                                 {label}
//                             </label>

//                             {hint && <div className="pw-field__hint">{hint}</div>}
//                         </div>
//                     )}

//                     <div className={inputClasses}>{newChildren}</div>
//                 </div>

//                 {fieldError && <div className="pw-field__error">{fieldError}</div>}

//                 {caption && <div className="pw-field__caption">{caption}</div>}
//             </div>
//         )
//     }
// }

// Field.propTypes = {
//     /**
//      * The input(s) to include in the field.
//      */
//     children: PropTypes.node.isRequired,

//     /**
//      * Extra information that may help the user complete this field.
//      */
//     caption: PropTypes.node,

//     /**
//      * Adds values to the `class` attribute of the root element.
//      */
//     className: PropTypes.string,

//     /**
//      * Custom event handlers to be added to the input.
//      * If used with redux form these handlers will be called after
//      * the handlers added by redux form.
//      */
//     customEventHandlers: PropTypes.shape({
//         onBlur: PropTypes.func,
//         onChange: PropTypes.func,
//         onDrop: PropTypes.func,
//         onDragStart: PropTypes.func,
//         onFocus: PropTypes.func
//     }),
//     /**
//      * If this prop is passed in, the pw--error class will be added to the field
//      * and the error will be shown.
//      * Also adds the aria-invalid attribute.
//      */
//     error: PropTypes.node,

//     /**
//      * Extra information that displays beside the label.
//      */
//     hint: PropTypes.node,

//     /**
//      * If provided, this will be used as the 'id' attr for the input and the 'for' attr for the label.
//      * If not provided, an id will be generated and used.
//      */
//     idForLabel: PropTypes.string,

//     /**
//      * Developers can ignore this prop.
//      * If our field is used with redux-form this prop gets passed by redux-form.
//      */
//     input: PropTypes.object,

//     /**
//      * The label for the input.
//      * The id of the input will be used as the 'for' attribute for this label,
//      * unless one is already provided.
//      */
//     label: PropTypes.node,

//     /**
//      * Specify the position of the label. Default behaviour:
//      * If the input is a checkbox or radio, the label will display after the input
//      * Else, the label will display on top of the input.
//      */
//     labelPosition: PropTypes.oneOf(['top', 'start', 'end']),

//     /**
//      * Developers can ignore this prop.
//      * If our field is used with redux-form this prop gets passed by redux-form.
//      */
//     meta: PropTypes.object,

//     /**
//      * Indicates whether to show field errors instantly, i.e. as the user types
//      * in a field.
//      * Set this to `false` to show errors on blur.
//      */
//     shouldShowErrorsInstantly: PropTypes.bool,

//     /**
//      * Optional ID for the component. If not supplied a unique ID is generated
//      * automatically.
//      */
//     id: PropTypes.string
// }

// export {Field as FieldWithoutUniqueId}
// export default withUniqueId(Field)
