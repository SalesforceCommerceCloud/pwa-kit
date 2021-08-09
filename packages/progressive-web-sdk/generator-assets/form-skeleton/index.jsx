/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2017 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {reduxForm} from 'redux-form'
import {connect} from 'react-redux'

import classNames from 'classnames'

import FormFields from 'progressive-web-sdk/dist/components/form-fields'
import SkeletonBlock from 'progressive-web-sdk/dist/components/skeleton-block'

const validate = (values) => {
    const errors = {
    }

    /**
     * Write your validation here. Eg:
     *
     * if (values.email === undefined) {
     *     errors.email = "Email is required"
     * }
     *
     */

    return errors
}

let <%= context.Name %> = ({
    error,
    className,
    formFields,
    handleSubmit,
    invalid,
    pristine,
    submitting,
}) => {
    const classes = classNames('pw-form', className)
    const submitButtonText = submitting ? 'Submitting...' : 'Submit'

    return (
        <form onSubmit={handleSubmit} className={classes}>
            {formFields ?
                <FormFields items={formFields} />
            :
                <div>
                    <SkeletonBlock className="short" width="20%" height="15px" />
                    <SkeletonBlock width="95%" height="45px" />
                </div>
            }

            {error && <span className="u-color-error">{error}</span>}

            <button type="submit" disabled={pristine || submitting || invalid}>{submitButtonText}</button>
        </form>
    )
}

<%= context.Name %> = reduxForm({
    enableReinitialize: true,
    form: '<%= context.name %>',
    validate
})(<%= context.Name %>)

<%= context.Name %>.propTypes = {
    className: PropTypes.string,
    error: PropTypes.string,
    formFields: PropTypes.array,
    handleSubmit: PropTypes.func,
    invalid: PropTypes.bool,
    pristine: PropTypes.bool,
    submitting: PropTypes.bool
}

const mapStateToProps = (state, props) => {
    return {
        // initialValues: state.<%= context.name %>.initialValues
    }
}

<%= context.Name %> = connect(
    mapStateToProps
)(<%= context.Name %>)

export default <%= context.Name %>
