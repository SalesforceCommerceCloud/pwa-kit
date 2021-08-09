/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

// Custom PropType Validators

const validator = (valuePredicate, typeDescription) => (props, propName, componentName) => {
    const value = props[propName]

    if (valuePredicate(value, props)) {
        return null
    }

    return new Error(
        `Invalid prop ${propName} supplied to ${componentName}. ${propName} should be ${typeDescription}.`
    )
}

export const positiveValue = validator(
    (value) => (typeof value === 'number' || typeof value === 'string') && value > 0,
    'a number or numeric string greater than 0'
)

export const positiveNumber = validator(
    (value) => typeof value === 'number' && value >= 0,
    'a number greater than or equal to 0'
)

export const percentage = validator((value) => {
    const numberValue = parseFloat(value)
    return numberValue >= 1 && numberValue <= 100
}, "a percentage value from '1%' to '100%'")

export const childIndexProp = validator((value, props) => {
    const numberValue = parseInt(value, 10)
    return numberValue >= 0 && numberValue < props.children.length
}, 'a number value from 0 to 1 less than the tab panels count')
