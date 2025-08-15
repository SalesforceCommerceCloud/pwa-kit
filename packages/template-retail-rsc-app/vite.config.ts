import {resolve} from 'node:path'
import type {Plugin} from 'vite'
import rsc from '@vitejs/plugin-rsc'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {reactRouter} from './react-router-vite/plugin'
import {defineConfig} from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'

/**
 * @see {@link https://vite.dev/config/}
 * @see {@link https://github.com/http-party/node-http-proxy?tab=readme-ov-file#modify-response}
 */
export default defineConfig({
    server: {
        proxy: {
            // Proxy Commerce Cloud API requests directly to your instance
            '/mobify/proxy/api': {
                target: 'https://8o7m175y.api.commercecloud.salesforce.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/mobify\/proxy\/api/, ''),
                configure: (proxy, _options) => {
                    proxy.on('proxyReq', (proxyReq, req) => {
                        console.log(
                            '🔄 Proxying request:',
                            req.method,
                            req.url,
                            '→',
                            proxyReq.getHeader('host') + proxyReq.path
                        )
                    })
                    proxy.on('proxyRes', (proxyRes, req) => {
                        if (
                            typeof proxyRes.statusCode === 'number' &&
                            proxyRes.statusCode >= 200 &&
                            proxyRes.statusCode <= 399
                        ) {
                            console.log('✅ Proxy response:', proxyRes.statusCode, req.url)
                        } else {
                            const body: Buffer[] = []
                            proxyRes.on('data', (chunk: Buffer) => {
                                body.push(chunk)
                            })
                            proxyRes.on('end', () => {
                                console.log(
                                    '❌ Proxy error:',
                                    proxyRes.statusCode,
                                    req.url,
                                    Buffer.concat(body).toString()
                                )
                            })
                        }
                    })
                    proxy.on('error', (err, req) => {
                        console.error('❌ Proxy error:', err.message, req.url)
                    })
                }
            }
        }
    },
    plugins: [
        transformRequireNodeFetch(),
        react(),
        tailwindcss(),
        reactRouter(),
        rsc({
            entries: {
                client: './react-router-vite/entry.browser.tsx',
                ssr: './react-router-vite/entry.ssr.single.tsx',
                rsc: './react-router-vite/entry.rsc.tsx'
            },
            serverHandler: {
                environmentName: 'ssr',
                entryName: 'index'
            }
        }),
        devtoolsJson()
    ],
    resolve: {
        alias: {
            '@': resolve(__dirname, './src')
        }
    },
    optimizeDeps: {
        include: ['react-router', 'react-router/internal/react-server-client', 'react-icons']
    },
    ssr: {
        noExternal: ['react-icons']
    },
    define: {
        global: 'globalThis'
    }
})

/**
 * This is a silly plugin that's required to remove an invalid `require('node-fetch')` call
 * inside the `commerce-sdk-isomorphic` package.
 */
function transformRequireNodeFetch(): Plugin {
    return {
        name: 'transform-require-node-fetch',
        enforce: 'pre',
        transform(code: string, id: string) {
            if (!id.includes('node_modules/commerce-sdk-isomorphic/lib/index.esm.js')) {
                return
            }
            const requirePattern = /return\s*require\(['"]node-fetch['"]\)\.default;/
            const match = code.match(requirePattern)
            if (match) {
                return {
                    code: code.replace(requirePattern, 'return globalThis.fetch;'),
                    map: null
                }
            }
        }
    }
}
