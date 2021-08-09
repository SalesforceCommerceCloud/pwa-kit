/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import SelectLabel from './select-label'
import SelectOption from './select-option'
import Icon from '../icon'
import {noop} from '../../utils/utils'

/**
 * <strong style="color:red; font-size:20px;">Deprecated.</strong>
 * This component is deprecated in favour of a native `<select>`
 * element in a Form component.
 *
 * Select is a dropdown component that simulates the behavior of a standard HTML
 * `<select>` tag, but with some unique features: easier to customize its visual
 * appearance, and the ability to accept options as a Javascript Array.
 */
const Select = ({
    className,
    label,
    iconProps,
    isDisabled,
    isRequired,
    onBlur,
    onChange,
    options,
    selectedIndex,

    // Attributes
    id,
    multiple,
    name
}) => {
    console.warn(
        'Select component is deprecated and will be removed from the Progressive Web SDK by v1.0.0'
    )

    const classes = classNames('pw-select c-select', className, {
        'pw--inner-label c--inner-label': label,
        'pw--disabled c--disabled': isDisabled,
        'pw--required c--required': isRequired
    })
    const iconClasses = classNames('pw-select__icon c-select__icon', {
        ...iconProps.className
    })

    const attrs = {id, multiple, name}
    let defaultVal

    if (options.length) {
        defaultVal = multiple ? [options[selectedIndex].value] : options[selectedIndex].value
    }

    return (
        <div className={classes}>
            <SelectLabel htmlFor={id} label={label} />

            <select
                {...attrs}
                className="pw-select__select c-select__select"
                onBlur={onBlur}
                onChange={onChange}
                defaultValue={defaultVal}
                disabled={isDisabled}
                required={isRequired}
            >
                {options.map((option, index) => (
                    <SelectOption {...option} key={index} />
                ))}
            </select>

            <Icon {...iconProps} className={iconClasses} name={iconProps.name || 'caret-bottom'} />
        </div>
    )
}

Select.defaultProps = {
    iconProps: {},
    onChange: noop,
    options: [],
    selectedIndex: 0
}

Select.propTypes = {
    /**
     * The list of options for the select element
     *
     * Each option should be an object with the structure:
     *
     * value: (required) A string containing the value of the option
     *
     * text: (optional) A string containing the text of the option
     *
     * If text is not passed, the value will be used as the text
     */
    options: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string.isRequired,
            text: PropTypes.string
        })
    ).isRequired,
    /**
     * add classes ie. 'c-test-class c-test-class__modifier' for the root element
     */
    className: PropTypes.string,
    /**
     * The name of the icon displayed in the Select component
     */
    iconProps: PropTypes.object,
    /**
     * The value for the ID attribute on the <select> element
     */
    id: PropTypes.string,
    /**
     * pass in boolean, determines whether <select> will have disabled property
     */
    isDisabled: PropTypes.bool,
    /**
     * pass in boolean, determines whether <select> will have required property
     */
    isRequired: PropTypes.bool,
    /**
     * if label string exists a <label> will be rendered with the passed in string as its text
     */
    label: PropTypes.string,
    /**
     * The value for the multiple attribute on the <select> element (https://developer.mozilla.org/en/docs/Web/HTML/Element/select#Attributes)
     */
    multiple: PropTypes.bool,
    /**
     * The value for the name attribute on the <select> element
     */
    name: PropTypes.string,
    /**
     * pass in a number to initialize the select with the option at that index
     */
    selectedIndex: PropTypes.number,
    /**
     * function to pass in that triggers on the onBlur hook. This is preferred
     * over onChange for a11y.
     */
    onBlur: PropTypes.func,
    /**
     * function to pass in that triggers on the onChange hook
     */
    onChange: PropTypes.func
}

export default Select
