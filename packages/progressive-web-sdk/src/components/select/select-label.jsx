/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

/**
 * <strong style="color:red; font-size:20px;">Deprecated.</strong>
 */

const SelectLabel = ({htmlFor, label}) => {
    if (label) {
        // @TODO: This sub-component should also output the current selected
        //        option's text value. Currently if label is set, only the label
        //        is visible inside the select. The options become invisible!
        return (
            <label htmlFor={htmlFor} className="pw-select__label c-select__label">
                {label}
            </label>
        )
    } else {
        return false
    }
}

SelectLabel.propTypes = {
    htmlFor: PropTypes.string,
    label: PropTypes.string
}

export default SelectLabel
