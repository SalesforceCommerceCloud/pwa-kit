/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import path from 'path'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const EXTENSION_NAMESPACE = '@salesforce'
const EXTENSION_PREFIX = 'extension'
const NODE_MODULES = 'node_modules'

// Returns an extension tupal given a extension reference.
// @private
const parseExtensionRef = (ref) => (Array.isArray(ref) ? ref : [ref, {}])

/**
 * Given an array of PWA-Kit Extension "short names", returns an array of extension module names.
 * @param {} shortNames
 */
export const expand = (extensionRefs = []) => {
    // NOTE: We are going to want to have special consideration for "local" referenced extensions.
    return extensionRefs
        .filter((extensionRef) => Boolean(extensionRef))
        .map((extensionRef) => {
            const [shortName, config] = parseExtensionRef(extensionRef)
            const isLocalExtension = shortName.startsWith('.')

            return [
                isLocalExtension
                    ? shortName
                    : `${EXTENSION_NAMESPACE}/${EXTENSION_PREFIX}-${shortName}`,
                config
            ]
        })
}

/**
 * Based on the current extensibility configuration, return an array of candiate file paths to be used
 * in the wild-card import module resolution.
 */
export const buildCandidatePathArray = (importPath, opts = {}) => {
    const {extensions = getConfig()?.app?.extensions, sourcePath} = opts

    // Replace wildcard character as it has done its job getting us to this point.
    importPath = importPath.replace('*/', '')

    // const isExtension = sourcePath.includes(`${EXTENSION_PREFIX}-`)
    const isSelfReference = sourcePath.includes(importPath)
    const cwd = process.cwd()
    let paths = []

    // TODO: Finalize how this works.
    const sdkComponentPaths = {
        'app/routes': '/src/ssr/universal/components/app/routes'
    }

    // The inital candidate paths include the "base" project, all the extensions, and the PWA-Kit SDK.
    paths = expand(extensions)
        .reverse()
        .map(([extension]) => path.join(cwd, NODE_MODULES, extension, importPath))

    // Add non-extension serach locations locations. The base project and the sdk as the final callback.
    paths = [
        // Base Project
        path.join(cwd, importPath),
        // Extensions
        ...paths,
        // SDK
        path.join(
            cwd,
            NODE_MODULES,
            '@salesforce',
            'pwa-kit-react-sdk',
            sdkComponentPaths[importPath]
        )
    ]

    // Under certain circumstances we want to truncate the cadidate path array to prevent circular dependancies.
    // In particular, we only want to include extensions up to, but not including, the importing extension source if it is
    // a self-named import (e.g. importing routes from an overridden file names routes)
    if (isSelfReference) {
        // Find the index of the extension and chop the list.
        // const currentExtension = sourcePath.match(new RegExp(`${EXTENSION_PREFIX}-([^/]+)`))[1]
        const index = paths.indexOf(sourcePath.split('.')[0])
        // TODO: This logic needs to be hardends up a little.
        paths = paths.slice(index + 1)
    }

    return paths
}
