/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import OverrideStatsPlugin from './override-stats-plugin' // Adjust the path to where OverrideStatsPlugin is located

describe('OverrideStatsPlugin', () => {
    let mockCompiler
    let mockCompilation
    let compilationCallback
    let processAssetsCallback
    let originalRecordOverrides

    /**
     * Set up the mock compiler and compilation objects before each test,
     * and save the original value of RECORD_OVERRIDES.
     */
    beforeEach(() => {
        originalRecordOverrides = process.env.RECORD_OVERRIDES

        mockCompilation = {
            hooks: {
                processAssets: {
                    tap: jest.fn((options, callback) => {
                        processAssetsCallback = callback
                    })
                }
            },
            emitAsset: jest.fn(),
            overrideStats: undefined
        }

        mockCompiler = {
            hooks: {
                compilation: {
                    tap: jest.fn((name, callback) => {
                        compilationCallback = callback
                    })
                }
            }
        }
    })

    afterEach(() => {
        if (originalRecordOverrides === undefined) {
            delete process.env.RECORD_OVERRIDES
        } else {
            process.env.RECORD_OVERRIDES = originalRecordOverrides
        }
    })

    test('initializes overrideStats on compilation', () => {
        const plugin = new OverrideStatsPlugin()
        plugin.apply(mockCompiler)

        // Simulate the compilation hook being triggered
        compilationCallback(mockCompilation)

        expect(mockCompilation.overrideStats).toEqual([])
    })

    test('generates overrides-stats.json when RECORD_OVERRIDES is true', () => {
        process.env.RECORD_OVERRIDES = 'true'

        const plugin = new OverrideStatsPlugin()
        plugin.apply(mockCompiler)

        // Simulate the compilation hook
        compilationCallback(mockCompilation)

        // Add dummy data to overrideStats
        mockCompilation.overrideStats = [
            {original: 'foo', resolved: 'bar', sourceExtension: 'js'},
            {original: 'baz', resolved: 'qux', sourceExtension: 'ts'}
        ]

        // Simulate the processAssets hook
        processAssetsCallback()

        // Check that emitAsset was called with the expected arguments
        expect(mockCompilation.emitAsset).toHaveBeenCalledWith(
            'overrides-stats.json',
            expect.objectContaining({
                source: expect.any(Function)
            })
        )

        // Verify the content of the emitted asset
        const emittedAsset = mockCompilation.emitAsset.mock.calls[0][1]
        const content = emittedAsset.source()
        expect(content).toEqual(JSON.stringify(mockCompilation.overrideStats, null, 2))
        const parsedContent = JSON.parse(content)
        expect(parsedContent).toEqual(mockCompilation.overrideStats)
    })

    test('does not generate overrides-stats.json when RECORD_OVERRIDES is not true', () => {
        delete process.env.RECORD_OVERRIDES // Ensure RECORD_OVERRIDES is not set

        const plugin = new OverrideStatsPlugin()
        plugin.apply(mockCompiler)

        // Simulate the compilation hook
        compilationCallback(mockCompilation)

        // Add dummy data to overrideStats
        mockCompilation.overrideStats = [{original: 'foo', resolved: 'bar', sourceExtension: 'js'}]

        // Simulate the processAssets hook
        processAssetsCallback()

        // Check that emitAsset was not called
        expect(mockCompilation.emitAsset).not.toHaveBeenCalled()
    })

    test('generates overrides-stats.json with empty array when overrideStats is empty', () => {
        process.env.RECORD_OVERRIDES = 'true'

        const plugin = new OverrideStatsPlugin()
        plugin.apply(mockCompiler)

        // Simulate the compilation hook
        compilationCallback(mockCompilation)

        // Set overrideStats to an empty array
        mockCompilation.overrideStats = []

        // Simulate the processAssets hook
        processAssetsCallback()

        // Check that emitAsset was called with the expected arguments
        expect(mockCompilation.emitAsset).toHaveBeenCalledWith(
            'overrides-stats.json',
            expect.objectContaining({
                source: expect.any(Function)
            })
        )

        // Verify the content of the emitted asset
        const emittedAsset = mockCompilation.emitAsset.mock.calls[0][1]
        const content = emittedAsset.source()
        expect(content).toEqual(JSON.stringify([], null, 2))
        const parsedContent = JSON.parse(content)
        expect(parsedContent).toEqual([])
    })
})
