/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {createHash} from 'node:crypto'
import {readFile, mkdir, writeFile} from 'node:fs/promises'
import {createServer} from 'node:http'
import {createRequire} from 'node:module'
import {fileURLToPath} from 'node:url'

const localRequire = createRequire(import.meta.url)
const devRequire = createRequire(
    new URL('../../packages/pwa-kit-dev/package.json', import.meta.url)
)
const webpack = devRequire('webpack')
const asset = localRequire('./asset.json')
const cache = new URL('./.cache/', import.meta.url)
const widgetPath = new URL('inline-agent-widget.umd.js', cache)
const storefront = new URL('../../packages/template-retail-react-app/', import.meta.url)

const checked = (bytes) => createHash('sha256').update(bytes).digest('hex') === asset.sha256
await mkdir(cache, {recursive: true})
const cached = await readFile(widgetPath).catch((error) => {
    if (error.code !== 'ENOENT') throw error
})
if (!cached || !checked(cached)) {
    const response = await fetch(asset.url, {redirect: 'error', signal: AbortSignal.timeout(30000)})
    if (!response.ok) throw new Error(`Embedded widget asset returned HTTP ${response.status}`)
    const bytes = Buffer.from(await response.arrayBuffer())
    if (!checked(bytes)) throw new Error('Embedded widget asset checksum mismatch')
    await writeFile(widgetPath, bytes)
}

const compiler = webpack({
    mode: 'production',
    entry: fileURLToPath(new URL('./fixture.jsx', import.meta.url)),
    output: {path: fileURLToPath(cache), filename: 'fixture.js'},
    optimization: {minimize: false},
    resolve: {
        extensions: ['.js', '.jsx', '.json'],
        modules: [fileURLToPath(new URL('node_modules', storefront)), 'node_modules'],
        alias: {
            '@salesforce/retail-react-app': fileURLToPath(storefront),
            '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths$': fileURLToPath(
                new URL(
                    '../../packages/pwa-kit-runtime/src/utils/ssr-namespace-paths.js',
                    import.meta.url
                )
            )
        }
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                loader: devRequire.resolve('babel-loader'),
                options: {
                    babelrc: false,
                    configFile: false,
                    presets: [devRequire.resolve('@babel/preset-react')]
                }
            }
        ]
    }
})
await new Promise((resolve, reject) => {
    compiler.run((error, stats) => {
        compiler.close((closeError) => {
            if (error || closeError) return reject(error || closeError)
            if (stats.hasErrors()) return reject(new Error(stats.toString('errors-only')))
            resolve()
        })
    })
})

const fixture = await readFile(new URL('fixture.js', cache))
const html = `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Widget PDP fixture</title>
<div id="root"></div><script defer src="/fixture.js"></script></html>`

createServer((request, response) => {
    const {pathname} = new URL(request.url, 'http://127.0.0.1')
    if (pathname === '/fixture.js') {
        response.writeHead(200, {'Content-Type': 'application/javascript'}).end(fixture)
    } else if (pathname === '/' || pathname.startsWith('/product/')) {
        response.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'}).end(html)
    } else {
        response.writeHead(404).end()
    }
}).listen(4177, '127.0.0.1')
