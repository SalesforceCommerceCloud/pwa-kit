/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {LoaderContext} from 'webpack'

import os from 'os'
import path from 'path'
import resolve from 'resolve'

// Local Imports
import {getForceOverridesFilePaths, getOverridesFromFile} from '../utils'
import {
    SETUP_FILE_REGEX,
    buildCandidatePaths,
    getPackageName,
    isExtensionPackage
} from '../../shared/utils'

// Types
import type {ExtendedCompiler, OverridesResolverRuleOptions} from './types'
import type {OverrideStatsEntry} from './override-stats-plugin'

// Constants
import {
    EXTENSION_PACKAGE_NAMESPACE,
    IMPORT_REGEX,
    MONO_REPO_WORKSPACE_FOLDER,
    NODE_MODULES_FOLDER,
    REQUIRES_REGEX,
    SRC_FOLDER
} from '../constants'

// Cache for processed overrides
const OVERRIDABLE_CACHE = {
    node: [] as string[],
    web: [] as string[]
}

// Export the cache for testing purposes
export const __OVERRIDABLE_CACHE__ = OVERRIDABLE_CACHE

/**
 * Webpack loader to override the resolution of a module based on the PWA-Kit applications
 * extension configuration.
 *
 * This loader resolves a new resource path by evaluating possible overrides in other
 * extensions, transpiling the file with the same loaders/plugins as the original file.
 *
 * @param {LoaderContext<any>} this - The Webpack loader context, which provides information
 * about the module being processed and the current Webpack compiler.
 */
const OverrideResolverLoader = function (this: LoaderContext<any>) {
    // Get the import path relative to the project base directory.
    // NOTE: We intensionally exclude any path prefixes like "/" or "./" so that we can
    // use `packageIterator` in the "resolve" function used later on.
    const {resourcePath, _compiler} = this

    // TECH DEBT: Accessing `_compiler` is a bit of a hack, but it works. We should look to work around this.
    const compiler = _compiler as ExtendedCompiler
    const projectRelPath = resourcePath.split(`${SRC_FOLDER}${path.sep}`)[1].split('.')[0] // File path relative to the project directory without file extension
    const projectPath = resourcePath.split(SRC_FOLDER)[0]
    const options = this.getOptions()

    // Get the package name
    // NOTE: There is an opportunity to make this more performant as most of the time the file path will have
    // the package name in it because it's in the node_modules folder and we can parse it out. But there are times,
    // like when you use a mono-repo or local npm packages that you can't do this. So as a fallback you have to process
    // the packageJSON file.
    const packageName = getPackageName(projectPath, {filesystem: options.resolveOptions})

    if (!packageName) {
        console.warn('OVERRIDES-LOADER: Unable to determine import package name. Bailing...')
        return resourcePath
    }

    // Lets use the compiler configuration to ensure we are resolving the correct file extensions.
    const fileExtensions = options?.resolveExtensions || compiler.options?.resolve?.extensions || []
    const basedir = options?.baseDir || process.cwd()
    const applicationExtensions = options?.extensions || compiler?.custom?.extensions || []

    // Get the master list of all possible candidate paths based on your current extension configuration.
    const paths = buildCandidatePaths(projectRelPath, packageName, {
        canonicalSource: resourcePath,
        projectDir: basedir,
        extensionEntries: applicationExtensions
    })

    // Also include the base override path and the path from the extension doing the import.
    const resolvedResourcePath = resolve.sync(projectRelPath, {
        basedir,
        extensions: fileExtensions,
        packageIterator: () => paths,
        ...options?.resolveOptions
    })

    // Record override stats if RECORD_OVERRIDES is enabled
    if (this._compilation && 'overrideStats' in this._compilation) {
        const compilation = this._compilation as {overrideStats: OverrideStatsEntry[]}

        // Add the override information to the stats
        compilation.overrideStats.push({
            original: resourcePath,
            resolved: resolvedResourcePath,
            sourceExtension: packageName
        })
    }

    // Tell Webpack to treat this new resource as a dependency of the original module in order to have the dependency
    // transpiled with all the same loaders/plugins that the original file was.
    this.addDependency(resolvedResourcePath)

    // Use Webpack's `loadModule` function to load, process, and transpile the alternative module
    const callback = this.async()

    // Adjust the `basedir` dynamically for resolving relative imports in the new file
    const newBasedir = path.dirname(resolvedResourcePath)

    const convertRelativePaths = (match: string, relativePath: string) => {
        let absolutePath = path.resolve(newBasedir, relativePath)

        if (os.platform() === 'win32') {
            absolutePath = absolutePath.replace(/\\/g, '\\\\')
        }

        return match.replace(relativePath, absolutePath)
    }

    // Load the replacement module adding a `noHMR=true` query so we can prevent the HMR plugin from trying
    // to define its globals again.
    this.loadModule(`${resolvedResourcePath}?noHMR=true`, (err, newSource) => {
        if (err) return callback(err)

        // NOTE: Convert all relative path imports to absolute path imports. This solves the problem of the wrong
        // basedir being used when imports are resolved by webpack.
        const adjustedSource = newSource
            ?.toString()
            .replace(IMPORT_REGEX, convertRelativePaths) // Update relative imports
            .replace(REQUIRES_REGEX, convertRelativePaths) // Update relative requires

        // Return the loaded and transpiled content of the alternative module.
        // NOTE: The third argument to the `callback` function is `sourceMap`. The fact that we aren't using
        // that argument might be a point of debugging limitations in the future. Leaving this note here to tell
        // future dev's this might be a place that needs to be adjusted.
        callback(null, adjustedSource)
    })
}

