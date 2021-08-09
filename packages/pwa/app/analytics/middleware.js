import {getAnalyticsManager} from './index'
import {ONLINE_STATUS_CHANGED, SEND_PAGEVIEW_ANALYTICS} from '../actions'
import {PAGEVIEW, OFFLINE} from 'progressive-web-sdk/dist/analytics-integrations/types'
import {actionTypes} from 'redux-form'
import {ERROR} from 'progressive-web-sdk/src/analytics-integrations/types'

// eslint-disable-next-line no-unused-vars
const analyticsMiddleware = (store) => (next) => (action) => {
    const analyticsManager = getAnalyticsManager()
    const {payload, type} = action

    switch (type) {
        case SEND_PAGEVIEW_ANALYTICS:
            analyticsManager.track(PAGEVIEW, {
                templateName: payload.templateName,
                location: payload.location,
                path: payload.path,
                title: payload.title
            })
            break
        case ONLINE_STATUS_CHANGED:
            analyticsManager.track(OFFLINE, {
                startTime: payload.startTime
            })
            break
        case actionTypes.STOP_SUBMIT: {
            const formName = action.meta.form
            const formErrors = action.payload
            const fieldsWithErrors = Object.keys(action.payload)
            trackFormErrors(formName, formErrors, fieldsWithErrors)
            break
        }
        case actionTypes.SET_SUBMIT_FAILED: {
            const formName = action.meta.form
            const formErrors = store.getState().form[action.meta.form].syncErrors
            const fieldsWithErrors = action.meta.fields
            trackFormErrors(formName, formErrors, fieldsWithErrors)
            break
        }

        case actionTypes.BLUR: {
            const formName = action.meta.form
            const formErrors = store.getState().form[action.meta.form].syncErrors
            const fieldsWithErrors = [action.meta.field]
            trackFormErrors(formName, formErrors, fieldsWithErrors)
            break
        }

        default:
            break
    }
    return next(action)
}

export default analyticsMiddleware

const trackFormErrors = (formName, formErrorsObject, fieldsWithErrors) => {
    if (!formErrorsObject || Object.entries(formErrorsObject).length <= 0) return null
    const analyticsManager = getAnalyticsManager()
    const errors = []

    // with redux-forms, a general form error has a field key of `_error`
    if (formErrorsObject['_error']) {
        errors.push({
            name: `${formName}_form`,
            content: formErrorsObject['_error']
        })
    }

    // check for errors in the fields of interest
    fieldsWithErrors.forEach((fieldName) => {
        if (formErrorsObject[fieldName]) {
            errors.push({
                name: `${formName}_form:${fieldName}`,
                content: formErrorsObject[fieldName]
            })
        }
    })

    // track the list of errors
    if (errors.length > 0) {
        errors.forEach((error) => {
            analyticsManager.track(ERROR, error)
        })
    }
}
