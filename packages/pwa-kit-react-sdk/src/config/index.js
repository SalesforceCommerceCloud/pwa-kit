/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import JsonSchemaValidator from 'ajv'
import schema from './schema.json'

export class ConfigError extends Error {
    constructor(message) {
        super(message)
        this.name = 'ConfigError'
    }
}

export default class Config {
    /**
     * Instantiate a Config instance.
     * @param {object} data config value
     * @param {object} customProperties custom property schema map
     */
    constructor(data, customProperties = {}) {
        this.data = data
        this.schema = Object.assign({}, schema)

        // Insert custom properties into the schema.
        // This only works with top level properties!
        Object.keys(customProperties).forEach((property) => {
            this.schema.properties[property] = customProperties[property]
        })

        this.validator = new JsonSchemaValidator({allErrors: true}).compile(this.schema)
    }

    /**
     * Validate config value based on the JSON Schema.
     * This function throws a ConfigError when the value
     * is invalid, otherwise return true.
     */
    validate() {
        // the Json schema validators handles basic validation:
        // Primitive data type validation (number, boolean, string, etc.)
        // - Required properties
        // - Numerical range
        // - String length, pattern and enum
        // and more... https://json-schema.org/draft/2020-12/json-schema-validation.html
        this.validator(this.data)

        const errorMessages = this.validator.errors
            ? this.validator.errors.map(
                  (e) =>
                      `${this._beautifyPropertyPath(e.instancePath) ||
                          this._beautifyPropertyPath(e.dataPath, '.')} - ${e.message}`
              )
            : []

        if (errorMessages.length) {
            throw new ConfigError(errorMessages.join('. '))
        }
        return true
    }

    /**
     * Ajv json schema validators represent nested object keys
     * like this: /server/mobify/ssrParameters/proxyConfigs/
     * The slashes are confusing, we'd like to convert the format
     * to be like: server.mobify.ssrParameters.proxyConfigs
     */
    _beautifyPropertyPath(path, delimiter) {
        return (path || '')
            .split(delimiter || '/')
            .filter(Boolean)
            .join('.')
    }
}
