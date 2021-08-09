/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

export default class DataObject {
    constructor(
        requiredFields = [],
        acceptedFields = [],
        initialFields = {},
        keepExtraFields = true
    ) {
        this.name = this.constructor.name
        this.requiredFields = [...requiredFields]
        this.acceptedFields = [...acceptedFields]
        this.allFields = [...requiredFields, ...acceptedFields]

        Object.keys(initialFields).forEach((key) => {
            const isValidKey = this.isValidField(key)
            if (keepExtraFields || isValidKey) {
                this[key] =
                    typeof initialFields[key] !== 'undefined' && initialFields[key] !== null
                        ? initialFields[key].toString()
                        : ''

                if (!isValidKey) {
                    this.allFields.push(key)
                }
            }
        })
    }

    isValidField(key) {
        return !!this.constructor[key.toUpperCase()]
    }

    isValid(additionalRequiredFields = [], map = {}) {
        const fieldsToCheck = [...this.requiredFields, ...additionalRequiredFields]

        fieldsToCheck.forEach((field) => {
            // You can have empty string as value
            if (
                !(
                    this.hasOwnProperty(field) ||
                    (map[field] && map[field].hasOwnProperty('defaultValue'))
                )
            ) {
                throw new Error(`${this.constructor.name} object must have '${field}' defined`)
            }
        })
    }

    build(map = {}) {
        const constructedObj = {}
        this.allFields.forEach((field) => {
            let fieldKey = field
            if (map[field] && map[field].name) {
                fieldKey = map[field].name
            }

            if (this.hasOwnProperty(field)) {
                constructedObj[fieldKey] = this[field].toString()
            } else if (map[field] && map[field].hasOwnProperty('defaultValue')) {
                constructedObj[fieldKey] = map[field].defaultValue
            }
        })
        return constructedObj
    }

    sanitizeMoney(field) {
        if (this[field]) {
            let value = this[field].match(/[\d,'./]/g)
            if (value) {
                value = value.join('').replace(/[,'.]$/, '') // leave only valid monetary syntaxes and strip trailing syntaxs
                const match = value.match(/(.*?)(([,'./])(\d{1,2}))?$/) // break money string (ie: '10,000' , '.', '99')
                /* istanbul ignore else */
                if (match) {
                    const sanitizedValue = match[1].match(/\d/g) // digits only for first match (ie. '10000')
                    if (sanitizedValue) {
                        this[field] = sanitizedValue.join('')

                        if (match[3] && match[4]) {
                            this[field] += `.${match[4]}` // convert float seprator to period
                        }
                        return
                    }
                }
            }

            this[field] = ''
        }
    }
}
