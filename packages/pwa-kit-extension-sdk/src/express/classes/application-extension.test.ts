/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Application} from 'express'
import {ApplicationExtension} from './application-extension'
import {ApplicationExtensionConfig} from '../../types'

interface MockConfig extends ApplicationExtensionConfig {
    enabled?: boolean
}

// Create a concrete subclass for testing purposes
class TestApplicationExtension extends ApplicationExtension<MockConfig> {}

// Jest test suite
describe('ApplicationExtension', () => {
    let config: MockConfig
    let app: Application
    let extension: TestApplicationExtension

    beforeEach(() => {
        config = {enabled: true} // Mock config
        app = {} as Application // Mock express application
        extension = new TestApplicationExtension(config)
    })

    test('should return the config used to instantiate the extension', () => {
        expect(extension.getConfig()).toEqual(config)
    })

    test('should return the correct name of the extension class', () => {
        expect(extension.getName()).toBe('TestApplicationExtension')
    })

    test('should return true when config enabled is true', () => {
        expect(extension.isEnabled()).toBe(true)
    })

    test('should return false when config enabled is false', () => {
        extension = new TestApplicationExtension({enabled: false})
        expect(extension.isEnabled()).toBe(false)
    })

    test('should return true when config enabled is undefined', () => {
        extension = new TestApplicationExtension({})
        expect(extension.isEnabled()).toBe(true)
    })

    test('should return the same Application instance from extendApp', () => {
        const extendedApp = extension.extendApp(app)
        expect(extendedApp).toBe(app)
    })
})
