/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import os from 'os'
import path from 'path'
import archiver from 'archiver'
import _fetch from 'node-fetch'
import {URL} from 'url'
import {readFile, stat, mkdtemp, rmdir} from 'fs/promises'
import {createWriteStream} from 'fs'
import {readJson} from 'fs-extra'
import {Minimatch} from 'minimatch'
import git from 'git-rev-sync'
import validator from 'validator'

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
    fetch?: _fetch
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
    return {name: 'pwa-kit-dev', version: 'unknown'}
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

    private async throwForStatus(res: _fetch.Response) {
        if (res.status < 400) {
            return
        }

        const body = await res.text()
        let error
        try {
            error = JSON.parse(body)
        } catch (err) {
            error = {} // Cloud doesn't always return JSON
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
}

export const defaultMessage = (gitInstance: git = git): string => {
    try {
        return `${gitInstance.branch()}: ${gitInstance.short()}`
    } catch (err) {
        if (err.code === 'ENOENT') {
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
}: CreateBundleArgs): Promise<Bundle> => {
    message = message || defaultMessage()

    const tmpDir = await mkdtemp(path.join(os.tmpdir(), 'pwa-kit-dev-'))
    const destination = path.join(tmpDir, 'build.tar')
    const filesInArchive = []

    if (ssr_only.length === 0 || ssr_shared.length === 0) {
        throw new Error('no ssrOnly or ssrShared files are defined')
    }

    return Promise.resolve()
        .then(() => stat(buildDirectory))
        .catch((e) => {
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

                    // See https://archiverjs.com/docs/global.html#TarEntryData
                    const newRoot = path.join(projectSlug, 'bld', '')
                    archive.directory(buildDirectory, '', (entry) => {
                        if (entry.stats.isFile()) {
                            filesInArchive.push(entry.name)
                        }
                        entry.prefix = newRoot
                        return entry
                    })

                    archive.on('error', reject)
                    output.on('finish', resolve)

                    archive.finalize()
                })
        )
        .then(() => readFile(destination))
        .then((data) => {
            const encoding = 'base64'
            return {
                message,
                encoding,
                data: data.toString(encoding),
                ssr_parameters,
                ssr_only: filesInArchive.filter(glob(ssr_only)),
                ssr_shared: filesInArchive.filter(glob(ssr_shared))
            }
        })
        .finally(() => rmdir(tmpDir, {recursive: true}))
}

type MatchFn = (a: string) => boolean

export const glob = (patterns?: string[]): MatchFn => {
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
    level: string
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
        shortRequestId = match.groups.id
    }
    return {level, message, shortRequestId}
}
