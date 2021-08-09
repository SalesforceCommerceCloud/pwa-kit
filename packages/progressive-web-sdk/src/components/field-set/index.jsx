// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
// /* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
// /* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// import React from 'react'
// import PropTypes from 'prop-types'
// import classNames from 'classnames'

// /**
//  * Related components:
//  *
//  * * [Field](#!/Field)
//  * * [FieldRow](#!/FieldRow)
//  *
//  * The `FieldSet` component is used to group several inputs within a form.
//  *
//  * @example ./DESIGN.md
//  */
// const FieldSet = ({children, className, legend}) => {
//     const classes = classNames('pw-field-set', className)

//     return (
//         <fieldset className={classes}>
//             {legend && <legend className="pw-field-set__legend">{legend}</legend>}

//             {children}
//         </fieldset>
//     )
// }

// FieldSet.propTypes = {
//     /**
//      * The content that should be rendered within a FieldSet.
//      * Generally we'll be putting `FieldRow` components in here.
//      */
//     children: PropTypes.node,

//     /**
//      * Adds values to the `class` attribute of the root element.
//      */
//     className: PropTypes.string,

//     /**
//      * Sets the legend of the fieldset.
//      */
//     legend: PropTypes.oneOfType([PropTypes.string, PropTypes.node])
// }

// export default FieldSet
