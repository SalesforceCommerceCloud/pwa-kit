import os from 'os'
import path from 'path'
import archiver from 'archiver'
import _fetch from 'node-fetch'
import {URL} from 'url'
import {readFile, stat, mkdtemp, rmdir} from 'fs/promises'
import {createWriteStream} from 'fs'
import {Minimatch} from 'minimatch'
import git from 'git-rev-sync'

export const DEFAULT_CLOUD_ORIGIN = 'https://cloud.mobify.com'
export const DEFAULT_DOCS_URL =
    'https://developer.salesforce.com/docs/commerce/pwa-kit-managed-runtime/guide/pushing-and-deploying-bundles.html'


interface Credentials {
    username: string
    api_key: string
}


interface CloudAPIClientOpts {
    credentials: Credentials,
    origin?: string
    fetch?: Function
}


interface StringMap {[key: string]: string;}


interface Bundle {
    message: string
    encoding: string
    data: string
    ssr_parameters: object
    ssr_only: string[]
    ssr_shared: string[]
}

export const getPkgJSON = async () => {
    const data = await readFile(path.join(__dirname, '..', '..', 'package.json'))
    return JSON.parse(data.toString('utf-8'))
}


export class CloudAPIClient {
    private opts: Required<CloudAPIClientOpts>

    constructor(params: CloudAPIClientOpts) {
        this.opts = {
            origin: params.origin || DEFAULT_CLOUD_ORIGIN,
            fetch: params.fetch || _fetch,
            credentials: params.credentials,
        }
    }

    private getAuthHeader(): StringMap {
        const {username, api_key} = this.opts.credentials
        const encoded = Buffer.from(`${username}:${api_key}`, 'binary').toString('base64')
        return {'Authorization': `Basic ${encoded}`}
    }

    private async getHeaders(extras: StringMap): Promise<StringMap> {
        const pkg = await getPkgJSON()
        return {
            'User-Agent': `${pkg.name}@${pkg.version}`,
            ...this.getAuthHeader(),
            ...extras,
        }
    }

    private async throwForStatus(res) {
        if (res.status < 400) {
            return
        }

        let error
        try {
            error = await res.json()
        } catch (err) {
            error = {}  // Cloud doesn't always return JSON
        }

        throw new Error(
            [
                `HTTP ${res.status}`,
                error.message || res.body,
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
        const headers = await this.getHeaders({'Content-Length': body.length.toString()})

        const res = await this.opts.fetch(url.toString(), {
            body,
            method: 'POST',
            headers,
        })
        await this.throwForStatus(res)
        return await res.json()
    }
}

export const defaultMessage = (gitInstance: git = git): string => {
    try {
        return `${gitInstance.branch()}: ${gitInstance.short()}`
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log('Using default bundle message as no message was provided and not in a Git repo.')
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
        projectSlug,
    }: CreateBundleArgs) : Promise<Bundle> => {

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
                `[Error: Build directory at path "${fullPath}" not found.]\n` +
                'Run `pwa-kit-dev build` first!'
            )
        })
        .then(() => new Promise((resolve, reject) => {
            const output = createWriteStream(destination)
            const archive = archiver('tar')

            archive.pipe(output)

            // See https://archiverjs.com/docs/global.html#TarEntryData
            const newRoot = path.join(projectSlug, 'bld', '')
            archive.directory(
                buildDirectory,
                '',
                (entry) => {
                    if (entry.stats.isFile()) {
                        filesInArchive.push(entry.name)
                    }
                    entry.prefix = newRoot
                    return entry
                }
            )

            archive.on('error', reject)
            output.on('finish', resolve)

            archive.finalize()
        }))
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
            }
        })
        .finally(() => rmdir(tmpDir, {recursive: true}))
}




type MatchFn = (a: string) => boolean;

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

export const findHomeDir = (platform: string = process.platform) => platform === 'win32' ? process.env.USERPROFILE : process.env.HOME

export const getCredentialsFile = (cloudOrigin: string, credentialsFile?: string, doFindHomeDir: () => string = findHomeDir): string => {
    if (credentialsFile) {
        return credentialsFile
    } else {
        const url = new URL(cloudOrigin)
        const host = url.host
        const suffix = (host === 'cloud.mobify.com') ? '' : `--${host}`
        return path.join(doFindHomeDir(), `.mobify${suffix}`)
    }
}


export const readCredentials = async (filepath: string): Promise<Credentials> => {
    try {
        const content = await readFile(filepath)
        const data = JSON.parse(content.toString('utf-8'))
        return  {
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
