/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import JsonSchemaValidator from 'ajv'
import schemas from './schemas'
import validators from './validators'

class ConfigError extends Error {
    constructor(message) {
        super(message)
        this.name = 'ConfigError'
    }
}

export default class Config {
    SUPPORTED_VERSIONS = ['1.0.0']

    constructor(data) {
        this._data = data
        const errorMessages = this.validate(this._data)
        if (errorMessages.length) {
            throw new ConfigError(errorMessages.join('. '))
        }
        this.version = this._data.version
    }

    get data() {
        return this._data
    }

    set data(_) {
        throw new ConfigError('Config object is immutable, you must create a new instance')
    }

    validate(data) {
        if (!data.version || !this.SUPPORTED_VERSIONS.includes(data.version)) {
            throw new ConfigError('Unknown config version')
        }
        if (!schemas[data.version]) {
            throw new ConfigError('Missing config schema')
        }

        const schema = schemas[data.version]

        // the Json schema validators handles basic validation:
        // Primitive data type validation (number, boolean, string, etc.)
        // - Required properties
        // - Numerical range
        // - String length, pattern and enum
        // and more... https://json-schema.org/draft/2020-12/json-schema-validation.html
        const validator = new JsonSchemaValidator({allErrors: true}).compile(schema)
        validator(this._data)
        const errorMessages = validator.errors
            ? validator.errors.map(
                  (e) => `${this.beautifyJsonSchemaValidatorKeyPath(e.instancePath)}: ${e.message}`
              )
            : []

        // the custom validators handles advanced/complex validation
        // use cases which require JavaScript logic to validate
        const customValidators = validators[data.version]
        Object.keys(customValidators).forEach((validatorPath) => {
            const customValidator = customValidators[validatorPath]
            try {
                customValidator(data)
            } catch (e) {
                errorMessages.push(`${validatorPath}: ${e.message}`)
            }
        })
        return errorMessages
    }

    beautifyJsonSchemaValidatorKeyPath(path) {
        // Ajv json schema validators represent nested object keys
        // like this: /server/mobify/ssrParameters/proxyConfigs/
        // The slashes are confusing, we'd like to convert the format
        // to be like: server.mobify.ssrParameters.proxyConfigs
        return path
            .split('/')
            .filter(Boolean)
            .join('.')
    }
}
