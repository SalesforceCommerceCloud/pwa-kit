const path = require('path')
const fs = require('fs')

class OverridesResolverPlugin {
    constructor(options) {
        this.options = options
    }

    apply(resolver) {
        const target = resolver.ensureHook('resolved')
        resolver.getHook('describedRelative').tapAsync('OverridesResolverPlugin', (request, resolveContext, callback) => {
            const {request: requestPath} = request
            const {config} = this.options

            if (requestPath.startsWith('@sfcc-core')) {
                const overridePath = path.join(config.overridesDir, requestPath.replace('@sfcc-core/', ''))
                if (fs.existsSync(overridePath)) {
                    const obj = Object.assign({}, request, {
                        path: overridePath,
                        relativePath: request.relativePath && request.relativePath.replace('@sfcc-core/', ''),
                        request: overridePath,
                    })
                    return resolver.doResolve(target, obj, 'Overriding @sfcc-core module', resolveContext, callback)
                }
            }

            callback()
        })
    }
}

module.exports = OverridesResolverPlugin