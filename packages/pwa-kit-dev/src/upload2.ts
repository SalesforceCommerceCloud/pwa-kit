import path from 'path'
import git from 'git-rev-sync'
import archiver from 'archiver'
import fileUtils from './file-utils'
import {Matcher} from '../dist/utils/glob'
import {version as SDK_VERSION} from '../package.json'
import _fetch from 'node-fetch'
import {URL} from 'node:url'
import {readFile, stat} from 'fs/promises'



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
    ssr_parameters: any
    ssr_only: string[]
    ssr_shared: string[]
}


class CloudAPIClient {
    opts: CloudAPIClientOpts

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
        await stat(path)
    } catch (e) {
        const fullPath = path.join(process.cwd(), buildDirectory)
        throw new Error(
            `[Error: Build directory at path "${fullPath}" not found.]\n` +
            'You must first run the Progressive Web SDK build process before uploading a bundle.'
        )
    }


    const filesInArchive = []

    await new Promise((resolve, reject) => {
        const output = fileUtils.createWriteStream(destination)
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
        ssr_only: filesInArchive.filter(new Matcher(ssr_only).filter),
        ssr_shared: filesInArchive.filter(new Matcher(ssr_shared).filter),
    }

}