/**
 * Extracts the absolute path to an extension package root from a source file path.
 *
 * @param source - The source file path to analyze
 * @returns The absolute path to an extension package root if found, undefined otherwise
 */
const getExtensionPath = (source: string): string | undefined => {
    const isMonoRepoPath = source.includes(`${path.sep}${MONO_REPO_WORKSPACE_FOLDER}${path.sep}`)
    const isNodeModulesPath = source.includes(`${path.sep}${NODE_MODULES_FOLDER}${path.sep}`)

    if (!isMonoRepoPath && !isNodeModulesPath) {
        return undefined
    }

    const folderType = isMonoRepoPath ? MONO_REPO_WORKSPACE_FOLDER : NODE_MODULES_FOLDER
    const containerFolder = `${path.sep}${folderType}${path.sep}`
    const [basePath, relativeExtensionPath] = source.split(containerFolder)

    if (folderType === NODE_MODULES_FOLDER && relativeExtensionPath.startsWith('@')) {
        const packageParts = relativeExtensionPath.split(path.sep)
        return `${basePath}${containerFolder}${packageParts[0]}${path.sep}${packageParts[1]}`
    }

    return `${basePath}${containerFolder}${relativeExtensionPath.split(path.sep)[0]}`
}

/**
 * Return a boolean indicating if the source file should be processed by the override loader based on
 * various conditions including the cache state, the source file type, and the presence of an override file
 * in the provided overridables list.
 *
 * @param source
 * @param options
 * @param {string} [options.projectDir] - Loader-specific options.
 * @param {string} [options.target=DEFAULT_TARGET] - The target environment, either 'node' or 'web'.
 * @param {boolean} [options.isMonoRepo] - Changes the source path normalization based on if the project is run in a mono-repo.
 * @returns {boolean} - A boolean indicating if the source file should be processed by the override loader.
 */
export const validateOverrideSource = (source: string, options: any = {}) => {
    const {isMonoRepo = false, target = 'node', overridables = []} = options
    const isSetupFile = SETUP_FILE_REGEX.test(source)
    const targetCache = OVERRIDABLE_CACHE[target as keyof typeof OVERRIDABLE_CACHE]

    // Exit early if we have:
    // 1. Processed this file already.
    // 2. The file is an extension setup file.
    if (targetCache.includes(source) || isSetupFile) {
        return false
    }

    const extensionPath = getExtensionPath(source)
    const isExtensionFile = extensionPath ? isExtensionPackage(extensionPath) : false

    // Exit if the source path doesn't belong to an extension package
    if (!isExtensionFile) {
        return false
    }

    // Normalize the source path
    // We are only concerned with the source path relative to the extension package namespace
    const packagePath =
        source
            .split(
                `${path.sep}${isMonoRepo ? MONO_REPO_WORKSPACE_FOLDER : NODE_MODULES_FOLDER}${
                    path.sep
                }`
            )
            .pop() ?? ''

    // At this point the path is either POSIX or windows, we need to normalize it to POSIX.
    let normalizedSource = path.posix.normalize(packagePath.replace(/\\/g, '/'))

    // Add appropriate prefixes for mono-repo packages in the @salesforce namespace.
    normalizedSource = `./${NODE_MODULES_FOLDER}/${
        isMonoRepo ? `${EXTENSION_PACKAGE_NAMESPACE}${path.posix.sep}` : ''
    }${normalizedSource}`

    // Check if the normalized source is in the list of overridables.
    const hasOverride = overridables.includes(normalizedSource)

    // If we have an override, add it to the cache so we don't process it again.
    if (hasOverride) {
        targetCache.push(source)
    }

    return hasOverride
}

/**
 * Generates a Webpack rule for application extensibility, configuring the loader for
 * handling application extensions based on the target (e.g., 'node' for server-side,
 * 'web' for client-side). Specifically this enables the ability to override the resolution
 * via the `.force_overrides` file.
 *
 * @param {RuleOptions} options - Options to customize the Webpack rule.
 * @returns {Object} A Webpack rule configuration object for handling application extensions.
 */
export const ruleForOverrideResolver = (options: OverridesResolverRuleOptions): object => {
    const {
        extensions = [],
        projectDir,
        resolveExtensions = [],
        target = 'web',
        isMonoRepo = false
    } = options
    const overridablesSet = new Set<string>()

    // Determine possible locations for the .force_overrides files in the project. Please note that
    // and extension can't exists as a node_module and a local package, but for simplicity sake we'll use for
    // for candidate locations prioritizing the local package.
    const forceOverridesFilePaths: string[] = getForceOverridesFilePaths(projectDir, extensions)

    // Create a "master" list of all the overrides in the project.
    // NOTE: That files defined in an extensions .force_overrides file will technically leak outside ot its scope
    // allowing other extensions to now override those extensions as well. This isn't ideal, but fo this initial version
    // we can go with it.
    for (const filePath of forceOverridesFilePaths) {
        const overrides = getOverridesFromFile(filePath)
        overrides.forEach((entry) => overridablesSet.add(entry))
    }

    return {
        test: (source: string) => {
            return validateOverrideSource(source, {
                isMonoRepo,
                target,
                overridables: Array.from(overridablesSet)
            })
        },
        use: {
            loader: '@salesforce/pwa-kit-extension-sdk/configs/webpack/overrides-resolver-loader',
            options: {
                extensions,
                resolveExtensions
            }
        }
    }
}

// Export the loader as the default export with proper typing
export default OverrideResolverLoader
