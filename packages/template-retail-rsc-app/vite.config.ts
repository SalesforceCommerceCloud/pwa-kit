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
 */
export default defineConfig({
    server: {
        proxy: {
            '/mobify/proxy/api': 'http://localhost:3000'
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
