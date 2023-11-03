/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os'
import path from 'path'
import archiver, {EntryData} from 'archiver'
import {default as _fetch, Response} from 'node-fetch'
import {URL} from 'url'
import {
    createWriteStream,
    existsSync,
    readFile,
    readJson,
    stat,
    mkdtemp,
    rm,
    readdir,
    Stats,
    Dirent
} from 'fs-extra'
import {Minimatch} from 'minimatch'
import git from 'git-rev-sync'
import validator from 'validator'
import {execSync} from 'child_process'
import semver from 'semver'

export const DEFAULT_CLOUD_ORIGIN = 'https://cloud.mobify.com'
export const DEFAULT_DOCS_URL =
    'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html'

interface Credentials {
    username: string
    api_key: string
}

interface CloudAPIClientOpts {
    credentials: Credentials
    origin?: string
    // _fetch is a function and a namespace, we want to use the function here
    fetch?: typeof _fetch
}

interface StringMap {
    [key: string]: string
}

interface Bundle {
    message: string
    encoding: string
    data: string
    ssr_parameters: object
    ssr_only: string[]
    ssr_shared: string[]
}

interface Pkg {
    name: string
    version: string
    ccExtensibility?: {extends: string; overridesDir: string}
    dependencies?: {[key: string]: string}
    devDependencies?: {[key: string]: string}
}

/**
 * Get the package info for pwa-kit-dev.
 */
export const getPkgJSON = async (): Promise<Pkg> => {
    const candidates = [
        path.join(__dirname, '..', 'package.json'),
        path.join(__dirname, '..', '..', 'package.json')
    ]
    for (const candidate of candidates) {
        try {
            const data = await readJson(candidate)
            return data as Pkg
        } catch {
            // Keep looking
        }
    }
    return {name: '@salesforce/pwa-kit-dev', version: 'unknown'}
}

/**
 * Get the package info for the current project.
 */
export const getProjectPkg = async (): Promise<Pkg> => {
    const p = path.join(process.cwd(), 'package.json')
    try {
        const data = await readJson(p)
        return data as Pkg
    } catch {
        throw new Error(`Could not read project package at "${p}"`)
    }
}

/**
 * Get the set of file paths within a specific directory
 * @param dir Directory to walk
 * @returns Set of file paths within the directory
 */
export const walkDir = async (
    dir: string,
    baseDir: string,
    fileSet?: Set<string>
): Promise<Set<string>> => {
    fileSet = fileSet || new Set<string>()
    const entries: Dirent[] = await readdir(dir, {withFileTypes: true})

    await Promise.all(
        entries.map(async (entry) => {
            const entryPath = path.join(dir, entry.name)
            if (entry.isDirectory()) {
                await walkDir(entryPath, baseDir, fileSet)
            } else {
                fileSet?.add(entryPath.replace(baseDir + path.sep, ''))
            }
        })
    )

    return fileSet
}

interface DependencyTree {
    version: string
    name?: string
    dependencies?: Record<string, DependencyTree>
    resolved?: string
    overridden?: boolean
}

/**
 * Returns a DependencyTree that includes the versions of all packages
 * including their dependencies within the project.
 *
 * @returns A DependencyTree with the versions of all dependencies
 */
export const getProjectDependencyTree = async (): Promise<DependencyTree | null> => {
    // When executing this inside template-retail-react-app, the output of `npm ls` exceeds the
    // max buffer size that child_process can handle, so we can't use that directly. The max string
    // size is much larger, so writing/reading a temp file is a functional workaround.
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'pwa-kit-dev-'))
    const destination = path.join(tmpDir, 'npm-ls.json')
    try {
        execSync(`npm ls --all --json > ${destination}`)
        return await readJson(destination, 'utf8')
    } catch (_) {
        // Don't prevent bundles from being pushed if this step fails
        return null
    } finally {
        // Remove temp file asynchronously after returning; ignore failures
        void rm(destination).catch(() => {})
    }
}

/**
 * Returns the lowest version of a package installed.
 *
 * @param packageName - The name of the package to get the lowest version for
 * @param dependencyTree - The dependency tree including all package versions
 * @returns The lowest version of the given package that is installed
 */
