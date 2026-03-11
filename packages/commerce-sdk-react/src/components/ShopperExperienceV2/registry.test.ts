/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createReactComponentRegistry, registry} from './registry'

describe('registry', () => {
    describe('createReactComponentRegistry', () => {
        test('creates a new ComponentRegistry', () => {
            const newRegistry = createReactComponentRegistry()

            expect(newRegistry).toBeDefined()
            // Cast to access internal methods for testing
            const registryInstance = newRegistry as unknown as Record<string, unknown>
            expect(typeof registryInstance.registerComponent).toBe('function')
            expect(typeof registryInstance.registerImporter).toBe('function')
            expect(typeof registryInstance.getComponent).toBe('function')
            expect(typeof registryInstance.getFallback).toBe('function')
            expect(typeof registryInstance.preload).toBe('function')
        })

        test('creates typed registry', () => {
            interface CustomProps {
                title: string
                count: number
            }

            const typedRegistry = createReactComponentRegistry<CustomProps>()

            expect(typedRegistry).toBeDefined()
        })
    })

    describe('registry singleton', () => {
        test('registry is defined', () => {
            expect(registry).toBeDefined()
        })

        test('registry has expected methods', () => {
            // Cast to access internal methods for testing
            const registryInstance = registry as unknown as Record<string, unknown>
            expect(typeof registryInstance.registerComponent).toBe('function')
            expect(typeof registryInstance.registerImporter).toBe('function')
            expect(typeof registryInstance.getComponent).toBe('function')
            expect(typeof registryInstance.getFallback).toBe('function')
            expect(typeof registryInstance.preload).toBe('function')
        })
    })
})
