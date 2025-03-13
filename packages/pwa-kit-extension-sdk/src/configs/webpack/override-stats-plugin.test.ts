/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {runWebpackCompiler} from './test-utils'
import OverrideStatsPlugin, {OverrideStatsEntry} from './override-stats-plugin'
import {Compiler, Compilation} from 'webpack'

// Custom plugin to set overrideStats during compilation
class SetOverrideStatsPlugin {
    constructor(private overrideStats: OverrideStatsEntry[]) {}

    apply(compiler: Compiler) {
        compiler.hooks.compilation.tap('SetOverrideStatsPlugin', (compilation: Compilation) => {
            compilation.hooks.processAssets.tap(
                {
                    name: 'SetOverrideStats',
                    stage: Compilation.PROCESS_ASSETS_STAGE_ANALYSE
                },
                () => {
                    ;(compilation as any).overrideStats = this.overrideStats
                }
            )
        })
    }
}

describe('OverrideStatsPlugin', () => {
    let originalRecordOverrides: string | undefined

    // Preserve the original RECORD_OVERRIDES value and reset it after each test
    beforeEach(() => {
        originalRecordOverrides = process.env.RECORD_OVERRIDES
    })

    afterEach(() => {
        if (originalRecordOverrides === undefined) {
            delete process.env.RECORD_OVERRIDES
        } else {
            process.env.RECORD_OVERRIDES = originalRecordOverrides
        }
    })

    const testCases: Array<
        [
            string,
            {
                recordOverrides: string
                overrideStats: OverrideStatsEntry[]
                expects: (output: any, fileSystem: any) => void
            }
        ]
    > = [
        [
            'generates overrides-stats.json when RECORD_OVERRIDES is true',
            {
                recordOverrides: 'true',
                overrideStats: [
                    {original: 'path1', resolved: 'path1', sourceExtension: 'extension1'},
                    {original: 'path2', resolved: 'path2', sourceExtension: 'extension2'}
                ],
                expects: (output: any, fileSystem: any) => {
                    const statsFile = output.stats.assets.find(
                        (asset: any) => asset.name === 'overrides-stats.json'
                    )
                    expect(statsFile).toBeDefined()
                    const content = JSON.parse(
                        fileSystem.readFileSync('/dist/overrides-stats.json', 'utf8')
                    )
                    expect(content).toEqual([
                        {original: 'path1', resolved: 'path1', sourceExtension: 'extension1'},
                        {original: 'path2', resolved: 'path2', sourceExtension: 'extension2'}
                    ])
                }
            }
        ],
        [
            'does not generate overrides-stats.json when RECORD_OVERRIDES is not true',
            {
                recordOverrides: 'false',
                overrideStats: [
                    {original: 'path1', resolved: 'path1', sourceExtension: 'extension1'}
                ],
                expects: (output: any) => {
                    const statsFile = output.stats.assets.find(
                        (asset: any) => asset.name === 'overrides-stats.json'
                    )
                    expect(statsFile).toBeUndefined()
                }
            }
        ],
        [
            'generates overrides-stats.json with empty array when overrideStats is empty',
            {
                recordOverrides: 'true',
                overrideStats: [],
                expects: (output: any, fileSystem: any) => {
                    const statsFile = output.stats.assets.find(
                        (asset: any) => asset.name === 'overrides-stats.json'
                    )
                    expect(statsFile).toBeDefined()
                    const content = JSON.parse(
                        fileSystem.readFileSync('/dist/overrides-stats.json', 'utf8')
                    )
                    expect(content).toEqual([])
                }
            }
        ]
    ]

    test.each(testCases)('%s', async (_desc, {recordOverrides, overrideStats, expects}) => {
        process.env.RECORD_OVERRIDES = recordOverrides

        const entryPoint = '/app/index.js'
        const files = {
            '/app/index.js': 'console.log("Hello, world!")'
        }

        let fileSystem: any
        const stats = await runWebpackCompiler(entryPoint, {
            files,
            buildPlugins: ({fileSystem: fs}) => {
                fileSystem = fs
                return [new OverrideStatsPlugin(), new SetOverrideStatsPlugin(overrideStats)]
            },
            buildLoaders: () => []
        })

        const output = {
            stats: stats.toJson({source: true, assets: true})
        }

        expects(output, fileSystem)
    })
})
