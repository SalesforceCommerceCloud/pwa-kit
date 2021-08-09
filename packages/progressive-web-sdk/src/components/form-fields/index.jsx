/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {Field as ReduxFormField} from 'redux-form'
import classNames from 'classnames'

import Field from '../field'
import Fieldset from '../field-set'
import FieldRow from '../field-row'

/* eslint-disable no-use-before-define */
const buildFormFields = (items) => {
    // TODO: What did we decide to do about generating id's?
    return items.map((formItem, idx) => {
        const buildField = fieldBuilderMap[formItem.type]
        if (buildField === undefined) {
            throw new Error(
                `Invalid field type "${formItem.type}", expected one of "${Object.keys(
                    fieldBuilderMap
                ).join(', ')}"`
            )
        }
        return buildField({
            props: formItem.props,
            children: formItem.children,
            id: idx
        })
    })
}
/* eslint-enable no-use-before-define */

const buildFieldSet = (options) => {
    return (
        <Fieldset {...options.props} key={options.id}>
            {buildFormFields(options.children)}
        </Fieldset>
    )
}

const buildFieldRow = (options) => {
    return (
        <FieldRow {...options.props} key={options.id}>
            {buildFormFields(options.children)}
        </FieldRow>
    )
}

const buildReduxFormField = (options) => {
    return (
        <ReduxFormField
            key={options.id}
            name={options.props.name}
            label={options.props.label}
            component={Field}
            {...options.props}
        >
            <input type={options.props.type} {...options.props} />
        </ReduxFormField>
    )
}

const buildField = (options) => {
    return (
        <Field {...options.props} key={options.id}>
            <input type={options.props.type} {...options.props} />
        </Field>
    )
}

const fieldBuilderMap = {
    fieldSet: buildFieldSet,
    fieldRow: buildFieldRow,
    field: buildField,
    reduxFormField: buildReduxFormField
}

/**
 * <strong style="color:red; font-size:20px;">Deprecated.</strong>
 * Instead use [`Field`](#!/Field), [`FieldRow`](#!/FieldRow), and [`FieldSet`](#!/FieldSet).
 *
 * `FormFields` automatically renders fields for a form given a JSON config
 *  that describes the form's structure. The rendered fields can optionally be
 *  configured to be compatible with `redux-form`.
 */
const FormFields = (props) => {
    const {className, items} = props

    const classes = classNames('pw-form-fields c-form-fields', className)
    const fields = buildFormFields(items)

    return <div className={classes}>{fields}</div>
}

FormFields.propTypes = {
    /**
     * An array describing the FormFields. The array contains objects of the form:
     * ```
     * { type: 'theType', ...additionalProperties }
     * ```
     * The types, and their additional properties are:
     *
     * **fieldSet**: children, props (optional)
     *
     * **fieldRow**: children, props (optional)
     *
     * **field**: props.type, ...props
     *
     * **reduxFormField**: props.name, props.label, props.type, ...props
     */
    items: PropTypes.array.isRequired,

    /**
     * Extra class names to apply to the wrapping div of the FormFields
     */
    className: PropTypes.string
}

export default FormFields
