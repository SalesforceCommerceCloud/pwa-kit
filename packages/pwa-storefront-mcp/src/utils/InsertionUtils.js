/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
export class InsertionUtils {
    generateImports(dependencies, analysis) {
        const imports = []

        if (dependencies.includes('react') && !analysis.hasReact) {
            imports.push("import React, { useEffect } from 'react';")
        } else if (
            dependencies.includes('useEffect') &&
            !analysis.imports.some((imp) => imp.content.includes('useEffect'))
        ) {
            // Need to update existing React import to include useEffect
            imports.push('// Update React import to include useEffect')
        }

        return imports.join('\n')
    }

    filterNewImports(imports) {
        // Filter out imports that already exist
        return imports
    }
}
