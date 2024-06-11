/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// const resolve = require('resolve/sync')
// const ResolverUtils = require('../../utils/resolver-utils')
import resolve from 'resolve/sync'
import * as ResolverUtils from '../../utils/resolver-utils'

function transformImport(nodePath, state) {
    // DEV NOTE: The following line might be required in this condition to be conpatible when this plugin is
    // used in conjunction with the webpack plugin.
    // || !nodePath?.node?.source?.value?.includes('customize-app')

    nodePath = nodePath.get('source')

    // Exit early if:
    //
    // 1. We already visited and resolved the node path.
    // 2. We are not resolving a string literal type.
    // 3. We are not resolving a "wildcard" import.
    if (
        state.moduleResolverVisited.has(nodePath) ||
        !state.types.isStringLiteral(nodePath) ||
        !nodePath?.node?.source?.value?.startsWith('*') ||
        nodePath.node.pathResolved
    ) {
        return
    }

    const sourcePath = nodePath.node.value

    // Lets attempt to resolve the wildcard import path.
    const modulePath = resolve(sourcePath, {
        basedir: '/Users/bchypak/Projects/pwa-kit/packages/example-project',
        extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        packageIterator: (request) => ResolverUtils.buildCandidatePathArray({sourcePath: request})
    })

    if (modulePath) {
        nodePath.replaceWith(state.types.stringLiteral(modulePath))
        nodePath.node.pathResolved = true

        // Update processing cache.
        state.moduleResolverVisited.add(nodePath)
    }
}

const importVisitors = {
    'ImportDeclaration|ExportDeclaration': transformImport
}

const visitor = {
    Program: {
        enter(programPath, state) {
            programPath.traverse(importVisitors, state)
        },
        exit(programPath, state) {
            programPath.traverse(importVisitors, state)
        }
    }
}

export default ({types}) => ({
    name: 'module-resolver',

    manipulateOptions(opts) {
        if (opts.filename === undefined) {
            opts.filename = 'unknown'
        }
    },

    pre() {
        this.types = types

        // We need to keep track of all handled nodes so we do not try to transform them twice,
        // because we run before (enter) and after (exit) all nodes are handled
        this.moduleResolverVisited = new Set()
    },

    visitor,

    post() {
        this.moduleResolverVisited.clear()
    }
})
