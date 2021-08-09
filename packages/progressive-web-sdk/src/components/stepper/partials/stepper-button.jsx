// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'
// import Button from '../../button'

// const StepperButton = ({
//     className,
//     analyticsName,
//     disabled,
//     icon,
//     text,
//     title,
//     onClick,
//     isDecrement,
//     iconSize
// }) => {
//     const buttonClass = isDecrement ? 'pw--decrement' : 'pw--increment'
//     const classes = classNames('pw-stepper__button', className, `${buttonClass}`)
//     return (
//         <div className="pw-stepper__action">
//             <Button
//                 className={classes}
//                 icon={icon}
//                 iconSize={iconSize}
//                 text={text}
//                 title={title}
//                 disabled={disabled}
//                 data-analytics-name={analyticsName}
//                 onClick={onClick}
//             />
//         </div>
//     )
// }

// StepperButton.propTypes = {
//     /**
//      * Analytics name to use for the button.
//      */
//     analyticsName: PropTypes.string,
//     /**
//      * Adds values to the `class` attribute of the root element.
//      */
//     className: PropTypes.string,
//     /**
//      * Defines if the button is disabled.
//      */
//     disabled: PropTypes.bool,
//     /**
//      * Icon to use for the button.
//      */
//     icon: PropTypes.string,
//     /**
//      * Change icon size
//      */
//     iconSize: PropTypes.string,
//     /**
//      * Determines whether it is a decrement button
//      */
//     isDecrement: PropTypes.bool,
//     /**
//      * Text for the button.
//      */
//     text: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
//     /**
//      * Title for the button.
//      */
//     title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
//     /**
//      * Click handler for the button.
//      */
//     onClick: PropTypes.func
// }

// export default StepperButton
