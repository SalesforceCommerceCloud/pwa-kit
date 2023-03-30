const path = require('path')
const fs = require('fs')
const glob = require('glob')

class OverridesResolverPlugin {
    constructor(options) {
        this.options = options
        this.projectDir = process.cwd()
        const pkg = require(path.resolve(this.projectDir, 'package.json'))
        const OVERRIDES_EXTENSIONS = '.+(js|jsx|ts|tsx|svg|jpg|jpeg)'
        
        const globPattern = `${pkg?.mobify?.overridesDir?.replace(
            /\//,
            ''
        )}/**/*${OVERRIDES_EXTENSIONS}`
        const overridesFsRead = glob.sync(globPattern)
        
        this.overridesHashMap = new Map()
        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf('/index'))
            const [l, ...rest] = item?.split(/(index|\.)/)
            this.overridesHashMap.set(
                l.replace(/\/$/, '')?.replace(pkg?.mobify?.overridesDir?.replace(/\//, ''), ''),
                [end, rest]
            )
        })
        console.log('overridesHashMap', this.overridesHashMap)


    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync('OverridesResolverPlugin', (requestContext, resolveContext, callback) => {
            // console.log('requestContext', requestContext)
            // console.log('resolveContext', resolveContext)

            if (requestContext.request.startsWith('^')) {
                const resolved = path.resolve(requestContext.path, requestContext.request)
                const relativePath = resolved?.split(`^`)?.[1]?.replace(/^\//, '')
                const newPath = path.resolve(this.projectDir, 'node_modules', relativePath)
                
                const target = resolver.ensureHook('resolved')
                requestContext.path = newPath
                resolver.doResolve(
                    target, requestContext, 'extending from template', resolveContext, callback)

            } else if (requestContext.request.startsWith('.')) {
                //something in here to deal with RELATIVE IMPORTS
                //everything that does NOT come from node modules starts with a .
                //request with a . is not an external dependency
                const resolved = path.resolve(requestContext.path, requestContext.request)
                const relativePath = resolved?.split(`^`)?.[1]?.replace(/^\//, '')

                if (this.overridesHashMap.has(relativePath)) {
                    const target = resolver.ensureHoo('resolved')
                    resolver.doResolve(
                        target, requestContext, 'relative import override', resolveContext, callback
                    )
                }
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