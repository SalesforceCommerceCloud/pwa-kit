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
        console.log('overridesFsRead', overridesFsRead)
        
        overridesFsRead.forEach((item) => {
            const end = item.substring(item.lastIndexOf('/index'))
            const [l, ...rest] = item?.split(/(index|\.)/)
            this.overridesHashMap.set(
                l.replace(/\/$/, '')?.replace(this.pkg?.mobify?.overridesDir?.replace(/\//, ''), ''),
                [end, rest]
            )
        })
        console.log('overridesHashMap', this.overridesHashMap)
         
        // ++++++++++++++++++++++++++++++++++

        // app base = overrides = spike-extendend
        // overlays = extends (ITS SWITCHED!!!!!!!) = retail-react
        // 
        this.appBase = '.' + this.pkg.mobify.overridesDir // ./pwa-kit/overrides
        this.overlays = [this.pkg.mobify.extends] //retail-react-app

        this._allSearchDirs = this.overlays
            .map((o) => './node_modules/' + o)
            .concat([this.appBase])

        console.log('this._allSearchDirs', this._allSearchDirs)

    }

    findFile(requestPath, dirs, extensions) {
        // TODO search all overlay extensions of requested file
        var fileExt = path.extname(requestPath)
        for (var dir of dirs) {
            var base = path.join(dir, requestPath)
            if (fileExt) {
                if (fs.existsSync(base)) {
                    return base
                }
            } else {
                // TODO this is technically not how we should find index
                // see resolver plugin docs
                if (fs.existsSync(base) && fs.lstatSync(base).isDirectory()) {
                    base = path.join(base, 'index')
                }
                for (var ext of extensions) {
                    if (fs.existsSync(base + ext)) {
                        return base + ext
                    }
                }
            }
        }
    }

    toOverlayRelative(p) {
        var overlay = this.findOverlay(p)
        console.log('overlay', overlay)
        return p.substring(overlay.length + 1)
    }

    findOverlay(p) {
        return this._allSearchDirs.find((overlay) => {
            return p.indexOf(overlay) === 0
        })
    }

    apply(resolver) {
        resolver.getHook('resolve').tapAsync('OverridesResolverPlugin', (requestContext, resolveContext, callback) => {
            console.log('requestContext', requestContext)
            console.log('resolveContext', resolveContext)

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

                const overlayRelative = this.toOverlayRelative(requestContext.context.issuer)
                console.log('overlayRelative', overlayRelative)

                // this should be '/Users/yunakim/cc-pwa/pwa-kit/packages/template-retail-react-app/app/components/icons/index.jsx'
                const resolved = path.resolve(requestContext.path, requestContext.request)

                // this would equal something like 'retail-react-app', but should be 'template-retail-react-app'
                const extendsPkg = this.pkg?.mobify?.extends

                // this would equal something like '/app/components/icons/index.jsx'
                const relativePath = resolved?.split?.(extendsPkg)?.[1]

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