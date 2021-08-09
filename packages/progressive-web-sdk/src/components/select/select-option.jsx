/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'

/**
 * <strong style="color:red; font-size:20px;">Deprecated.</strong>
 */

const SelectOption = ({value, text}) => <option value={value}>{text || value}</option>

SelectOption.propTypes = {
    value: PropTypes.string.isRequired,
    text: PropTypes.string
}

export default SelectOption
