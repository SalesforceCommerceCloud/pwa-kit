/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
import * as selectors from './selectors'

/* eslint-disable newline-per-chained-call */

const testForm = {
    values: {
        val1: 'one',
        val2: 'two',
        val3: 'three'
    },
    registeredFields: [
        {
            name: 'test1'
        },
        {
            name: 'test2'
        }
    ]
}

const emptyValuesForm = {
    registeredFields: [
        {
            name: 'test1'
        },
        {
            name: 'test2'
        }
    ]
}

const regionTestForm = {
    registeredFields: [
        {
            name: 'region'
        }
    ]
}

const noRegisteredFieldsForm = {
    values: {
        test: 'one',
        test2: 'two'
    }
}

const appState = {
    form: {
        testForm,
        regionTestForm,
        emptyValuesForm,
        noRegisteredFieldsForm
    }
}

test('getFormByKey returns the correct form data', () => {
    expect(selectors.getFormByKey('testForm')(appState)).toEqual(testForm)
})

test('getFormByKey returns empty object if missing in state', () => {
    expect(selectors.getFormByKey('wrongKey')(appState)).toEqual({})
})

test('getFormValues returns the form values for the specified form object', () => {
    expect(selectors.getFormValues('testForm')(appState)).toEqual(testForm.values)
})

test('getFormValues returns an empty object if form object contains no values', () => {
    expect(selectors.getFormValues('emptyValuesForm')(appState)).toEqual({})
})

test('getFormRegisteredFields returns the registered fields for the specified form object', () => {
    expect(selectors.getFormRegisteredFields('testForm')(appState)).toEqual(
        testForm.registeredFields
    )
})

test('getFormRegisteredFields returns an empty array if form object contains no registered fields', () => {
    expect(selectors.getFormRegisteredFields('noRegisteredFieldsForm')(appState)).toEqual([])
})

test('isRegionFreeForm returns true when region field exists in form', () => {
    expect(selectors.isRegionFreeform('regionTestForm')(appState)).toBe(true)
})

test('isRegionFreeForm returns false when no region field exists in form', () => {
    expect(selectors.isRegionFreeform('testForm')(appState)).toBe(false)
})