export const getLowestPackageVersion = (
    packageName: string,
    dependencyTree: DependencyTree
): string => {
    let lowestVersion: string | null = null

    function search(tree: DependencyTree) {
        for (const key in tree.dependencies) {
            const dependency = tree.dependencies[key]
            if (key === packageName) {
                const version = dependency.version
                if (!lowestVersion || semver.lt(version, lowestVersion)) {
                    lowestVersion = version
                }
            }

            if (dependency.dependencies) {
                search(dependency)
            }
        }
    }

    search(dependencyTree)
    return lowestVersion ?? 'unknown'
}

/**
 * Returns the versions of all PWA Kit dependencies of a project.
 * This will search the dependency tree for the lowest version of each PWA Kit package.
 *
 * @param dependencyTree - The dependency tree including all package versions
 * @returns The versions of all dependencies of the project.
 */
export const getPwaKitDependencies = (dependencyTree: DependencyTree): {[key: string]: string} => {
    const pwaKitDependencies = [
        '@salesforce/pwa-kit-react-sdk',
        '@salesforce/pwa-kit-runtime',
        '@salesforce/pwa-kit-dev'
    ]

    // pwa-kit package versions are not always listed as direct dependencies
    // in the package.json such as when a bundle is using template extensibility
    const nestedPwaKitDependencies: {[key: string]: string} = {}
    pwaKitDependencies.forEach((packageName) => {
        nestedPwaKitDependencies[packageName] = getLowestPackageVersion(packageName, dependencyTree)
    })

    return nestedPwaKitDependencies
}

export class CloudAPIClient {
    private opts: Required<CloudAPIClientOpts>

    constructor(params: CloudAPIClientOpts) {
        this.opts = {
            origin: params.origin || DEFAULT_CLOUD_ORIGIN,
            fetch: params.fetch || _fetch,
            credentials: params.credentials
        }
    }

    private getAuthHeader(): StringMap {
        const {username, api_key} = this.opts.credentials
        const encoded = Buffer.from(`${username}:${api_key}`, 'binary').toString('base64')
        return {Authorization: `Basic ${encoded}`}
    }

    private async getHeaders(): Promise<StringMap> {
        const pkg = await getPkgJSON()
        return {
            'User-Agent': `${pkg.name}@${pkg.version}`,
            ...this.getAuthHeader()
        }
    }

    private async throwForStatus(res: Response) {
        if (res.status < 400) {
            return
        }

        const body = await res.text()
        let error: {message?: string; docs_url?: string}
        try {
            error = JSON.parse(body)
        } catch {
            error = {} // Cloud doesn't always return JSON
        }

        if (res.status === 403) {
            error.docs_url =
                'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/mrt-overview.html#users,-abilities,-and-roles'
        }

        throw new Error(
            [
                `HTTP ${res.status}`,
                error.message || body,
                `For more information visit ${error.docs_url || DEFAULT_DOCS_URL}`
            ].join('\n')
        )
    }

    async push(bundle: Bundle, projectSlug: string, target?: string) {
        const base = `api/projects/${projectSlug}/builds/`
        const pathname = target ? base + `${target}/` : base
        const url = new URL(this.opts.origin)
        url.pathname = pathname

        const body = Buffer.from(JSON.stringify(bundle))
        const headers = {
            ...(await this.getHeaders()),
            'Content-Length': body.length.toString()
        }

        const res = await this.opts.fetch(url.toString(), {
            body,
            method: 'POST',
            headers
        })
        await this.throwForStatus(res)
        return await res.json()
    }

    async createLoggingToken(project: string, environment: string): Promise<string> {
        const url = new URL(this.opts.origin)
        url.pathname = `/api/projects/${project}/target/${environment}/jwt/`
        const headers = {
            ...(await this.getHeaders()),
            // Annoyingly, the new logging endpoint only accepts an
            // Authorization header that is inconsistent with our older APIs!
            Authorization: `Bearer ${this.opts.credentials.api_key}`
        }
        const res = await this.opts.fetch(url.toString(), {
            method: 'POST',
            headers
        })
        await this.throwForStatus(res)
        const data = await res.json()
        return data['token']
    }

