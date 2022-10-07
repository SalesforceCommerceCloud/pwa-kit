import path from 'path'
import git from 'git-rev-sync'
import archiver from 'archiver'
import {version as SDK_VERSION} from '../package.json'
import _fetch from 'node-fetch'
import {URL} from 'node:url'
import {readFile, stat} from 'fs/promises'
import {createWriteStream} from 'fs'
import minimatch from 'minimatch'



interface Credentials {
    username: string
    api_key: string
}


interface CloudAPIClientOpts {
    origin: string
    credentials: Credentials,
    fetch: Function
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


class CloudAPIClient {
    private opts: CloudAPIClientOpts

    constructor(params: Partial<CloudAPIClientOpts> = {}) {
        this.opts = {
            origin: 'https://cloud.mobify.com',
            credentials: null,
            fetch: _fetch,
            ...params,
        }
    }

    private getAuthHeader(): StringMap {
        const {username, api_key} = this.opts.credentials
        const encoded = Buffer.from(`${username}:${api_key}`, 'binary').toString('base64')
        return {'Authorization': `Basic ${encoded}`}
    }

    private getHeaders(extras: StringMap): StringMap {
        return {
            'User-Agent': `progressive-web-sdk#${SDK_VERSION}`,
            ...this.getAuthHeader(),
            ...extras,
        }
    }

    async push(projectSlug, target='', bundle: Bundle) {
        const base = `api/projects/${projectSlug}/builds/`
        const pathname = target ? base + `${target}/` : base
        const url = new URL(this.opts.origin)
        url.pathname = pathname

        const body = Buffer.from(JSON.stringify(bundle))
        const res = await this.opts.fetch(url.toString(), {
            body,
            method: 'POST',
            headers: this.getHeaders({'Content-Length': body.length.toString()})
        })
    }
}



const createBundle = async (
    message: string = '',
    ssr_parameters: any,
    ssr_only: string[] = [],
    ssr_shared: string[] = [],
    buildDirectory: string,
    projectSlug: string,
    ) : Promise<Bundle> => {

    try {
        await stat(buildDirectory)
    } catch (e) {
        const fullPath = path.join(process.cwd(), buildDirectory)
        throw new Error(
            `[Error: Build directory at path "${fullPath}" not found.]\n` +
            'You must first run the Progressive Web SDK build process before uploading a bundle.'
        )
    }


    const filesInArchive = []

    await new Promise((resolve, reject) => {
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
    })

    const data = await readFile(destination).toString('base64')

    return {
        message,
        encoding: 'base64',
        data,
        ssr_parameters,
        ssr_only: filesInArchive.filter(glob(ssr_only)),
        ssr_shared: filesInArchive.filter(glob(ssr_shared)),
    }
}




type MatchFn = (a: string) => boolean;

const glob = (patterns: string[]): MatchFn => {

    // The patterns can include negations, so matching is done against all
    // the patterns. A match is true if a given path matches any pattern and
    // does not match any negating patterns.

    const allPatterns = (patterns || [])
        .map((pattern) => new minimatch.Minimatch(pattern, {nocomment: true}))
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
