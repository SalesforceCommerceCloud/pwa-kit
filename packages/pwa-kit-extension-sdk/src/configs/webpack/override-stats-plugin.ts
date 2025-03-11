/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Compiler, Compilation, sources} from 'webpack'

/**
 * Interface for override stats entry
 */
export interface OverrideStatsEntry {
    original: string
    resolved: string
    sourceExtension: string
}

/**
 * Webpack plugin to collect override stats during compilation and write them to a JSON file
 * when the RECORD_OVERRIDES environment variable is set to 'true'.
 */
export class OverrideStatsPlugin {
    /**
     * Apply the plugin to the webpack compiler
     * @param compiler - The webpack compiler instance
     */
    apply(compiler: Compiler): void {
        // Initialize the overrideStats array on the compilation object
        compiler.hooks.compilation.tap(
            'OverrideStatsPlugin',
            (compilation: Compilation & {overrideStats?: OverrideStatsEntry[]}) => {
                compilation.overrideStats = []

                compilation.hooks.processAssets.tap(
                    {
                        name: 'OverrideStatsPlugin',
                        stage: Compilation.PROCESS_ASSETS_STAGE_REPORT
                    },
                    () => {
                        const {RECORD_OVERRIDES} = process.env
                        const {overrideStats} = compilation

                        // Only generate the stats file if RECORD_OVERRIDES is set to 'true'
                        if (RECORD_OVERRIDES === 'true' && Array.isArray(overrideStats)) {
                            const content = JSON.stringify(overrideStats, null, 2)

                            // Add the stats file as a compilation asset using webpack's RawSource
                            compilation.emitAsset(
                                'overrides-stats.json',
                                new sources.RawSource(content)
                            )
                        }
                    }
                )
            }
        )
    }
}

export default OverrideStatsPlugin