    /** Polls MRT for deployment status every 30 seconds. */
    async waitForDeploy(project: string, environment: string): Promise<void> {
        return new Promise((resolve, reject) => {
            /** Milliseconds to wait between checks. */
            const delay = 30_000
            /** Check the deployment status to see whether it has finished. */
            const check = async (): Promise<void> => {
                const url = new URL(
                    `/api/projects/${project}/target/${environment}`,
                    this.opts.origin
                )
                const res = await this.opts.fetch(url, {headers: await this.getHeaders()})

                if (!res.ok) {
                    const text = await res.text()
                    let json
                    try {
                        if (text) json = JSON.parse(text)
                    } catch (_) {} // eslint-disable-line no-empty
                    const message = json?.detail ?? text
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    const detail = message ? `: ${message}` : ''
                    throw new Error(`${res.status} ${res.statusText}${detail}`)
                }

                const data: {state: string} = await res.json()
                if (typeof data.state !== 'string') {
                    return reject(
                        new Error('An unknown state occurred when polling the deployment.')
                    )
                }
                switch (data.state) {
                    case 'CREATE_IN_PROGRESS':
                    case 'PUBLISH_IN_PROGRESS':
                        // In progress - check again after the next delay
                        // `check` is async, so we need to use .catch to properly handle errors
                        setTimeout(() => void check().catch(reject), delay)
                        return
                    case 'CREATE_FAILED':
                    case 'PUBLISH_FAILED':
                        // Failed - reject with failure
                        return reject(new Error('Deployment failed.'))
                    case 'ACTIVE':
                        // Success!
                        return resolve()
                    default:
                        // Unknown - reject with confusion
                        return reject(new Error(`Unknown deployment state "${data.state}".`))
                }
            }
            // Start checking after the first delay!
            setTimeout(() => void check().catch(reject), delay)
        })
    }
}

export const defaultMessage = (gitInstance: typeof git = git): string => {
    try {
        return `${gitInstance.branch()}: ${gitInstance.short()}`
    } catch (err: any) {
        if (err?.code === 'ENOENT') {
            console.log(
                'Using default bundle message as no message was provided and not in a Git repo.'
            )
        }
        return 'PWA Kit Bundle'
    }
}

interface CreateBundleArgs {
    message: string | null | undefined
    ssr_parameters: any
    ssr_only: string[]
    ssr_shared: string[]
    buildDirectory: string
    projectSlug: string
}

export const createBundle = async ({
    message,
    ssr_parameters,
    ssr_only,
    ssr_shared,
    buildDirectory,
    projectSlug
}: CreateBundleArgs): Promise<Bundle | any> => {
    message = message || defaultMessage()

    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'pwa-kit-dev-'))
    const destination = path.join(tmpDir, 'build.tar')
    const filesInArchive: string[] = []
    let bundle_metadata: {[key: string]: any} = {}

    if (ssr_only.length === 0 || ssr_shared.length === 0) {
        throw new Error('no ssrOnly or ssrShared files are defined')
    }

    return (
        Promise.resolve()
            .then(() => stat(buildDirectory))
            .catch(() => {
                const fullPath = path.join(process.cwd(), buildDirectory)
                throw new Error(
                    `Build directory at path "${fullPath}" not found.\n` +
                        'Run `pwa-kit-dev build` first!'
                )
            })
            .then(
                () =>
                    new Promise((resolve, reject) => {
                        const output = createWriteStream(destination)
                        const archive = archiver('tar')

                        archive.pipe(output)

                        // See https://web.archive.org/web/20160712064705/http://archiverjs.com/docs/global.html#TarEntryData
                        const newRoot = path.join(projectSlug, 'bld', '')
                        // WARNING: There are a lot of type assertions here because we use a very old
                        // version of archiver, and the types provided don't match the docs. :\
                        archive.directory(buildDirectory, '', ((entry: EntryData) => {
                            const stats = entry.stats as unknown as Stats | undefined
                            if (stats?.isFile() && entry.name) {
                                filesInArchive.push(entry.name)
                            }
                            entry.prefix = newRoot
                            return entry
                        }) as unknown as EntryData)

                        archive.on('error', reject)
                        output.on('finish', resolve)

                        archive.finalize()
                    })
            )
            .then(async () => {
                const {
                    dependencies = {},
                    devDependencies = {},
                    ccExtensibility = {extends: '', overridesDir: ''}
                } = await getProjectPkg()
                const extendsTemplate = 'node_modules/' + ccExtensibility.extends

                let cc_overrides: string[] = []
                if (ccExtensibility.overridesDir) {
                    const overrides_files = await walkDir(
                        ccExtensibility.overridesDir,
                        ccExtensibility.overridesDir
                    )
                    cc_overrides = Array.from(overrides_files).filter((item) =>
                        existsSync(path.join(extendsTemplate, item))
                    )
                }
                const dependencyTree = await getProjectDependencyTree()
                // If we can't load the dependency tree, pretend that it's empty.
                // TODO: Should we report an error?
                const pwaKitDeps = dependencyTree ? getPwaKitDependencies(dependencyTree) : {}

                bundle_metadata = {
                    dependencies: {
                        ...dependencies,
                        ...devDependencies,
                        ...(pwaKitDeps ?? {})
                    },
                    cc_overrides: cc_overrides
                }
            })
            .then(() => readFile(destination))
            .then((data) => {
                const encoding = 'base64'
                return {
                    message,
                    encoding,
                    data: data.toString(encoding),
                    ssr_parameters,
                    ssr_only: filesInArchive.filter(glob(ssr_only)),
                    ssr_shared: filesInArchive.filter(glob(ssr_shared)),
                    bundle_metadata
                }
            })
            // This is a false positive. The promise returned by `.finally()` won't resolve until
            // the `rm()` completes!
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            .finally(() => rm(tmpDir, {recursive: true}))
    )
}

