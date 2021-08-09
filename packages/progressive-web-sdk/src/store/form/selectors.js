/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {createSelector} from 'reselect'

export const getForm = ({form}) => form

export const getFormByKey = (formKey) =>
    createSelector(
        getForm,
        (form) => {
            return form[formKey] ? form[formKey] : {}
        }
    )
export const getFormValues = (formKey) =>
    createSelector(
        getFormByKey(formKey),
        ({values}) => values || {}
    )

export const getFormRegisteredFields = (formKey) =>
    createSelector(
        getFormByKey(formKey),
        ({registeredFields}) => {
            return registeredFields ? registeredFields : []
        }
    )

export const isRegionFreeform = (formName) =>
    createSelector(
        getFormRegisteredFields(formName),
        (fields) => fields.some(({name}) => name === 'region')
    )
