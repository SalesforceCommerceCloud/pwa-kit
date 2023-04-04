const path = require('path')
const fs = require('fs')
const glob = require('glob')

class OverridesResolverPlugin {
    constructor(projectDir) {
        // projectDir = /Users/yunakim/cc-pwa/pwa-kit/packages/spike-extendend-retail-app
        this.projectDir = projectDir
        this.pkg = require(path.resolve(this.projectDir, 'package.json'))
        this.overridesHashMap = new Map()

        const OVERRIDES_EXTENSIONS = '.+(js|jsx|ts|tsx|svg|jpg|jpeg)'
        const globPattern = `${this.pkg?.mobify?.overridesDir?.replace(
            /\//,
            ''
        )}/**/*${OVERRIDES_EXTENSIONS}`
        const overridesFsRead = glob.sync(globPattern)
        
        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf('/index'))
            const [l, ...rest] = item?.split(/(index|\.)/)
            this.overridesHashMap.set(
                l.replace(/\/$/, '')?.replace(this.pkg?.mobify?.overridesDir?.replace(/\//, ''), ''),
                [end, rest]
            )
        })
        console.log('overridesHashMap', this.overridesHashMap)


    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync('OverridesResolverPlugin', (requestContext, resolveContext, callback) => {
            console.log('requestContext', requestContext)
            console.log('resolveContext', resolveContext)
            console.log('ALL RESOLVED', path.resolve(requestContext.path, requestContext.request))

            if (requestContext.request.startsWith('^')) {
                const resolved = path.resolve(requestContext.path, requestContext.request)
                const relativePath = resolved?.split(`^`)?.[1]?.replace(/^\//, '')
                const newPath = path.resolve(this.projectDir, 'node_modules', relativePath)
                requestContext.path = newPath
                
                const target = resolver.ensureHook('resolved')
                resolver.doResolve(
                    target, requestContext, 'extending from template', resolveContext, callback)

            } else if (requestContext.request.startsWith('.')) {
                //something in here to deal with RELATIVE IMPORTS
                //everything that does NOT come from node modules starts with a .
                //request with a . is not an external dependency

                // this should be '/Users/yunakim/cc-pwa/pwa-kit/packages/template-retail-react-app/app/components/icons/index.jsx'
                const resolved = path.resolve(requestContext.path, requestContext.request)
                console.log('resolved', resolved)

                // this would equal something like 'retail-react-app', but should be 'template-retail-react-app'
                const extendsPkg = this.pkg?.mobify?.extends

                // this would equal something like '/app/components/icons/index.jsx'
                const relativePath = resolved?.split?.(extendsPkg)?.[1]
                console.log('relativePath', relativePath)

                // this should be /app/components/icons
                const relativePathNoExt = resolved?.split?.(extendsPkg)?.[1]?.split?.('.')?.[0]

                if (this.overridesHashMap.has(relativePathNoExt)) {
                    const newPath = this.projectDir + this.pkg?.mobify?.overridesDir + relativePath
                    requestContext.path = newPath

                    const target = resolver.ensureHook('resolved')
                    resolver.doResolve(
                        target, requestContext, 'relative import override', resolveContext, callback
                    )
                }
                //new version works before file system even resolves ? ? ?
            } else {
                callback()
            }

            //TODO: overwrite just 1 file to get it to load
            // get these files to resolve and route correctly
            //findfile ==== our glob sync algorithm (_overridesmap)

        })
    }
}

module.exports = OverridesResolverPlugin