export const glob = (patterns?: string[]): ((str: string) => boolean) => {
    // The patterns can include negations, so matching is done against all
    // the patterns. A match is true if a given path matches any pattern and
    // does not match any negating patterns.

    const allPatterns = (patterns || [])
        .map((pattern) => new Minimatch(pattern, {nocomment: true}))
        .filter((pattern) => !pattern.empty)
    const positivePatterns = allPatterns.filter((pattern) => !pattern.negate)
    const negativePatterns = allPatterns.filter((pattern) => pattern.negate)

    return (path: string) => {
        if (path) {
            const positive = positivePatterns.some((pattern) => pattern.match(path))
            const negative = negativePatterns.some((pattern) => !pattern.match(path))
            return positive && !negative
        }
        return false
    }
}

export const getCredentialsFile = (cloudOrigin: string, credentialsFile?: string): string => {
    if (credentialsFile) {
        return credentialsFile
    } else {
        const url = new URL(cloudOrigin)
        const host = url.host
        const suffix = host === 'cloud.mobify.com' ? '' : `--${host}`
        return path.join(os.homedir(), `.mobify${suffix}`)
    }
}

export const readCredentials = async (filepath: string): Promise<Credentials> => {
    try {
        const data = await readJson(filepath)
        return {
            username: data.username,
            api_key: data.api_key
        }
    } catch (e) {
        throw new Error(
            `Credentials file "${filepath}" not found.\n` +
                'Visit https://runtime.commercecloud.com/account/settings for ' +
                'steps on authorizing your computer to push bundles.'
        )
    }
}

interface LogRecord {
    level: string | undefined
    message: string
    shortRequestId?: string
}

export const parseLog = (log: string): LogRecord => {
    const parts = log.trim().split('\t')
    let requestId, shortRequestId, level

    if (
        parts.length >= 3 &&
        validator.isISO8601(parts[0]) &&
        validator.isUUID(parts[1]) &&
        validator.isAlpha(parts[2])
    ) {
        // An application log
        parts.shift()
        requestId = parts.shift()
        level = parts.shift()
    } else {
        // A platform log
        const words = parts[0].split(' ')
        level = words.shift()
        parts[0] = words.join(' ')
    }
    const message = parts.join('\t')

    const match = /(?<id>[a-f\d]{8})/.exec(requestId || message)
    if (match) {
        shortRequestId = match.groups?.id
    }
    return {level, message, shortRequestId}
}
