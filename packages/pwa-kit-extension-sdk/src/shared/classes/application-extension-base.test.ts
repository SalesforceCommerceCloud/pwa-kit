/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApplicationExtension} from './application-extension-base'
import {ApplicationExtensionConfig} from '../../types'

// Define a mock configuration type for testing
interface MockConfig extends ApplicationExtensionConfig {
    enabled?: boolean
}

// Create a concrete subclass of ApplicationExtension for testing purposes
class TestApplicationExtension extends ApplicationExtension<MockConfig> {}

// Jest test suite
describe('ApplicationExtension', () => {
    let config: MockConfig
    let extension: TestApplicationExtension

    beforeEach(() => {
        config = {enabled: true} // Initial mock config
        extension = new TestApplicationExtension(config)
    })

    test('should initialize with the provided config', () => {
        expect(extension.getConfig()).toEqual(config)
    })

    test('should return the correct name of the class', () => {
        expect(extension.getName()).toBe('TestApplicationExtension')
    })

    test('should return true if enabled is true', () => {
        config.enabled = true
        expect(extension.isEnabled()).toBe(true)
    })

    test('should return false if enabled is false', () => {
        config.enabled = false
        expect(extension.isEnabled()).toBe(false)
    })

    test('should return true if enabled is undefined', () => {
        config.enabled = undefined
        expect(extension.isEnabled()).toBe(true)
    })
})
