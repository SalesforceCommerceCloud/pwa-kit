/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {LoaderContext} from 'webpack'
import fse from 'fs-extra'
import os from 'os'
import path from 'path'
import resolve from 'resolve'

// Local Imports
import {buildCandidatePaths, getPackageName, SETUP_FILE_REGEX} from '../../shared/utils'

// Types
import type {ExtendedCompiler} from './types'

// Constants
const EXTENSION_PACKAGE_PREFIX = 'extension-'
const EXTENSION_PACKAGE_NAMESPACE = '@salesforce'
const IMPORT_REGEX = /import\s+(?:(?:[\w*\s{},]*)\s+from\s+)?['"](\..*?)['"]/g
const OVERRIDABLE_FILE_NAME = '.force_overrides'
const MONO_REPO_WORKSPACE_FOLDER = 'packages'
const NODE_MODULES_FOLDER = 'node_modules'
const REQUIRES_REGEX = /require\(['"](\..*?)['"]\)/g
const SRC = 'src'

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

    const compiler = _compiler as ExtendedCompiler
    const projectRelPath = resourcePath.split(`${SRC}${path.sep}`)[1].split('.')[0] // File path relative to the project directory without file extension
    const projectPath = resourcePath.split(SRC)[0]
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
    const compilerOptions = this._compiler?.options
    const extensions = compilerOptions?.resolve?.extensions || []
    const basedir = options?.baseDir || process.cwd()
    const applicationExtensions = compiler?.custom?.extensions || []

    // Get the master list of all possible candidate paths based on your current extension configuration.
    const paths = buildCandidatePaths(projectRelPath, packageName, {
        canonicalSource: resourcePath,
        projectDir: basedir,
        extensionEntries: applicationExtensions
    })

    // Also include the base override path and the path from the extension doing the import.
    const resolvedResourcePath = resolve.sync(projectRelPath, {
        basedir,
        extensions,
        packageIterator: () => paths,
        ...options?.resolveOptions
    })

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
    const isExtensionFile = source.includes(`${path.sep}${EXTENSION_PACKAGE_PREFIX}`)
    const isSetupFile = SETUP_FILE_REGEX.test(source)
    const targetCache = OVERRIDABLE_CACHE[target as keyof typeof OVERRIDABLE_CACHE]

    // Exit early if we have:
    // 1. Processed this file already.
    // 2. The file is not an extension file.
    // 3. The file is an extension setup file.
    if (targetCache.includes(source) || !isExtensionFile || isSetupFile) {
        return false
    }

    // Because our webpack configuration is setup to resolve symlinks, we need to normalize the source path because
    // the source path passed to the loaded is not representative of what you would see in a generated project (e.g.
    // it doesn't resolve to being in the node_modules folder).
    let normalizedSource = ''

    // We are only concerned with the source path relative to the extension package namespace.
    normalizedSource = `${
        source
            .split(
                `${path.sep}${isMonoRepo ? MONO_REPO_WORKSPACE_FOLDER : NODE_MODULES_FOLDER}${
                    path.sep
                }`
            )
            .pop() ?? ''
    }`

    // At this point the path is either POSIX or windows, we need to normalize it to POSIX.
    normalizedSource = normalizedSource.replace(/\\/g, '/')

    // NOTE:
    // For now we are going to make the assumption that all the extension projects in our mono repo
    // are part of the `@salesforce` namespace, this is pretty safe. So we are going to add the namespace.
    normalizedSource = `./${NODE_MODULES_FOLDER}/${
        isMonoRepo ? EXTENSION_PACKAGE_NAMESPACE + path.posix.sep : ''
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
 * @param {Object} [options={}] - Options to customize the Webpack rule.
 * @param {string} [options.projectDir] - Loader-specific options.
 * @param {string} [options.target=DEFAULT_TARGET] - The target environment, either 'node' or 'web'.
 * @param {boolean} [options.isMonoRepo] - Changes the source path normalization based on if the project is run in a mono-repo.
 *
 * @returns {Object} A Webpack rule configuration object for handling application extensions.
 */
export const ruleForOverrideResolver = (options: any = {}) => {
    const {projectDir, target, isMonoRepo} = options
    let overridables: string[] = []

    try {
        overridables = fse
            .readFileSync(path.join(projectDir, OVERRIDABLE_FILE_NAME), 'utf8')
            .split(/\r?\n/)
            .filter((line) => !line.startsWith('//'))
    } catch (e) {
        // If where is no .force_overrides file, we can safely return null.
        return null
    }

    return {
        test: (source: string) => {
            return validateOverrideSource(source, {
                isMonoRepo,
                target,
                overridables
            })
        },
        use: {
            loader: '@salesforce/pwa-kit-extension-sdk/configs/webpack/overrides-resolver-loader'
        }
    }
}

// Export the loader as the default export with proper typing
export default OverrideResolverLoader
